# Studymaster
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Class 10 Study Hub - Get all the study materials, notes, and solutions for Class 10 subjects including Math, Science, English, and Social Science.">
    <meta name="keywords" content="Class 10 notes, Class 10 solutions, Class 10 study materials, Class 10 syllabus, Class 10 resources, Class 10 Math, Class 10 Science, Class 10 English, Class 10 Social Science">
    <meta name="author" content="Class 10 Study Hub">
    <meta property="og:title" content="Class 10 Study Hub">
    <meta property="og:description" content="Your one-stop destination for Class 10 study materials, notes, and solutions across all subjects.">
    <meta property="og:image" content="https://www.class10studyhub.com/images/thumbnail.jpg">
    <meta property="og:url" content="https://www.class10studyhub.com">
    <meta name="robots" content="index, follow">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Class 10 Study Hub</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        /* General Styling */
        :root {
            --bg-color: #f4f4f4;
            --text-color: #333;
            --header-footer-bg: #333;
            --header-footer-text: white;
            --card-bg: #fff;
        }
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: var(--bg-color);
            color: var(--text-color);
            transition: background 0.3s, color 0.3s;
        }
        header, footer {
            background-color: var(--header-footer-bg);
            color: var(--header-footer-text);
            text-align: center;
            padding: 1em;
        }
        .toggle-theme {
            position: absolute;
            top: 20px;
            right: 20px;
            background: var(--header-footer-text);
            color: var(--header-footer-bg);
            border: none;
            padding: 10px 15px;
            cursor: pointer;
            border-radius: 5px;
            font-size: 16px;
            transition: background 0.3s, color 0.3s;
        }
        .dropdown h3 {
            background-color: var(--header-footer-bg);
            color: var(--header-footer-text);
            padding: 10px;
            cursor: pointer;
            text-align: center;
        }
        .dropdown ul {
            list-style: none;
            margin: 0;
            padding: 0;
            background: var(--card-bg);
            border: 1px solid #ddd;
        }
        .dropdown ul li {
            padding: 10px;
            border-bottom: 1px solid #ddd;
        }
        .dropdown ul li a {
            text-decoration: none;
            color: var(--text-color);
        }
        footer {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Class 10 Study Hub</h1>
            <nav>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#subjects">Subjects</a></li>
                    <li><a href="#resources">Resources</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
        </div>
        <h1>Class 10 Study Hub</h1>
        <button class="toggle-theme" onclick="toggleTheme()">Switch to Dark Mode</button>
    </header>
    <section id="home" class="section">
        <h2>Welcome to Class 10 Study Hub</h2>
        <p>Your one-stop destination for Class 10 study materials, notes, and solutions!</p>
    </section>
        <!-- Subjects with Dropdown Menus -->
    <section id="subjects">
        <div class="dropdown">
            <h3 onclick="toggleDropdown('math-chapters')">Math</h3>
            <ul id="math-chapters">
                <li><a href="#">Real Numbers</a></li>
                <li><a href="#">Polynomials</a></li>
                <li><a href="#">Pair of Linear Equations</a></li>
                <li><a href="#">Quadratic Equations</a></li>
                <li><a href="#">Arithmetic Progressions</a></li>
            </ul>
        </div>
        <div class="dropdown">
            <h3 onclick="toggleDropdown('science-chapters')">Science</h3>
            <ul id="science-chapters">
                <li><a href="#">Chemical Reactions</a></li>
                <li><a href="#">Acids, Bases, and Salts</a></li>
                <li><a href="#">Metals and Non-Metals</a></li>
            </ul>
        </div>
    </section> 
    <section id="resources" class="section">
        <h2>Resources</h2>
        <div class="resource-list">
            <div class="resource-item">
                <h3>Previous Year Papers</h3>
                <a href="#">Download Previous Year Papers</a>
            </div>
            <div class="resource-item">
                <h3>Sample Papers</h3>
                <a href="#">Download Sample Papers</a>
            </div>
            <div class="resource-item">
                <h3>Time Management Tips</h3>
                <a href="#">Read Tips</a>
            </div>
        </div>
    </section>
    <section id="contact" class="section">
        <h2>Contact Us</h2>
        <p>Email: support@class10studyhub.com</p>
    </section>
    <button id="back-to-top" class="back-to-top">Back to Top</button>
    <footer>
        <p>&copy; 2024 Class 10 Study Hub</p>
    </footer>
    <script>
        // Function to toggle dropdown menus
        function toggleDropdown(id) {
            const dropdown = document.getElementById(id);
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
        // Function to toggle between Dark and Light mode
        let isDarkMode = false;
        function toggleTheme() {
            const root = document.documentElement;
            if (!isDarkMode) {
                // Switch to Dark Mode
                root.style.setProperty('--bg-color', '#333');
                root.style.setProperty('--text-color', '#f4f4f4');
                root.style.setProperty('--header-footer-bg', '#000');
                root.style.setProperty('--header-footer-text', '#fff');
                root.style.setProperty('--card-bg', '#444');
                document.querySelector('.toggle-theme').textContent = "Switch to Light Mode";
            } else {
                // Switch to Light Mode
                root.style.setProperty('--bg-color', '#f4f4f4');
                root.style.setProperty('--text-color', '#333');
                root.style.setProperty('--header-footer-bg', '#333');
                root.style.setProperty('--header-footer-text', '#fff');
                root.style.setProperty('--card-bg', '#fff');
                document.querySelector('.toggle-theme').textContent = "Switch to Dark Mode";
            }
            isDarkMode = !isDarkMode;
        }
        const backToTopBtn = document.getElementById('back-to-top');
        window.onscroll = () => {
            if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        };
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    </script>
</body>
</html>
