import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

let books = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    notes: "It's good",
    rating: 1,
    date_read: "111",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg"
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    notes: "It's bad",
    rating: 0,
    date_read: "2255",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg"
  },
  {
    id: 3,
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    notes: "It's good. Discovered in the attic where she spent the final years of her life, Anne Frank’s Diary has become a timeless classic; a powerful reminder of the horrors of war and a moving testament to the resilience of the human spirit.",
    rating: 0,
    date_read: "2255",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1560816565i/48855.jpg"
  },
]

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books");
    if (result.rows.length !== 0) books = result.rows
  } catch(err){
    console.log(err)
  }
  res.render("index.ejs", { books: books });
});

app.get("/add", (req, res) => {
  res.render("add.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
