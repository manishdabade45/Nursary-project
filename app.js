document.addEventListener("DOMContentLoaded", () => {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        item.addEventListener("toggle", () => {
            
            // Close other FAQs when one is opened
            if (item.open) {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.open = false;
                    }
                });
            }

            // Rotate icon
            const icon = item.querySelector("i");
            if (item.open) {
                icon.style.transform = "rotate(180deg)";
            } else {
                icon.style.transform = "rotate(0deg)";
            }
        });
    });
});