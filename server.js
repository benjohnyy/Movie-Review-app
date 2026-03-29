const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

console.log("Environment check:", {
    hasMongoUri: Boolean(MONGODB_URI),
    port: PORT
});

// middleware
app.use(express.json());
app.use(express.static(__dirname));

if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment.");
}

// movie schema
const movieSchema = new mongoose.Schema({
    title: String,
    genre: String,
    director: String,
    cast: String,
    reviews: [
        {
            author: String,
            text: String,
            rating: Number
        }
    ]
});

const Movie = mongoose.model("Movie", movieSchema);

// get all movies
app.get("/movies", async (req, res) => {
    const movies = await Movie.find().sort({ _id: -1 });
    res.json(movies);
});

// add movie
app.post("/movies", async (req, res) => {
    const movie = await Movie.create(req.body);
    res.json(movie);
});

// add review
app.post("/movies/:id/review", async (req, res) => {
    const movie = await Movie.findById(req.params.id);
    movie.reviews.push(req.body);
    await movie.save();
    res.json(movie);
});

// delete movie
app.delete("/movies/:id", async (req, res) => {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log("MongoDB Connected");
        app.listen(PORT, () => {
            console.log(`Server running on ${PORT}`);
        });
    })
    .catch(err => console.log("MongoDB connection failed:", err.message));
/*
const movie = new Movie(req.body);
    await movie.save();
    res.json(movie);
*/
