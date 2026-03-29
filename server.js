const express = require("express");
const mongoose = require("mongoose");

const app = express();

// middleware
app.use(express.json());
app.use(express.static(__dirname));

// connect MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/moviereview")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

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
    const movies = await Movie.find();
    res.json(movies);
});

// add movie
app.post("/movies", async (req, res) => {
    const movie = new Movie(req.body);
    await movie.save();
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

app.listen(5000, () => {
    console.log("Server running on 5000 🚀");
});