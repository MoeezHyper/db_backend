import express from "express";
import mysql from "mysql2";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "/coverpages"));
    },
    filename: (req, file, cb) => {
        const title = req.body.title.replace(/\s+/g, "_");
        cb(null, `${title}.jpg`);
    },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
    host: "sql12.freesqldatabase.com",
    user: "sql12754296",
    password: "dhZRNCmaW2",
    database: "sql12754296",
    port: 3306,
});

app.get("/", (req, res) => {
    res.json("Hello, this is the backend");
});

app.get("/books", (req, res) => {
    const q = "SELECT * FROM books";
    db.query(q, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.delete("/books/:book_id", (req, res) => {
    const bookId = req.params.book_id;

    const selectQuery = "SELECT title FROM books WHERE book_id = ?";

    db.query(selectQuery, [bookId], (err, result) => {
        if (err) {
            console.error("Error fetching book details:", err);
            return res
                .status(500)
                .json({ error: "Failed to fetch book details" });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Book not found" });
        }

        const title = result[0].title.replace(/\s+/g, "_");
        const imageFileName = `${title}.jpg`;
        const imagePath = path.join(
            __dirname,
            "/coverpages/",
            imageFileName,
        );
        fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
                if (unlinkErr.code === "ENOENT") {
                    console.warn("Image file not found:", imagePath);
                } else {
                    console.error("Error deleting image file:", unlinkErr);
                    return res
                        .status(500)
                        .json({ error: "Failed to delete image file" });
                }
            }

            const deleteQuery = "DELETE FROM books WHERE book_id = ?";
            db.query(deleteQuery, [bookId], (deleteErr, data) => {
                if (deleteErr) {
                    console.error(
                        "Error deleting book from database:",
                        deleteErr,
                    );
                    return res
                        .status(500)
                        .json({ error: "Failed to delete book from database" });
                }

                return res
                    .status(200)
                    .json({ message: "Book and image deleted successfully!" });
            });
        });
    });
});

app.post("/books", upload.single("image"), (req, res) => {
    const { title, author, description } = req.body;

    if (!title || !author || !description) {
        return res.status(400).json({ error: "All fields are mandatory!" });
    }

    if (req.file) {
        console.log("Image saved:", req.file.path);
    }

    const query =
        "INSERT INTO books (title, author, description) VALUES (?, ?, ?)";
    db.query(query, [title, author, description], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        res.status(200).json({ message: "Book added successfully!" });
    });
});

app.listen(8800, () => {
    console.log("Connected to backend!");
});
