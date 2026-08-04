/* ==========================================
   HandleHub - Main JavaScript
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       1. Loader (2 Seconds)
    =============================== */
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => { loader.style.display = "none"; }, 500);
        }, 2000);
    }

    /* ===============================
       2. Scroll Progress Bar
    =============================== */
    const progressBar = document.getElementById("progress-bar");
    window.addEventListener("scroll", () => {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = (scrollTop / scrollHeight) * 100;
        if (progressBar) progressBar.style.width = progress + "%";
    });

    /* ===============================
       3. Sticky Navbar
    =============================== */
    const navbar = document.querySelector(".navbar");
    window.addEventListener("scroll", () => {
        if (!navbar) return;
        if (window.scrollY > 80) {
            navbar.classList.add("navbar-scrolled");
        } else {
            navbar.classList.remove("navbar-scrolled");
        }
    });

    /* ===============================
       4. Cursor Glow
    =============================== */
    const cursorGlow = document.querySelector(".cursor-glow");
    if (cursorGlow) {
        document.addEventListener("mousemove", (e) => {
            cursorGlow.style.left = e.clientX + "px";
            cursorGlow.style.top = e.clientY + "px";
        });
    }

    // Load backend accounts dynamically on start
    loadAccountsFromBackend();
});

/* ===============================
   5. Crypto Payment Modal Switch
=============================== */
const cryptoBtn = document.querySelector(".crypto-btn");
if (cryptoBtn) {
    cryptoBtn.addEventListener("click", function () {
        const paymentModalElement = document.getElementById("paymentModal");
        if (typeof bootstrap !== "undefined" && paymentModalElement) {
            const paymentModal = bootstrap.Modal.getInstance(paymentModalElement);
            if (paymentModal) paymentModal.hide();

            const cryptoModalElement = document.getElementById("cryptoModal");
            if (cryptoModalElement) {
                const cryptoModal = new bootstrap.Modal(cryptoModalElement);
                cryptoModal.show();
            }
        }
    });
}

/* ===============================
   6. Copy Wallet Address
=============================== */
const copyWallet = document.getElementById("copyWallet");
if (copyWallet) {
    copyWallet.addEventListener("click", function () {
        const wallet = document.getElementById("walletAddress");
        if (!wallet) return;
        wallet.select();
        wallet.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(wallet.value);
        this.innerHTML = "✅ Copied";
        setTimeout(() => { this.innerHTML = "Copy"; }, 2000);
    });
}

/* ===============================
   7. 30-Minute Countdown
=============================== */
const timer = document.getElementById("countdownTimer");
if (timer) {
    let time = 1800;
    setInterval(() => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        if (time > 0) time--;
    }, 1000);
}

/* ===============================
   8. Payment Verification
=============================== */
const paymentSentBtn = document.getElementById("paymentSentBtn");
if (paymentSentBtn) {
    paymentSentBtn.addEventListener("click", async function () {
        const email = document.getElementById("customerEmail");
        const txid = document.getElementById("txid");
        const emailError = document.getElementById("emailError");
        const txidError = document.getElementById("txidError");

        if (emailError) emailError.style.display = "none";
        if (txidError) txidError.style.display = "none";

        let valid = true;
        if (!email || email.value.trim() === "") {
            if (emailError) emailError.style.display = "block";
            valid = false;
        }
        if (!txid || txid.value.trim() === "" || txid.value.trim().length < 30) {
            if (txidError) {
                txidError.textContent = "Please enter a valid Transaction Hash (TXID), not a wallet address.";
                txidError.style.display = "block";
            }
            valid = false;
        }

        if (!valid) return;

        paymentSentBtn.disabled = true;
        paymentSentBtn.innerHTML = "⏳ Verifying Payment...";

        const orderIdEl = document.getElementById("orderId");
        const priceEl = document.getElementById("productPrice");
        const productNameEl = document.getElementById("productName");

        try {
            const response = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email.value.trim(),
                    txid: txid.value.trim(),
                    orderId: orderIdEl ? orderIdEl.textContent : "HH-000000",
                    amount: priceEl ? priceEl.textContent : "$0"
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                if (document.getElementById("receiptOrderId")) document.getElementById("receiptOrderId").textContent = orderIdEl ? orderIdEl.textContent : "";
                if (document.getElementById("receiptEmail")) document.getElementById("receiptEmail").textContent = email.value;
                if (document.getElementById("receiptProduct")) document.getElementById("receiptProduct").textContent = productNameEl ? productNameEl.textContent : "";
                if (document.getElementById("receiptAmount")) document.getElementById("receiptAmount").textContent = priceEl ? priceEl.textContent : "";

                if (document.getElementById("paymentSuccess")) document.getElementById("paymentSuccess").style.display = "block";
                if (document.getElementById("paymentReceipt")) document.getElementById("paymentReceipt").style.display = "block";
                paymentSentBtn.innerHTML = "✅ Payment Verified";
            } else {
                if (txidError) {
                    txidError.textContent = data.message || "Invalid or unconfirmed Transaction ID.";
                    txidError.style.display = "block";
                }
                paymentSentBtn.disabled = false;
                paymentSentBtn.innerHTML = "Confirm Payment";
            }
        } catch (error) {
            console.error("Payment Verification Error:", error);
            if (txidError) {
                txidError.textContent = "Server verification failed. Please wake up your backend server or check connection.";
                txidError.style.display = "block";
            }
            paymentSentBtn.disabled = false;
            paymentSentBtn.innerHTML = "Confirm Payment";
        }
    });
}

/* ===============================
   9. Dynamic Backend Fetch & Render
=============================== */
async function loadAccountsFromBackend() {
    const container = document.getElementById("accountsGrid");
    if (!container) return;

    try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (data.success && data.products.length > 0) {
            container.innerHTML = data.products.map((card, index) => {
                const images = (card.image_url || '').split(',').map(url => url.trim()).filter(Boolean);
                const carouselId = `carouselAccount_${index}`;

                // Build Carousel Slides
                const slidesHtml = images.length > 0 
                    ? images.map((img, i) => `
                        <div class="carousel-item ${i === 0 ? 'active' : ''} h-100">
                            <img src="${img}" alt="${card.title} Preview ${i + 1}">
                        </div>
                      `).join('')
                    : `<div class="carousel-item active h-100"><img src="https://via.placeholder.com/400x250" alt="Placeholder"></div>`;

                // Build Carousel Indicators
                const indicatorsHtml = images.length > 1 
                    ? images.map((_, i) => `
                        <button type="button" data-bs-target="#${carouselId}" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}"></button>
                      `).join('') 
                    : '';

                return `
                <div class="col-lg-4 col-md-6" data-aos="fade-up">
                    <div class="st-card">
                        <div class="st-card-img-wrapper">
                            <div class="st-badges">
                                ${card.badge ? `<span class="st-badge sale">${card.badge}</span>` : '<span class="st-badge sale">MONETIZED</span>'}
                                <span class="st-badge lightning" title="Fast Delivery">⚡</span>
                            </div>
                            <div class="st-platform-icon youtube">
                                <i class="fab fa-youtube"></i>
                            </div>

                            <div id="${carouselId}" class="carousel slide h-100" data-bs-ride="carousel" data-bs-interval="3000">
                                ${indicatorsHtml ? `<div class="carousel-indicators">${indicatorsHtml}</div>` : ''}
                                <div class="carousel-inner h-100">
                                    ${slidesHtml}
                                </div>
                                ${images.length > 1 ? `
                                    <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
                                        <span class="carousel-control-prev-icon"></span>
                                    </button>
                                    <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
                                        <span class="carousel-control-next-icon"></span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="st-card-body">
                            <h4 class="st-title">${card.title}</h4>
                            <p class="st-followers">${card.subtext || ''}</p>
                            <div class="st-pricing">
                                <span class="st-price-new">${card.price}</span>
                                ${card.monthly_profit ? `<span class="st-price-old">${card.monthly_profit}</span>` : ''}
                            </div>
                            <div class="st-card-actions">
                                <button class="btn st-btn-buy buy-btn" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#paymentModal"
                                        data-product="${card.title}" 
                                        data-followers="${card.subtext || ''}" 
                                        data-price="${card.price}">
                                    Buy Now
                                </button>
                                <button class="btn st-btn-offer" data-bs-toggle="modal" data-bs-target="#paymentModal">
                                    Offer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            }).join('');

            bindBuyNowButtons();
            
            // Re-initialize Bootstrap carousels for dynamic cards
            if (typeof bootstrap !== "undefined") {
                document.querySelectorAll('.carousel').forEach(carouselEl => {
                    const carousel = new bootstrap.Carousel(carouselEl, { interval: 3000, ride: 'carousel' });
                    carousel.cycle();
                });
            }
        }
    } catch (err) {
        console.error("Failed to load accounts:", err);
    }
}

function bindBuyNowButtons() {
    const buyButtons = document.querySelectorAll(".buy-btn");
    buyButtons.forEach(button => {
        button.addEventListener("click", function () {
            const product = this.dataset.product;
            const followers = this.dataset.followers;
            const price = this.dataset.price;
            const orderId = "HH-" + Math.floor(100000 + Math.random() * 900000);

            if (document.getElementById("productName")) document.getElementById("productName").textContent = product;
            if (document.getElementById("productFollowers")) document.getElementById("productFollowers").textContent = followers;
            if (document.getElementById("productPrice")) document.getElementById("productPrice").textContent = price;
            if (document.getElementById("orderId")) document.getElementById("orderId").textContent = orderId;
        });
    });
}

/* ===============================
   10. PayPal → WhatsApp
=============================== */
const paypalBtn = document.getElementById("paypalBtn");
if (paypalBtn) {
    paypalBtn.addEventListener("click", function () {
        const paymentModalElement = document.getElementById("paymentModal");
        if (typeof bootstrap !== "undefined" && paymentModalElement) {
            const paymentModal = bootstrap.Modal.getInstance(paymentModalElement);
            if (paymentModal) paymentModal.hide();
        }

        const product = document.getElementById("productName")?.textContent || "N/A";
        const followers = document.getElementById("productFollowers")?.textContent || "N/A";
        const price = document.getElementById("productPrice")?.textContent || "N/A";
        const orderId = document.getElementById("orderId")?.textContent || "N/A";
        const phone = "+12512833165";

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
   11. Plugins Initialization
=============================== */
if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true });
}

if (typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
        particles: {
            number: { value: 60 },
            color: { value: "#3b82f6" },
            shape: { type: "circle" },
            opacity: { value: 0.5 },
            size: { value: 3 },
            line_linked: { enable: true, distance: 150, color: "#3b82f6", opacity: 0.3, width: 1 },
            move: { enable: true, speed: 2 }
        },
        interactivity: {
            events: { onhover: { enable: true, mode: "grab" } }
        }
    });
}

// Counter Scroll Animation
const counters = document.querySelectorAll(".counter");
if (counters.length > 0) {
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
                    if (count > target) count = target;
                    counter.innerText = count;
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
            observer.unobserve(counter);
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}
