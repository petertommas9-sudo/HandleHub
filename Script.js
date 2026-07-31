/* ==========================================
   HandleHub - Main JavaScript
   Part 1
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       1. Loader (2 Seconds)
    =============================== */

    const loader = document.getElementById("loader");

    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";

            setTimeout(() => {
                loader.style.display = "none";
            }, 500);

        }, 2000);
    }


    /* ===============================
       2. Scroll Progress Bar
    =============================== */

    const progressBar = document.getElementById("progress-bar");

    window.addEventListener("scroll", () => {

        const scrollTop =
            document.documentElement.scrollTop;

        const scrollHeight =
            document.documentElement.scrollHeight -
            document.documentElement.clientHeight;

        const progress =
            (scrollTop / scrollHeight) * 100;

        if (progressBar) {
            progressBar.style.width = progress + "%";
        }

    });


    /* ===============================
       3. Sticky Navbar
    =============================== */

    const navbar = document.querySelector(".navbar");

    window.addEventListener("scroll", () => {

        if (!navbar) return;

        if (window.scrollY > 80) {

            navbar.style.padding = "12px 0";
            navbar.style.background =
                "rgba(8,12,24,.92)";

        } else {

            navbar.style.padding = "20px 0";
            navbar.style.background =
                "rgba(8,12,24,.65)";
        }

    });


    /* ===============================
       4. Cursor Glow
    =============================== */

    const cursorGlow =
        document.querySelector(".cursor-glow");

    if (cursorGlow) {

        document.addEventListener("mousemove", (e) => {

            cursorGlow.style.left = e.clientX + "px";
            cursorGlow.style.top = e.clientY + "px";

        });

    }

});

/* ===============================
   5. Buy Now Buttons
=============================== */

const buyButtons = document.querySelectorAll(".buy-btn");

buyButtons.forEach(button => {

    button.addEventListener("click", function () {

        const product = this.dataset.product;
        const followers = this.dataset.followers;
        const price = this.dataset.price;

        const orderId =
            "HH-" + Math.floor(100000 + Math.random() * 900000);

        document.getElementById("productName").textContent = product;
        document.getElementById("productFollowers").textContent = followers;
        document.getElementById("productPrice").textContent = price;
        document.getElementById("orderId").textContent = orderId;

    });

});

/* ===============================
   6. Crypto Payment
=============================== */

const cryptoBtn = document.querySelector(".crypto-btn");

if (cryptoBtn) {

    cryptoBtn.addEventListener("click", function () {

        // Close Payment Method Modal
        const paymentModalElement = document.getElementById("paymentModal");
        const paymentModal = bootstrap.Modal.getInstance(paymentModalElement);

        if (paymentModal) {
            paymentModal.hide();
        }

        // Open Crypto Modal
        const cryptoModal = new bootstrap.Modal(
            document.getElementById("cryptoModal")
        );

        cryptoModal.show();

    });

}


/* ===============================
   7. Copy Wallet Address
=============================== */

const copyWallet = document.getElementById("copyWallet");

if (copyWallet) {

    copyWallet.addEventListener("click", function () {

        const wallet =
            document.getElementById("walletAddress");

        wallet.select();
        wallet.setSelectionRange(0, 99999);

        navigator.clipboard.writeText(wallet.value);

        this.innerHTML = "✅ Copied";

        setTimeout(() => {

            this.innerHTML = "Copy";

        }, 2000);

    });

}


/* ===============================
   8. 30-Minute Countdown
=============================== */

const timer = document.getElementById("countdownTimer");

if (timer) {

    let time = 1800;

    setInterval(() => {

        const minutes = Math.floor(time / 60);
        const seconds = time % 60;

        timer.textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

        if (time > 0) {
            time--;
        }

    }, 1000);

}
/* ===============================
   9. Payment Confirmation (Updated)
=============================== */

const paymentSentBtn = document.getElementById("paymentSentBtn");

