<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Class 10 Study Hub - Get all the study materials, notes, and solutions for Class 10 subjects including Math, Science, English, and Social Science.">
    <meta name="keywords" content="Class 10 notes, Class 10 solutions, Class 10 study materials, Class 10 syllabus, Class 10 resources, Class 10 Math, Class 10 Science, Class 10 English, Class 10 Social Science, Class 10 chapters, Class 10 study guide">
    <meta name="author" content="Class 10 Study Hub">
    <meta property="og:title" content="Class 10 Study Hub">
    <meta property="og:description" content="Your one-stop destination for Class 10 study materials, notes, and solutions across all subjects.">
    <meta property="og:image" content="https://www.class10studyhub.com/images/thumbnail.jpg">
    <meta property="og:url" content="https://www.class10studyhub.com">
    <meta name="robots" content="index, follow">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Class 10 Study Hub</title>
    <!-- Fonts and Icons -->
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root {
            --bg-light: #f4f4f4;
            --bg-dark: #2c2c2c;
            --text-light: #f4f4f4;
            --text-dark: #333;
            --primary-color: #007bff;
            --header-footer-bg: #333;
            --header-footer-text: white;
            --card-bg-light: white;
            --card-bg-dark: #444;
        }
        body {
            font-family: 'Roboto', sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--bg-light);
            color: var(--text-dark);
            transition: all 0.3s ease;
        }
        .navbar {
            background-color: var(--header-footer-bg);
            z-index: 10;
        }
        .navbar-dark .navbar-nav .nav-link {
            color: var(--header-footer-text);
        }
        .theme-toggle-btn {
            cursor: pointer;
            font-size: 20px;
        }
        .navbar-brand,
        .navbar-nav .nav-link {
            color: var(--header-footer-text);
        }
        header {
            background-color: var(--bg-light);
            text-align: center;
            padding: 80px 20px;
            transition: background-color 0.3s;
        }
        header.dark {
            background-color: var(--bg-dark);
        }
        .section {
            padding: 60px 20px;
        }
        .card {
            margin: 20px 0;
            border: none;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.3s ease;
        }
        .card:hover {
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
        .card-body {
            background-color: var(--card-bg-light);
            padding: 20px;
        }
        .card-body.dark {
            background-color: var(--card-bg-dark);
        }
        footer {
            background-color: var(--header-footer-bg);
            color: var(--header-footer-text);
            text-align: center;
            padding: 30px 20px;
        }
        .search-box {
            width: 100%;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #ddd;
        }
        .no-results {
            display: none;
            color: red;
        }
        .search-container {
            max-width: 600px;
            margin: 20px auto;
            text-align: center;
        }
        .search-container input {
            width: 80%;
            padding: 12px;
            font-size: 16px;
        }
       .search-container p {
            margin-top: 10px;
        }
        /* Cards Grid */
        .card-columns {
            column-count: 3;
        }
        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .card-columns {
                column-count: 1;
            }
        }
        /* Dark Mode Styling */
        body.dark {
            background-color: var(--bg-dark);
            color: var(--text-light);
        }
        .navbar.dark {
            background-color: var(--bg-dark);
        }
        .no-results {
            display: none;
        }
    </style>
</head>

<body>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark sticky-top">
        <div class="container">
            <a class="navbar-brand" href="#">Class 10 Study Hub</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="#home">Home</a></li>
                    <li class="nav-item"><a class="nav-link" href="#subjects">Subjects</a></li>
                    <li class="nav-item"><a class="nav-link" href="#resources">Resources</a></li>
                    <li class="nav-item"><a class="nav-link" href="#contact">Contact</a></li>
                    <li class="nav-item"><span class="theme-toggle-btn" onclick="toggleTheme()"><i class="fas fa-sun"></i></span></li>
                </ul>
            </div>
        </div>
    </nav>
    <!-- Hero Section -->
    <header id="home">
        <div class="container">
            <h1 class="display-4 text-light">Welcome to Class 10 Study Hub</h1>
            <p class="lead text-light">Your one-stop destination for all your study materials, notes, and solutions!</p>
            <button class="btn btn-primary btn-lg">Explore Now</button>
        </div>
    </header>
    <!-- Search Bar -->
    <div class="search-container">
        <input type="text" id="search-box" class="search-box" placeholder="Search for subjects, chapters, or topics...">
        <p class="no-results">No results found. Please try a different keyword.</p>
    </div>
    <!-- Subjects Section -->
    <section id="subjects" class="section">
        <div class="container">
            <h2 class="text-center mb-4">Subjects</h2>
            <div class="card-columns">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Math</h5>
                        <ul>
                            <li><a href="#">Real Numbers</a></li>
                            <li><a href="#">Polynomials</a></li>
                            <li><a href="#">Quadratic Equations</a></li>
                        </ul>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Science</h5>
                        <ul>
                            <li><a href="#">Chemical Reactions</a></li>
                            <li><a href="#">Electricity</a></li>
                            <li><a href="#">Magnetic Effects</a></li>
                        </ul>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Social Science</h5>
                        <ul>
                            <li><a href="#">Nationalism in India</a></li>
                            <li><a href="#">Agriculture</a></li>
                            <li><a href="#">Development</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Resources Section -->
    <section id="resources" class="section">
        <div class="container">
            <h2 class="text-center mb-4">Resources</h2>
            <div class="card-columns">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Previous Year Papers</h5>
                        <a href="#">Download Previous Year Papers</a>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Sample Papers</h5>
                        <a href="#">Download Sample Papers</a>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">Time Management Tips</h5>
                        <a href="#">Read Tips</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <!-- Contact Section -->
    <section id="contact" class="section">
        <div class="container text-center">
            <h2>Contact Us</h2>
            <p>If you have any questions, feel free to contact us!</p>
            <a href="mailto:info@class10studyhub.com" class="btn btn-primary">Email Us</a>
        </div>
    </section>
    <!-- Footer -->
    <footer>
        <p>&copy; 2024 Class 10 Study Hub. All Rights Reserved.</p>
    </footer>
    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let isDarkMode = false;
        function toggleTheme() {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark', isDarkMode);
            document.querySelector('header').classList.toggle('dark', isDarkMode);
            document.querySelectorAll('.card-body').forEach(card => card.classList.toggle('dark', isDarkMode));
            // Change sun/moon icon
            document.querySelector('.theme-toggle-btn i').classList.toggle('fa-sun', !isDarkMode);
            document.querySelector('.theme-toggle-btn i').classList.toggle('fa-moon', isDarkMode);
        }
        document.getElementById('search-box').addEventListener('input', function() {
            let query = this.value.toLowerCase();
            let results = document.querySelectorAll('.card');
            let noResults = true;
            results.forEach(result => {
                const text = result.innerText.toLowerCase();
                if (text.includes(query)) {
                    result.style.display = 'block';
                    noResults = false;
                } else {
                    result.style.display = 'none';
                }
            });
            document.querySelector('.no-results').style.display = noResults ? 'block' : 'none';
        });
    </script>
</body>

</html>
