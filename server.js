require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/moviereview";

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const reviewSchema = new mongoose.Schema(
    {
        author: { type: String, required: true, trim: true },
        text: { type: String, required: true, trim: true },
        rating: { type: Number, required: true, min: 1, max: 5 }
    },
    { _id: false }
);

const movieSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        genre: { type: String, required: true, trim: true },
        director: { type: String, required: true, trim: true },
        cast: { type: String, required: true, trim: true },
        reviews: { type: [reviewSchema], default: [] }
    },
    { timestamps: true }
);

const Movie = mongoose.model("Movie", movieSchema);

app.get("/movies", async (req, res) => {
    try {
        const movies = await Movie.find().sort({ createdAt: -1 });
        res.json(movies);
    } catch (error) {
        res.status(500).json({ message: "Failed to load movies." });
    }
});

app.post("/movies", async (req, res) => {
    try {
        const { title, genre, director, cast } = req.body;

        if (!title || !genre || !director || !cast) {
            return res.status(400).json({ message: "All movie fields are required." });
        }

        const movie = await Movie.create({ title, genre, director, cast });
        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Failed to add movie." });
    }
});

app.post("/movies/:id/review", async (req, res) => {
    try {
        const { author, text, rating } = req.body;

        if (!author || !text || rating === undefined) {
            return res.status(400).json({ message: "Author, review text, and rating are required." });
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({ message: "Movie not found." });
        }

        movie.reviews.push({
            author,
            text,
            rating: Number(rating)
        });

        await movie.save();
        res.json(movie);
    } catch (error) {
        res.status(500).json({ message: "Failed to add review." });
    }
});

app.delete("/movies/:id", async (req, res) => {
    try {
        const deletedMovie = await Movie.findByIdAndDelete(req.params.id);

        if (!deletedMovie) {
            return res.status(404).json({ message: "Movie not found." });
        }

        res.json({ message: "Deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete movie." });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });
