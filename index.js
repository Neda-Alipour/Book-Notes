import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import axios from "axios";

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

function sortLocalBooks(books, sort) {
  const sorted = [...books]; // do NOT mutate original array

  if (sort === "rating") {
    sorted.sort((a, b) => b.rating - a.rating);
  } else if (sort === "title") {
    sorted.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // default: date_read DESC
    sorted.sort((a, b) => new Date(b.date_read) - new Date(a.date_read));
  }

  return sorted;
}

async function getCoverFromOpenLibrary(title, author) {
  // The Covers API doesn’t technically need Axios, but it’s a lot easier to use.
  try {
    const response = await axios.get(
      "https://openlibrary.org/search.json",
      {
        params: {
          title: title,
          author: author,
          limit: 1,
        },
      }
    );

    const book = response.data.docs[0];

    if (!book) return "/images/IMG_1644.JPEG";

    // Priority: ISBN → cover_i → fallback
    if (book.isbn && book.isbn.length > 0) {
      return `https://covers.openlibrary.org/b/isbn/${book.isbn[0]}-L.jpg`;
    }

    if (book.cover_i) {
      return `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    }

    return "/images/IMG_1644.JPEG";
  } catch (err) {
    console.log("Open Library API err:", err.message);
    return "/images/IMG_1644.JPEG";
  }
}


app.get("/", async (req, res) => {
  let sort = req.query.sort;
  let booksToShow = []
  try {
    let orderBy = "date_read DESC";

    if (sort === "rating") orderBy = "rating DESC";
    if (sort === "title") orderBy = "title ASC";

    const result = await db.query("SELECT * FROM books ORDER BY " + orderBy);

    if (result.rows.length !== 0) {
      booksToShow = result.rows
    } else {
      booksToShow = sortLocalBooks(books, sort);
    }
  } catch (err) {
    console.log(err)
    booksToShow = sortLocalBooks(books, sort);
  }
  res.render("index.ejs", { books: booksToShow, currentSort: sort });
});

app.get("/add", (req, res) => {
  res.render("add.ejs");
});

app.post("/add", async (req, res) => {
  try {
    let { title, author, notes, rating, date_read, cover_url } = req.body

    cover_url = await getCoverFromOpenLibrary(title, author);

    const result = await db.query(
      "INSERT INTO books (title, author, notes, rating, date_read, cover_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, author, notes, rating, date_read, cover_url]
    );
  } catch (err) {
    console.log(err)
  }
  res.redirect("/");
});

app.get("/book/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);

    if (result.rows.length > 0) {
      res.render("book.ejs", { book: result.rows[0] });
    } else {
      const book = books.find(b => b.id == id);
      if (book) {
        res.render("book.ejs", { book: book });
      } else {
        res.redirect("/");
      }
    }
  } catch (err) {
    console.log(err);
    const book = books.find(b => b.id == req.params.id);
    if (book) {
      res.render("book.ejs", { book: book });
    } else {
      res.redirect("/");
    }
  }
});

app.get("/edit/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);

    if (result.rows.length > 0) {
      res.render("edit.ejs", { book: result.rows[0] });
    } else {
      const book = books.find(b => b.id == id);
      if (book) {
        res.render("edit.ejs", { book: book });
      } else {
        res.redirect("/");
      }
    }
  } catch (err) {
    console.log(err);
    const book = books.find(b => b.id == req.params.id);
    if (book) {
      res.render("edit.ejs", { book: book });
    } else {
      res.redirect("/");
    }
  }
});

app.post("/edit/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { title, author, notes, rating, date_read, cover_url } = req.body;

    await db.query(
      "UPDATE books SET title = $1, author = $2, notes = $3, rating = $4, date_read = $5, cover_url = $6 WHERE id = $7",
      [title, author, notes, rating, date_read, cover_url, id]
    );
  } catch (err) {
    console.log(err);
    const bookIndex = books.findIndex(b => b.id == req.params.id);

    if (bookIndex !== -1) {
      books[bookIndex] = {
        ...books[bookIndex],
        title: req.body.title,
        author: req.body.author,
        notes: req.body.notes,
        rating: req.body.rating,
        date_read: req.body.date_read,
        cover_url: req.body.cover_url
      };
    }
  }
  res.redirect("/");
});

app.post("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query("DELETE FROM books WHERE id = $1", [id]);
  } catch (err) {
    console.log(err);
    const bookIndex = books.findIndex(b => b.id == req.params.id);
    if (bookIndex !== -1) {
      books.splice(bookIndex, 1);
    }
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

let books = [
  {
    id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    notes: "It's good",
    rating: 5,
    date_read: "2024-01-06",
    cover_url: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg"
  },
  {
    id: 2,
    title: "1984",
    author: "George Orwell",
    notes: "It's bad",
    rating: 3.75,
    date_read: "2024-01-10",
    cover_url: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1657781256i/61439040.jpg"
  },
  {
    id: 3,
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    notes: "It's good. Discovered in the attic where she spent the final years of her life, Anne Frank’s Diary has become a timeless classic; a powerful reminder of the horrors of war and a moving testament to the resilience of the human spirit.",
    rating: 3.5,
    date_read: "2024-01-01",
    cover_url: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1560816565i/48855.jpg"
  },
]