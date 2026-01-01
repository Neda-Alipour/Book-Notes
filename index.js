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

app.get("/", async (req, res) => {
  try {
    let sort = req.query.sort;
    let orderBy = "date_read DESC";

    if (sort === "rating") orderBy = "rating DESC";
    if (sort === "title") orderBy = "title ASC";

    const result = await db.query("SELECT * FROM books ORDER BY " + orderBy);

    if (result.rows.length !== 0) books = result.rows
  } catch (err) {
    console.log(err)
  }
  res.render("index.ejs", { books: books });
});

app.get("/add", (req, res) => {
  res.render("add.ejs");
});

app.post("/add", async (req, res) => {
  try {
    const { title, author, notes, rating, date_read, coverUrl } = req.body
    const result = await db.query(
      "INSERT INTO books (title, author, notes, rating, date_read, coverUrl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [title, author, notes, rating, date_read, coverUrl]
    );
  } catch (err) {
    console.log(err)
  }
  res.redirect("/");
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
    const { title, author, notes, rating, date_read, coverUrl } = req.body;
    await db.query(
      "UPDATE books SET title = $1, author = $2, notes = $3, rating = $4, date_read = $5, coverUrl = $6 WHERE id = $7",
      [title, author, notes, rating, date_read, coverUrl, id]
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
        coverUrl: req.body.coverUrl
      };
    }
  }
  res.redirect("/");
});

app.post("/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM books WHERE id = $1", [id]);
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
  {
    id: 4,
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    notes: "It's good. Discovered in the attic where she spent the final years of her life, Anne Frank’s Diary has become a timeless classic; a powerful reminder of the horrors of war and a moving testament to the resilience of the human spirit.It's good. Discovered in the attic where she spent the final years of her life, Anne Frank’s Diary has become a timeless classic; a powerful reminder of the horrors of war and a moving testament to the resilience of the human spirit.It's good. Discovered in the attic where she spent the final years of her life, Anne Frank’s Diary has become a timeless classic; a powerful reminder of the horrors of war and a moving testament to the resilience of the human spirit.",
    rating: 0,
    date_read: "2255",
    coverUrl: "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1560816565i/48855.jpg"
  },
]