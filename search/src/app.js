const fetch = require("node-fetch");
const express = require("express");

// NOTE: Bad Case
// -> Share common module
const Book = require("./models/books_model");
const app = express();

app.get("/", (req, res) => {
  res.json({ msg: "search" });
});

// NOTE: Communicate with DB directly.
app.get("/api/v1/search", async (req, res) => {
  const booksPromise = Book.find({});
  const promises = [booksPromise];

  const [books] = await Promise.all(promises);

  res.json(books);
});

// NOTE: circular call chain + overhead
// -> 1 hop rule or message queue
app.get("/api/v1/search/depends-on", async (req, res) => {
  try {
    const bookPromise = fetch("http://books:3000/");
    const promises = [bookPromise];

    const [bookResponse] = await Promise.all(promises);
    const bookJson = await bookResponse.json();

    res.json({ book: bookJson });
  } catch (err) {
    res.status(500).json(err);
  }
});
