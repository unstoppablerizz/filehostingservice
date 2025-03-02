const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create an Express app
const app = express();
const port = 3000;

// Set up the file upload destination
const uploadDir = './uploads';

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup for file uploading
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Using timestamp to ensure unique filenames
  }
});

const upload = multer({ storage: storage });

// Serve static files like CSS, images, etc., from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve files from the "uploads" directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint to upload files
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // Send the file URL back as the response
  res.json({ fileUrl: `http://localhost:${port}/uploads/${req.file.filename}` });
});

// Serve a simple HTML form to upload files (optional)
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <link rel="stylesheet" type="text/css" href="/styles.css">
        <title>Upload File</title>
      </head>
      <body>
        <h1>Upload File</h1>
        <form ref='uploadForm' 
          id='uploadForm' 
          action='/upload' 
          method='post' 
          encType="multipart/form-data">
            <input type="file" name="file" />
            <input type='submit' value='Upload!' />
        </form>
        
        <div class="file-url" id="fileUrl"></div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(port, () => {
  console.log(`File hosting service running at http://localhost:${port}`);
});
