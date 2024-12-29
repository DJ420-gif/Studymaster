<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Class 10 Study Hub - Modern and engaging learning materials for Class 10 students.">
    <meta name="keywords" content="Class 10, education, study hub, modern learning">
    <meta name="author" content="Class 10 Study Hub">
    <title>Class 10 Study Hub</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <!-- Navbar -->
    <nav class="navbar">
        <div class="container">
            <a href="#" class="logo">Class 10 Study Hub</a>
            <div class="nav-links">
                <a href="#home">Home</a>
                <a href="#subjects">Subjects</a>
                <a href="#resources">Resources</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
                <button id="search-btn"><i class="fas fa-search"></i></button>
                <button id="theme-toggle"><i class="fas fa-moon"></i></button>
            </div>
        </div>
    </nav>
    <!-- Hero Section -->
    <section id="home" class="hero">
        <div class="container text-center">
            <div class="hero-content">
                <h1>Achieve Academic Success</h1>
                <p>Transform your learning experience with expert-curated resources.</p>
                <a href="#subjects" class="btn-primary">Get Started</a>
            </div>
            <div class="hero-image">
                <img src="https://via.placeholder.com/600x400" alt="Learning Image">
            </div>
        </div>
    </section>
    <!-- Search Section -->
    <section id="search" class="search">
        <div class="container">
            <h2>Find Study Materials</h2>
            <input type="text" id="search-box" placeholder="Search subjects, topics, or chapters...">
            <p id="no-results">No results found. Try a different keyword.</p>
        </div>
    </section>
    <!-- Subjects Section -->
    <section id="subjects" class="section subjects">
        <div class="container">
            <h2>Our Subjects</h2>
            <div class="grid">
                <div class="card">
                    <h3>Mathematics</h3>
                    <p>Explore in-depth concepts like Algebra, Trigonometry, and Geometry.</p>
                    <a href="#">Learn Math</a>
                </div>
                <div class="card">
                    <h3>Science</h3>
                    <p>Delve into Physics, Chemistry, and Biology with simplified explanations.</p>
                    <a href="#">Learn Science</a>
                </div>
                <div class="card">
                    <h3>Social Science</h3>
                    <p>Master History, Geography, Economics, and Political Science.</p>
                    <a href="#">Learn Social Science</a>
                </div>
            </div>
        </div>
    </section>
    <!-- Resources Section -->
    <section id="resources" class="section resources">
        <div class="container">
            <h2>Resources</h2>
            <div class="grid">
                <div class="card">
                    <h3>Sample Papers</h3>
                    <p>Access premium sample papers to ace your exams.</p>
                    <a href="#">Download Papers</a>
                </div>
                <div class="card">
                    <h3>NCERT Solutions</h3>
                    <p>Get detailed solutions for all NCERT questions.</p>
                    <a href="#">View Solutions</a>
                </div>
                <div class="card">
                    <h3>Time Management</h3>
                    <p>Learn how to manage your time for maximum productivity.</p>
                    <a href="#">View Tips</a>
                </div>
            </div>
        </div>
    </section>
    <!-- About Section -->
    <section id="about" class="about">
        <div class="container">
            <h2>About Us</h2>
            <p>Class 10 Study Hub is your gateway to high-quality educational resources. We provide engaging content designed to make learning accessible and enjoyable for all students.</p>
        </div>
    </section>
    <!-- Contact Section -->
    <section id="contact" class="section contact">
        <div class="container text-center">
            <h2>Contact Us</h2>
            <p>Have questions? Email us at <a href="mailto:info@class10studyhub.com">info@class10studyhub.com</a></p>
        </div>
    </section>
    <!-- Footer -->
    <footer>
        <div class="container text-center">
            <p>&copy; 2024 Class 10 Study Hub. All rights reserved.</p>
        </div>
    </footer>
    <!-- JavaScript -->
    <script src="script.js"></script>
</body>
</html>
