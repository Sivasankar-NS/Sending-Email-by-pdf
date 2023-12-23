const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 4000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

mongoose
  .connect('mongodb://127.0.0.1:27017/pdfemail', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(() => {
    console.log('Not Connected');
  });

const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  address: String,
  email: String,
  phone: String,
});

const User = mongoose.model('User', userSchema);

app.post('/generate-pdf', async (req, res) => {
  const { name, age, address, email, phone } = req.body;

  // Create a new User instance and save it to MongoDB
  const newUser = new User({ name, age, address, email, phone });
  try {
    await newUser.save();
  } catch (error) {
    console.error('Error saving user data to MongoDB:', error);
    res.status(500).json({ error: 'Failed to save user data' });
    return;
  }

  // Retrieve the data from MongoDB
  const userData = await User.findOne({ _id: newUser._id });

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 400]);
  const { width, height } = page.getSize();

  // Add content to the PDF using the retrieved data
  page.drawText(`Name: ${userData.name}`, { x: 50, y: height - 100, size: 20, color: rgb(0, 0, 0) });
  page.drawText(`Age: ${userData.age}`, { x: 50, y: height - 150, size: 20, color: rgb(0, 0, 0) });
  page.drawText(`Address: ${userData.address}`, { x: 50, y: height - 200, size: 20, color: rgb(0, 0, 0) });
  page.drawText(`Email: ${userData.email}`, { x: 50, y: height - 250, size: 20, color: rgb(0, 0, 0) });
  page.drawText(`Phone: ${userData.phone}`, { x: 50, y: height - 300, size: 20, color: rgb(0, 0, 0) });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();

  // Send the PDF as an attachment via email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'siva16cs58@gmail.com', // Replace with your email
      pass: 'uhilkxpgraspvlul', // Replace with your password
    },
  });

  const mailOptions = {
    from: 'siva16cs58@gmail.com', // Replace with your email
    to: userData.email, // Send to the user's email
    subject: 'PDF Attachment',
    text: 'Please find the attached PDF.',
    attachments: [
      {
        filename: 'user_data.pdf',
        content: pdfBytes,
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Error sending email' });
    } else {
      console.log('Email sent: ' + info.response);
      res.json({ message: 'PDF generated and sent via email' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
