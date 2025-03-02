const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up the upload folder
const uploadFolder = path.join(__dirname, 'uploads');

// Create the upload folder if it doesn't exist
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// Get today's date as YYYY-MM-DD format
const getDateFolder = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Set up Multer storage configuration with dynamic directories
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dateFolder = getDateFolder(); // Generate date-based folder
        const dateFolderPath = path.join(uploadFolder, dateFolder);

        // Create the date-based folder if it doesn't exist
        if (!fs.existsSync(dateFolderPath)) {
            fs.mkdirSync(dateFolderPath);
        }

        cb(null, dateFolderPath); // Set the destination folder to the date-based folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Set filename to current timestamp
    }
});

const upload = multer({ storage: storage });

// Serve static files (uploaded files) from the "uploads" folder
app.use('/uploads', express.static(uploadFolder));

// Home route to upload a file
app.get('/', (req, res) => {
    res.send(`
        <h1>Upload a File</h1>
        <form action="/upload" method="POST" enctype="multipart/form-data">
            <input type="file" name="file" required />
            <button type="submit">Upload</button>
        </form>
    `);
});

// File upload route
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.send('Please upload a file.');
    }

    // Get the relative file path
    const fileUrl = `/uploads/${getDateFolder()}/${req.file.filename}`;
    res.send(`
        <h1>File Uploaded Successfully</h1>
        <p>Click the link below to view your file:</p>
        <a href="${fileUrl}" target="_blank">View File</a>
        <br><br>
        <a href="/">Upload Another File</a>
    `);
});

// Start the server
app.listen(port, () => {
    console.log(`File hosting server running at http://localhost:${port}`);
});