if (paymentSentBtn) {

    paymentSentBtn.addEventListener("click", async function () {

        const email = document.getElementById("customerEmail");
        const txid = document.getElementById("txid");

        const emailError = document.getElementById("emailError");
        const txidError = document.getElementById("txidError");

        emailError.style.display = "none";
        txidError.style.display = "none";

        let valid = true;

        if (email.value.trim() === "") {
            emailError.style.display = "block";
            valid = false;
        }

        // Basic front-end check: TXIDs are at least 30+ characters and not just wallet addresses
        if (txid.value.trim() === "" || txid.value.trim().length < 30) {
            txidError.textContent = "Please enter a valid Transaction Hash (TXID), not a wallet address.";
            txidError.style.display = "block";
            valid = false;
        }

        if (!valid) return;

        // Change button state to loading
        paymentSentBtn.disabled = true;
        paymentSentBtn.innerHTML = "⏳ Verifying Payment...";

        try {
            // Send TXID to your backend for verification
            const response = await fetch("https://handlehub-backend.onrender.com/api/verify-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.value.trim(),
                    txid: txid.value.trim(),
                    orderId: document.getElementById("orderId").textContent,
                    amount: document.getElementById("productPrice").textContent
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // SUCCESS: Fill receipt details and show success
                document.getElementById("receiptOrderId").textContent =
                    document.getElementById("orderId").textContent;

                document.getElementById("receiptEmail").textContent =
                    email.value;

                document.getElementById("receiptProduct").textContent =
                    document.getElementById("productName").textContent;

                document.getElementById("receiptAmount").textContent =
                    document.getElementById("productPrice").textContent;

                document.getElementById("paymentSuccess").style.display = "block";
                document.getElementById("paymentReceipt").style.display = "block";

                paymentSentBtn.innerHTML = "✅ Payment Verified";
            } else {
                // FAILURE: Show error returned by backend
                txidError.textContent = data.message || "Invalid or unconfirmed Transaction ID.";
                txidError.style.display = "block";
                paymentSentBtn.disabled = false;
                paymentSentBtn.innerHTML = "Confirm Payment";
            }

        } catch (error) {
            console.error("Verification error:", error);
            txidError.textContent = "Server verification failed. Please try again.";
            txidError.style.display = "block";
            paymentSentBtn.disabled = false;
            paymentSentBtn.innerHTML = "Confirm Payment";
        }

    });

}

/* ===============================
   10. PayPal → WhatsApp
=============================== */

const paypalBtn = document.getElementById("paypalBtn");

if (paypalBtn) {

    paypalBtn.addEventListener("click", function () {

        // Close Payment Method Modal
        const paymentModalElement = document.getElementById("paymentModal");
        const paymentModal = bootstrap.Modal.getInstance(paymentModalElement);

        if (paymentModal) {
            paymentModal.hide();
        }

        const product =
            document.getElementById("productName").textContent;

        const followers =
            document.getElementById("productFollowers").textContent;

        const price =
            document.getElementById("productPrice").textContent;

        const orderId =
            document.getElementById("orderId").textContent;

        const phone = "+12512833165"; // Replace with your client's number

        const message =
`Hello BuyAHandle 👋

I want to pay using PayPal.

 Product: ${product}
 Followers: ${followers}
 Price: ${price}
 Order ID: ${orderId}

Please send me your PayPal payment details.`;

        window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
            "_blank"
        );

    });

}
/* ===============================
   11. Final Initialization
=============================== */

// Initialize AOS Animation
if (typeof AOS !== "undefined") {
    AOS.init({
        duration: 800,
        once: true
    });
}

// Initialize Particles
if (typeof particlesJS !== "undefined") {

    particlesJS("particles-js", {

        particles: {
            number: {
                value: 60
            },
            color: {
                value: "#3b82f6"
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: 0.5
            },
            size: {
                value: 3
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#3b82f6",
                opacity: 0.3,
                width: 1
            },
            move: {
                enable: true,
                speed: 2
            }
        },

        interactivity: {
            events: {
                onhover: {
                    enable: true,
                    mode: "grab"
                }
            }
        }

    });

}

// Statistics Counter
// ===============================
// COUNTER ANIMATION ON SCROLL
// ===============================

const counters = document.querySelectorAll(".counter");

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = parseInt(counter.getAttribute("data-target"));
        const speed = 40;

        let count = 0;

        const updateCounter = () => {
            const increment = Math.ceil(target / speed);

            if (count < target) {
                count += increment;

                if (count > target) {
                    count = target;
                }

                counter.innerText = count;
                requestAnimationFrame(updateCounter);
            } else {
                counter.innerText = target;
            }
        };

        updateCounter();

        observer.unobserve(counter); // Count only once
    });
}, {
    threshold: 0.5
});

counters.forEach(counter => {
    observer.observe(counter);
});