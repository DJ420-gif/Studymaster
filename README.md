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
    </header>
    <section id="home" class="section">
        <h2>Welcome to Class 10 Study Hub</h2>
        <p>Your one-stop destination for Class 10 study materials, notes, and solutions!</p>
    </section>
    <section id="subjects" class="section">
        <h2>Subjects</h2>
        <div class="subject-list">
            <div class="subject-item">
                <h3>Math</h3>
                <ul>
                    <li><a href="#">Real Numbers</a></li>
                    <li><a href="#">Polynomials</a></li>
                    <li><a href="#">Quadratic Equations</a></li>
                    <li><a href="#">Surface Areas and Volumes</a></li>
                    <li><a href="#">Statistics</a></li>
                </ul>
            </div>
            <div class="subject-item">
                <h3>Science</h3>
                <ul>
                    <li><a href="#">Chemical Reactions</a></li>
                    <li><a href="#">Acids, Bases, and Salts</a></li>
                    <li><a href="#">Life Processes</a></li>
                    <li><a href="#">Electricity</a></li>
                </ul>
            </div>
            <div class="subject-item">
                <h3>English</h3>
                <ul>
                    <li><a href="#">The First Flight</a></li>
                    <li><a href="#">Footprints Without Feet</a></li>
                    <li><a href="#">Grammar</a></li>
                </ul>
            </div>
            <div class="subject-item">
                <h3>Social Science</h3>
                <ul>
                    <li><a href="#">History</a></li>
                    <li><a href="#">Geography</a></li>
                    <li><a href="#">Economics</a></li>
                </ul>
            </div>
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
