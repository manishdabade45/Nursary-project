 
document.addEventListener("DOMContentLoaded", function () {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const summary = item.querySelector(".faq-question");

        summary.addEventListener("click", function (e) {
            e.preventDefault();

            // Close all other FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.removeAttribute("open");
                    const icon = otherItem.querySelector("i");
                    icon.style.transform = "rotate(0deg)";
                }
            });

            // Toggle current FAQ
            if (item.hasAttribute("open")) {
                item.removeAttribute("open");
                summary.querySelector("i").style.transform = "rotate(0deg)";
            } else {
                item.setAttribute("open", "true");
                summary.querySelector("i").style.transform = "rotate(180deg)";
            }
        });
    });
});
 