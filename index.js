const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);

const app = express();
const port = 3000;

// Set up the upload folder
const uploadFolder = path.join(__dirname, 'uploads');

// Create the upload folder if it doesn't exist
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// Get today's date in YYYY-MM-DD format
const getDateFolder = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Multer storage configuration with date-based folder structure
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dateFolder = getDateFolder();
        const dateFolderPath = path.join(uploadFolder, dateFolder);

        // Create the date-based folder if it doesn't exist
        if (!fs.existsSync(dateFolderPath)) {
            fs.mkdirSync(dateFolderPath);
        }

        cb(null, dateFolderPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Filename with timestamp
    }
});

const upload = multer({ storage: storage });

// Serve static files from the "uploads" folder
app.use('/uploads', express.static(uploadFolder));

// Home route to upload a file and list all uploaded files
app.get('/', async (req, res) => {
    try {
        const directories = await readdir(uploadFolder); // Read directories (date-based)
        let fileLinks = '';

        // Iterate over each directory (created based on date)
        for (const dir of directories) {
            const dirPath = path.join(uploadFolder, dir);
            if (fs.lstatSync(dirPath).isDirectory()) {
                const files = await readdir(dirPath); // Read files in the date-based folder
                for (const file of files) {
                    const fileUrl = `/uploads/${dir}/${file}`;
                    fileLinks += `<li><a href="${fileUrl}" target="_blank">${file}</a></li>`;
                }
            }
        }

        res.send(`
            <h1>Upload a File</h1>
            <form action="/upload" method="POST" enctype="multipart/form-data">
                <input type="file" name="file" required />
                <button type="submit">Upload</button>
            </form>
            <br>
            <h2>Uploaded Files</h2>
            <ul>
                ${fileLinks}
            </ul>
        `);
    } catch (err) {
        res.send('Error listing files');
    }
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.send('Please upload a file.');
    }

    // Generate the file URL
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
    console.log(`Server is running at http://localhost:${port}`);
});
