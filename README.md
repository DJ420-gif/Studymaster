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
    <header>
        <h1>StudyMaster</h1>
        <nav>
            <ul>
                <li><a href="#notes">Notes</a></li>
                <li><a href="#sample-papers">Sample Papers</a></li>
                <li class="dropdown">
                    <a href="#previous-years">Previous Years</a>
                    <div class="dropdown-content">
                        <a href="#maths">Maths</a>
                        <a href="#science">Science</a>
                        <a href="#english">English</a>
                    </div>
                </li>
            </ul>
        </nav>
        <input type="text" id="search-bar" placeholder="Search...">
        <button id="theme-toggle" onclick="toggleTheme()">🌙</button>
    </header>
    <section id="hero">
        <h2>Welcome to StudyMaster</h2>
        <p>Your ultimate resource for class 10 notes, sample papers, and previous year question solutions!</p>
    </section>
    <main>
        <section id="notes" class="card">
            <h2>Class 10 Notes</h2>
            <p>Comprehensive notes for class 10 NCERT subjects...</p>
        </section>
        <section id="sample-papers" class="card">
            <h2>Sample Papers</h2>
            <p>Sample papers for practice...</p>
        </section>
        <section id="previous-years" class="card">
            <h2>Previous Year Question Solutions</h2>
            <div class="tabs">
                <button class="tablink" onclick="openTab(event, 'maths')">Maths</button>
                <button class="tablink" onclick="openTab(event, 'science')">Science</button>
                <button class="tablink" onclick="openTab(event, 'english')">English</button>
            </div>
            <div id="maths" class="tabcontent">
                <h3>Maths Solutions</h3>
                <p>Content for Maths previous year solutions...</p>
            </div>
            <div id="science" class="tabcontent">
                <h3>Science Solutions</h3>
                <p>Content for Science previous year solutions...</p>
            </div>
            <div id="english" class="tabcontent">
                <h3>English Solutions</h3>
                <p>Content for English previous year solutions...</p>
            </div>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 StudyMaster. All rights reserved.</p>
        <p>Contact us: <a href="mailto:info@studymaster.com">info@studymaster.com</a></p>
    </footer>
    <button id="back-to-top" onclick="scrollToTop()">⬆️</button>
    <script src="script.js"></script>
</body>
</html>
