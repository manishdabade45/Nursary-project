// FAQ Toggle Functionality
document.addEventListener("DOMContentLoaded", function () {
    const faqs = document.querySelectorAll(".faq-item");

    faqs.forEach(faq => {
        const question = faq.querySelector(".faq-question");

        question.addEventListener("click", () => {
            const answer = faq.querySelector(".faq-answer");
            const toggle = faq.querySelector(".faq-toggle");

            // Close all other FAQs (optional premium feature 🔥)
            faqs.forEach(item => {
                if (item !== faq) {
                    item.querySelector(".faq-answer").style.display = "none";
                    item.querySelector(".faq-toggle").textContent = "+";
                }
            });

            // Toggle current FAQ
            if (answer.style.display === "block") {
                answer.style.display = "none";
                toggle.textContent = "+";
            } else {
                answer.style.display = "block";
                toggle.textContent = "-";
            }
        });
    });
});