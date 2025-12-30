import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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
  res.render("index.ejs", { books: books });
});

app.get("/add", (req, res) => {
  res.render("add.ejs");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
