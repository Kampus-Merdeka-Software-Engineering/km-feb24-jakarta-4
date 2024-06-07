// Feedback
document.getElementById('feedbackForm').addEventListener('submit', function (event) {
    const feedback = document.getElementById('feedback').value;
    const letterCount = feedback.length;
    const errorMessage = document.getElementById('error-message');
    const letterCountElement = document.getElementById('letterCount');

    if (letterCount < 5 || letterCount > 100) {
        event.preventDefault();
        errorMessage.textContent = 'Mohon inputan di range 5-100 kata';
    } else {
        event.preventDefault();
        errorMessage.textContent = '';

        // Clear any previous error message
        const name = document.getElementById('name').value;
        const rating = document.querySelector('input[name="rating"]:checked').value;
        const category = document.getElementById('category').value;

        // Prepare the email parameters
        const templateParams = {
            name: name,
            rating: rating,
            category: category,
            feedback: feedback
        };

        emailjs.send("service_r68rdx9", "template_tn32aq8", templateParams)

        const feedbackList = document.getElementById('feedbackList');
        const newFeedback = document.createElement('li');
        newFeedback.innerHTML = `
            Name: ${name}<br>
            Rating: ${'★'.repeat(rating)}<br>
            Category: ${category}<br>
            Feedback: ${feedback}
        `;
        feedbackList.appendChild(newFeedback);

        document.getElementById('userFeedback').style.display = 'block';
        document.getElementById('thankYouMessage').style.display = 'block';
        document.getElementById('feedbackForm').reset();

        // Reset the letter count to 0
        letterCountElement.textContent = '0 letters';
    }
});

const feedbackTextarea = document.getElementById('feedback');
const letterCountDisplay = document.getElementById('letterCount');
feedbackTextarea.addEventListener('input', updateLetterCount);
function updateLetterCount() {
    const text = feedbackTextarea.value;
    const letterCount = text.length;
    letterCountDisplay.textContent = `${letterCount} letters`;
    if (letterCount < 5 || letterCount > 100) {
        feedbackTextarea.classList.add('error');
    } else {
        feedbackTextarea.classList.remove('error');
    }
}

