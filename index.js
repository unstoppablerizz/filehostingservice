const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// The passcode for the admin (plain text)
const ADMIN_PASSCODE = 'your-strong-passcode';  // Change this to your own passcode

// Create an 'uploads' directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Set up Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);  // Save files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Rename files to avoid conflicts
    }
});

const upload = multer({ storage: storage });

// Serve static files (like the HTML upload form) from the 'public' folder
app.use(express.static('public'));

// Parse incoming form data (to handle the admin login form)
app.use(express.urlencoded({ extended: true }));

// Serve the uploaded files as static files
app.use('/uploads', express.static(uploadDir));

// Handle file upload by users
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`
        <h1>File Uploaded</h1>
        <p>Your file has been uploaded successfully.</p>
        <p><a href="/uploads/${req.file.filename}">Click here to download the file</a></p>
        <br>
        <a href="/">Upload another file</a>
    `);
});

// Admin login page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Handle admin login (passcode validation)
app.post('/admin', (req, res) => {
    const { passcode } = req.body;
    
    // Check if the passcode matches
    if (passcode === ADMIN_PASSCODE) {
        // If valid passcode, show the directory of uploaded files
        const files = fs.readdirSync(uploadDir).map(file => ({
            filename: file,
            url: `/uploads/${file}`
        }));
        
        res.send(`
            <h1>Admin File Directory</h1>
            <ul>
                ${files.map(file => `<li><a href="${file.url}" target="_blank">${file.filename}</a></li>`).join('')}
            </ul>
            <br>
            <a href="/admin">Log out</a>
        `);
    } else {
        res.status(401).send('Invalid passcode.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
