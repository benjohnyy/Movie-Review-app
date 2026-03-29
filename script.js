let movies = [];
let currentSearch = "";
let currentGenre = "All";
const API_BASE = window.location.port === "5000" ? "" : "http://localhost:5000";

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}

function getFilteredMovies() {
    return movies.filter((movie) => {
        const matchesSearch = movie.title.toLowerCase().includes(currentSearch);
        const matchesGenre = currentGenre === "All" || movie.genre === currentGenre;
        return matchesSearch && matchesGenre;
    });
}

function updateGenreOptions() {
    const genreFilter = document.getElementById("genreFilter");
    const genres = [...new Set(movies.map((movie) => (movie.genre || "").trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
    );

    genreFilter.innerHTML = `<option value="All">All Genres</option>`;

    genres.forEach((genre) => {
        genreFilter.innerHTML += `<option value="${escapeHTML(genre)}">${escapeHTML(genre)}</option>`;
    });

    if (currentGenre !== "All" && !genres.includes(currentGenre)) {
        currentGenre = "All";
    }

    genreFilter.value = currentGenre;
}

function updateSummary(filteredMovies) {
    const totalReviews = movies.reduce((count, movie) => count + (movie.reviews || []).length, 0);

    document.getElementById("movieCount").textContent = filteredMovies.length;
    document.getElementById("reviewCount").textContent = totalReviews;
}

function getAverageRating(reviews) {
    reviews = reviews || [];

    if (reviews.length === 0) {
        return "No ratings";
    }

    const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return `${(total / reviews.length).toFixed(1)}/5`;
}

function displayMovies(list) {
    const container = document.getElementById("movieList");
    container.innerHTML = "";

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No movies found</h3>
                <p>Try a different search or add a new movie to your collection.</p>
            </div>
        `;
        updateSummary(list);
        return;
    }

    list.forEach((movie) => {
        const movieId = movie._id;
        const averageRating = getAverageRating(movie.reviews);
        const reviewsHTML = movie.reviews.length
            ? movie.reviews
                  .map(
                      (review) => `
                        <div class="review-item">
                            <strong>${escapeHTML(review.author)}</strong>
                            <span class="review-rating">Rating: ${escapeHTML(review.rating)}/5</span>
                            <p>${escapeHTML(review.text)}</p>
                        </div>
                    `
                  )
                  .join("")
            : `<p class="review-empty">No reviews yet. Add the first one.</p>`;

        container.innerHTML += `
            <article class="movieCard">
                <div class="movie-header">
                    <div>
                        <h3>${escapeHTML(movie.title)}</h3>
                        <p class="movie-subtitle">${escapeHTML(movie.genre)}</p>
                    </div>
                    <div class="movie-actions">
                        <span class="avg-rating">${escapeHTML(averageRating)}</span>
                        <button type="button" class="delete-btn" onclick="deleteMovie('${movieId}')">Delete</button>
                    </div>
                </div>

                <p class="movie-meta"><strong>Director:</strong> ${escapeHTML(movie.director)}</p>
                <p class="movie-meta"><strong>Cast:</strong> ${escapeHTML(movie.cast)}</p>

                <div class="reviewBox">
                    <div class="review-form">
                        <input id="author-${movieId}" placeholder="Your name">
                        <input id="review-${movieId}" placeholder="Write a short review">
                        <input id="rating-${movieId}" placeholder="1-5" type="number" min="1" max="5">
                        <button type="button" class="primary-btn" onclick="addReview('${movieId}')">Add Review</button>
                    </div>
                    <div class="review-list">${reviewsHTML}</div>
                </div>
            </article>
        `;
    });

    updateSummary(list);
}

function refreshMovies() {
    updateGenreOptions();
    displayMovies(getFilteredMovies());
}

function runSearch() {
    const searchInput = document.getElementById("search");
    currentSearch = searchInput.value.toLowerCase().trim();
    refreshMovies();
}

async function loadMovies() {
    const response = await fetch(`${API_BASE}/movies`);

    if (!response.ok) {
        throw new Error("Failed to load movies.");
    }

    movies = (await response.json()).map((movie) => ({
        ...movie,
        reviews: movie.reviews || []
    }));
    refreshMovies();
}

async function addMovie() {
    const title = document.getElementById("title").value.trim();
    const genre = document.getElementById("genre").value.trim();
    const director = document.getElementById("director").value.trim();
    const cast = document.getElementById("cast").value.trim();

    if (!title || !genre || !director || !cast) {
        return;
    }

    const response = await fetch(`${API_BASE}/movies`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title,
            genre,
            director,
            cast
        })
    });

    if (!response.ok) {
        throw new Error("Failed to save movie.");
    }

    const newMovie = await response.json();
    movies.unshift(newMovie);

    document.getElementById("title").value = "";
    document.getElementById("genre").value = "";
    document.getElementById("director").value = "";
    document.getElementById("cast").value = "";
    document.getElementById("search").value = "";
    currentSearch = "";
    currentGenre = "All";

    refreshMovies();
}

async function addReview(movieId) {
    const author = document.getElementById(`author-${movieId}`).value.trim();
    const text = document.getElementById(`review-${movieId}`).value.trim();
    const rating = document.getElementById(`rating-${movieId}`).value.trim();

    if (!author || !text || !rating) {
        return;
    }

    const response = await fetch(`${API_BASE}/movies/${movieId}/review`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            author,
            text,
            rating: Number(rating)
        })
    });

    if (!response.ok) {
        throw new Error("Failed to save review.");
    }

    const updatedMovie = await response.json();
    movies = movies.map((movie) => movie._id === movieId ? updatedMovie : movie);
    refreshMovies();
}

async function deleteMovie(movieId) {
    const response = await fetch(`${API_BASE}/movies/${movieId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Failed to delete movie.");
    }

    movies = movies.filter((movie) => movie._id !== movieId);
    refreshMovies();
}

document.getElementById("search").addEventListener("input", function () {
    currentSearch = this.value.toLowerCase().trim();
    refreshMovies();
});

document.getElementById("search").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        runSearch();
    }
});

document.getElementById("genreFilter").addEventListener("change", function () {
    currentGenre = this.value;
    refreshMovies();
});

function sortAZ() {
    movies.sort((a, b) => a.title.localeCompare(b.title));
    refreshMovies();
}

function sortZA() {
    movies.sort((a, b) => b.title.localeCompare(a.title));
    refreshMovies();
}

loadMovies().catch((error) => {
    console.error(error);
    document.getElementById("movieList").innerHTML = `
        <div class="empty-state">
            <h3>Unable to load movies</h3>
            <p>${escapeHTML(error.message || "Check the server and MongoDB connection, then refresh the page.")}</p>
        </div>
    `;
});
