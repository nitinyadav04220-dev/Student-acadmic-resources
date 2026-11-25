// 1. INITIAL DATA
const sampleItems = [
    { id: 1, name: "Engineering Mathematics Textbook", category: "Textbooks", price: 250, semester: "1st", branch: "CSE", condition: "Gently Used", seller: "Rahul Sharma", contact: "9876543210", description: "Engineering Mathematics textbook. All chapters are intact and pages are in good condition.", image: "", icon: "📚" },
    { id: 2, name: "Professional Engineering Drafter", category: "Engineering Drafter", price: 150, semester: "1st", branch: "ME", condition: "Gently Used", seller: "Aman Verma", contact: "9876543211", description: "Good quality drafter. Smooth working mechanism. Suitable for engineering drawing.", image: "", icon: "📐" },
    { id: 3, name: "Arduino Uno Starter Kit", category: "Arduino Kits", price: 280, semester: "3rd", branch: "ECE", condition: "Brand New", seller: "Karan Singh", contact: "9876543212", description: "Arduino Uno kit with basic components. Great for electronics and programming projects.", image: "", icon: "🔌" },
    { id: 4, name: "Scientific Calculator FX-991", category: "Scientific Calculator", price: 0, semester: "2nd", branch: "CSE", condition: "Gently Used", seller: "Priya Gupta", contact: "9876543213", description: "Working scientific calculator. Available for donation to a student.", image: "", icon: "🧮" },
    { id: 5, name: "Engineering Lab Coat", category: "Lab Coat", price: 200, semester: "2nd", branch: "ME", condition: "Gently Used", seller: "Rohit Kumar", contact: "9876543214", description: "Clean white laboratory coat. Good condition and ready to use.", image: "", icon: "🥼" },
    { id: 6, name: "Basic Electronics Textbook", category: "Textbooks", price: 180, semester: "3rd", branch: "ECE", condition: "Marked with Notes", seller: "Neha Sharma", contact: "9876543215", description: "Useful electronics textbook with some handwritten notes and highlighted sections.", image: "", icon: "📖" },
    { id: 7, name: "Engineering Drawing Kit", category: "Engineering Drafter", price: 100, semester: "1st", branch: "Civil", condition: "Gently Used", seller: "Vikas", contact: "9876543216", description: "Engineering drawing equipment in good working condition.", image: "", icon: "📐" },
    { id: 8, name: "Arduino Sensor Kit", category: "Arduino Kits", price: 300, semester: "5th", branch: "CSE", condition: "Brand New", seller: "Ankit", contact: "9876543217", description: "Sensor kit suitable for embedded systems and IoT experiments.", image: "", icon: "⚡" },
    { id: 9, name: "Advanced Mathematics Notes", category: "Textbooks", price: 0, semester: "4th", branch: "CSE", condition: "Gently Used", seller: "Simran", contact: "9876543218", description: "Complete semester notes. Available free for another student.", image: "", icon: "📝" }
];

function loadJsonStorage(key, fallback) {
    try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error(`Could not load ${key}:`, e);
    }
    return fallback;
}

function loadItems() {
    return loadJsonStorage("campusExchangeItems", sampleItems);
}

let items = loadItems();
let selectedCategory = "All";
let showOnlySaved = false;
let uploadedImage = "";

// OFFICIAL CAMPUSEXCHANGE CONFIGURATION
const OFFICIAL_WHATSAPP_NUMBER = "910000000000";

function getOfficialWhatsAppUrl(message = "") {
    const textParam = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}${textParam}`;
}

// Track items created/posted by current user
function loadMyPostedItemIds() {
    return new Set(loadJsonStorage("campusExchangeMyItems", []).map(String));
}

let myPostedItemIds = loadMyPostedItemIds();

function saveMyPostedItemIds() {
    try {
        localStorage.setItem("campusExchangeMyItems", JSON.stringify(Array.from(myPostedItemIds)));
    } catch (e) {
        console.error("Could not save posted item IDs:", e);
    }
}

function isItemOwner(item) {
    return Boolean(item && myPostedItemIds.has(String(item.id)));
}

function deleteItem(itemId) {
    const idStr = String(itemId);
    items = items.filter(p => String(p.id) !== idStr);
    saveItems();
    if (savedItemIds.has(idStr)) {
        savedItemIds.delete(idStr);
        saveSavedItemIds();
    }
    if (myPostedItemIds.has(idStr)) {
        myPostedItemIds.delete(idStr);
        saveMyPostedItemIds();
    }
    filterItems();
}

// Load bookmarked/saved item IDs
function loadSavedItemIds() {
    return new Set(loadJsonStorage("campusExchangeSavedItems", []).map(String));
}

let savedItemIds = loadSavedItemIds();

function saveSavedItemIds() {
    try {
        localStorage.setItem("campusExchangeSavedItems", JSON.stringify(Array.from(savedItemIds)));
    } catch (e) {
        console.error("Could not save bookmarks:", e);
    }
}

function toggleBookmark(itemId) {
    const idStr = String(itemId);
    if (savedItemIds.has(idStr)) savedItemIds.delete(idStr);
    else savedItemIds.add(idStr);
    saveSavedItemIds();
}

function saveItems() {
    try {
        localStorage.setItem("campusExchangeItems", JSON.stringify(items));
        return true;
    } catch (e) {
        console.error("Could not save listings:", e);
        showToast("Storage full. Try a smaller image.");
        return false;
    }
}

// 2. DOM ELEMENTS
const productGrid = document.getElementById("productGrid");
const searchInput = document.getElementById("searchInput");
const semesterFilter = document.getElementById("semesterFilter");
const branchFilter = document.getElementById("branchFilter");
const priceFilter = document.getElementById("priceFilter");
const sortFilter = document.getElementById("sortFilter");
const listingCount = document.getElementById("listingCount");
const totalItems = document.getElementById("totalItems");
const emptyState = document.getElementById("emptyState");

// 3. HELPER FUNCTIONS
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
}

function formatPrice(price) {
    return Number(price) === 0 ? "Free" : "₹" + Number(price).toLocaleString("en-IN");
}

let toastTimer;
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function getCategoryIcon(category) {
    const icons = {
        "Textbooks": "📚",
        "Engineering Drafter": "📐",
        "Lab Coat": "🥼",
        "Arduino Kits": "🔌",
        "Scientific Calculator": "🧮"
    };
    return icons[category] || "📦";
}

function getConditionClass(condition) {
    if (condition === "Brand New") return "condition-brand-new";
    if (condition === "Gently Used") return "condition-gently-used";
    if (condition === "Marked with Notes") return "condition-marked-notes";
    return "";
}

function fallbackCopy(text, callback) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand("copy");
        if (callback) callback();
    } catch (err) {
        console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textarea);
}

const bookmarkSvg = filled => `<svg width="16" height="16" viewBox="0 0 24 24" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;

// 4. DISPLAY PRODUCT CARDS
function renderItems(filteredItems) {
    productGrid.innerHTML = "";
    listingCount.textContent = `${filteredItems.length} items found`;
    if (totalItems) totalItems.textContent = items.length;

    if (filteredItems.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");

    filteredItems.forEach(item => {
        const card = document.createElement("article");
        card.className = "product-card";
        const isSaved = savedItemIds.has(String(item.id));
        const imageContent = item.image
            ? `<img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`
            : `<span class="product-placeholder">${getCategoryIcon(item.category)}</span>`;

        card.innerHTML = `
            <div class="product-image">
                ${imageContent}
                <span class="product-category">${escapeHTML(item.category)}</span>
                <button class="bookmark-btn ${isSaved ? "saved" : ""}" data-id="${escapeHTML(item.id)}" type="button" aria-label="${isSaved ? "Remove from saved" : "Save item"}" title="${isSaved ? "Remove from saved" : "Save item"}">
                    ${bookmarkSvg(isSaved)}
                </button>
            </div>
            <div class="product-info">
                <div class="product-meta">
                    <span>${escapeHTML(item.semester)} Semester</span>
                    <span>${escapeHTML(item.branch)}</span>
                </div>
                <h3>${escapeHTML(item.name)}</h3>
                <span class="product-condition ${getConditionClass(item.condition)}">
                    ${escapeHTML(item.condition)}
                </span>
                <div class="product-bottom">
                    <span class="product-price">${formatPrice(item.price)}</span>
                    <button class="view-btn" data-id="${escapeHTML(item.id)}">View Details →</button>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// 5. SEARCH AND FILTER FUNCTIONALITY
function filterItems() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const semester = semesterFilter.value;
    const branch = branchFilter.value;
    const price = priceFilter.value;
    const sort = sortFilter.value;

    let filteredItems = items.filter(item => {
        const matchesSaved = !showOnlySaved || savedItemIds.has(String(item.id));
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.branch.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === "All" || selectedCategory === "Saved" || item.category === selectedCategory;
        const matchesSemester = semester === "All" || item.semester === semester;
        const matchesBranch = branch === "All" || item.branch === branch;
        let matchesPrice = true;
        if (price === "Free") matchesPrice = Number(item.price) === 0;
        if (price === "Under300") matchesPrice = Number(item.price) > 0 && Number(item.price) < 300;

        return matchesSaved && matchesSearch && matchesCategory && matchesSemester && matchesBranch && matchesPrice;
    });

    if (sort === "low-high") filteredItems.sort((a, b) => a.price - b.price);
    if (sort === "high-low") filteredItems.sort((a, b) => b.price - a.price);

    renderItems(filteredItems);
}

searchInput.addEventListener("input", filterItems);
semesterFilter.addEventListener("change", filterItems);
branchFilter.addEventListener("change", filterItems);
priceFilter.addEventListener("change", filterItems);
sortFilter.addEventListener("change", filterItems);

// 6. CATEGORY FILTER
document.getElementById("categoryFilters").addEventListener("click", function(event) {
    const button = event.target.closest(".category-btn");
    if (!button) return;

    if (button.dataset.category === "Saved" && button.classList.contains("active")) {
        document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
        const allBtn = document.querySelector('.category-btn[data-category="All"]');
        if (allBtn) allBtn.classList.add("active");
        selectedCategory = "All";
        showOnlySaved = false;
        filterItems();
        return;
    }

    document.querySelectorAll(".category-btn").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    selectedCategory = button.dataset.category;
    showOnlySaved = (selectedCategory === "Saved");
    filterItems();
});

// 7. RESET FILTERS
function resetFilters() {
    searchInput.value = "";
    semesterFilter.value = "All";
    branchFilter.value = "All";
    priceFilter.value = "All";
    sortFilter.value = "default";
    selectedCategory = "All";
    showOnlySaved = false;

    document.querySelectorAll(".category-btn").forEach(button => {
        button.classList.toggle("active", button.dataset.category === "All");
    });
    filterItems();
}

document.getElementById("resetFilters").addEventListener("click", resetFilters);
document.getElementById("clearSearch").addEventListener("click", resetFilters);

// 8. ITEM DETAILS MODAL
const itemModal = document.getElementById("itemModal");
const modalBody = document.getElementById("modalBody");

function openItemModal(itemId) {
    const item = items.find(product => String(product.id) === String(itemId));
    if (!item) return;

    const imageContent = item.image
        ? `<img class="modal-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`
        : `<div class="modal-image product-placeholder" style="display:grid;place-items:center;font-size:65px;">${getCategoryIcon(item.category)}</div>`;

    const hasPhone = Boolean(item.contact && String(item.contact).trim() !== "");
    const isOwner = isItemOwner(item);

    let sellerContactHTML = "";
    let actionButtonsHTML = "";

    if (hasPhone) {
        const rawContact = String(item.contact).trim();
        const digits = rawContact.replace(/\D/g, "");
        let waPhone = digits;
        if (!rawContact.startsWith("+")) {
            if (digits.length === 10) waPhone = "91" + digits;
            else if (digits.length === 12 && digits.startsWith("91")) waPhone = digits;
        }

        let telHref = `tel:${rawContact}`;
        if (!rawContact.startsWith("+")) {
            if (digits.length === 10) telHref = `tel:+91${digits}`;
            else if (digits.length === 12 && digits.startsWith("91")) telHref = `tel:+${digits}`;
        }

        const sellerName = item.seller || "Seller";
        const sellerMsg = `Hi ${sellerName}, is your ${item.name} still available on CampusExchange?`;
        const waSellerUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(sellerMsg)}`;

        sellerContactHTML = `
            <p><strong>Name:</strong> ${escapeHTML(item.seller)}</p>
            <p class="seller-contact-row">
                <strong>Contact:</strong>
                <span>${escapeHTML(item.contact)}</span>
                <button type="button" class="copy-icon-btn" id="copyContactBtn" data-contact="${escapeHTML(item.contact)}" aria-label="Copy phone number" title="Copy phone number">
                    <svg class="copy-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span class="copy-feedback hidden" id="copyFeedback">Copied!</span>
                </button>
            </p>
        `;
        actionButtonsHTML = `
            <div class="seller-contact-actions">
                <a href="${waSellerUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">WhatsApp Seller</a>
                <a href="${telHref}" class="btn btn-outline">Call Seller</a>
            </div>
        `;
    } else {
        const cxMsg = `Hi CampusExchange, I'm interested in the ${item.name}. Is it still available? I'd like to know how I can get it.`;
        const waCxUrl = getOfficialWhatsAppUrl(cxMsg);
        sellerContactHTML = `
            <p><strong>Name:</strong> ${escapeHTML(item.seller)}</p>
            <p class="seller-contact-unavailable">Seller contact is not available. Contact CampusExchange on WhatsApp for assistance with this item.</p>
        `;
        actionButtonsHTML = `
            <div class="seller-contact-actions single-action">
                <a href="${waCxUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">WhatsApp CampusExchange</a>
            </div>
        `;
    }

    const removeButtonHTML = isOwner ? `
        <div class="remove-item-container">
            <button type="button" class="btn-remove-item" id="removeItemBtn" data-id="${escapeHTML(item.id)}">
                🗑️ Remove Item
            </button>
        </div>
    ` : "";

    modalBody.innerHTML = `
        ${imageContent}
        <div class="modal-details">
            <span class="eyebrow">${escapeHTML(item.category)}</span>
            <h2 id="modalTitle">${escapeHTML(item.name)}</h2>
            <h2 style="color:var(--primary)">${formatPrice(item.price)}</h2>
            <p><strong>Semester:</strong> ${escapeHTML(item.semester)}</p>
            <p><strong>Branch:</strong> ${escapeHTML(item.branch)}</p>
            <p><strong>Condition:</strong> ${escapeHTML(item.condition)}</p>
            <p><strong>Description:</strong> ${escapeHTML(item.description || "No description provided.")}</p>
            <div class="seller-box">
                <h3>Seller Information</h3>
                ${sellerContactHTML}
                ${actionButtonsHTML}
            </div>
            ${removeButtonHTML}
        </div>
    `;

    const copyContactBtn = document.getElementById("copyContactBtn");
    if (copyContactBtn) {
        copyContactBtn.addEventListener("click", function() {
            const num = this.dataset.contact;
            const doFeedback = () => {
                copyContactBtn.classList.add("copied");
                const feedbackSpan = document.getElementById("copyFeedback");
                const svgIcon = copyContactBtn.querySelector(".copy-svg");
                if (feedbackSpan) feedbackSpan.classList.remove("hidden");
                if (svgIcon) svgIcon.classList.add("hidden");
                setTimeout(() => {
                    copyContactBtn.classList.remove("copied");
                    if (feedbackSpan) feedbackSpan.classList.add("hidden");
                    if (svgIcon) svgIcon.classList.remove("hidden");
                }, 2000);
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(num).then(doFeedback).catch(() => fallbackCopy(num, doFeedback));
            } else {
                fallbackCopy(num, doFeedback);
            }
        });
    }

    const removeItemBtn = document.getElementById("removeItemBtn");
    if (removeItemBtn) {
        removeItemBtn.addEventListener("click", function() {
            if (!confirm("Are you sure you want to remove this listing? This action cannot be undone.")) return;
            deleteItem(item.id);
            closeItemModal();
            showToast("Item removed successfully.");
        });
    }

    itemModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    document.getElementById("closeModal").focus();
}

productGrid.addEventListener("click", function(event) {
    const bookmarkBtn = event.target.closest(".bookmark-btn");
    if (bookmarkBtn) {
        event.stopPropagation();
        const itemId = bookmarkBtn.dataset.id;
        toggleBookmark(itemId);

        if (showOnlySaved) {
            filterItems();
        } else {
            const nowSaved = savedItemIds.has(String(itemId));
            bookmarkBtn.classList.toggle("saved", nowSaved);
            bookmarkBtn.setAttribute("aria-label", nowSaved ? "Remove from saved" : "Save item");
            bookmarkBtn.setAttribute("title", nowSaved ? "Remove from saved" : "Save item");
            bookmarkBtn.innerHTML = bookmarkSvg(nowSaved);
        }
        return;
    }

    const button = event.target.closest(".view-btn");
    if (button) openItemModal(button.dataset.id);
});

function closeItemModal() {
    itemModal.classList.add("hidden");
    document.body.style.overflow = "";
}

document.getElementById("closeModal").addEventListener("click", closeItemModal);
itemModal.addEventListener("click", event => { if (event.target === itemModal) closeItemModal(); });

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (!itemModal.classList.contains("hidden")) closeItemModal();
        if (authModal && !authModal.classList.contains("hidden")) closeAuthModal();
    }
});

// 9. IMAGE UPLOAD AND PREVIEW
const imageInput = document.getElementById("itemImage");
const preview = document.getElementById("imagePreview");
const previewImg = document.getElementById("previewImg");

imageInput.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showToast("Please select a JPG, PNG or WEBP image.");
        this.value = "";
        return;
    }
    if (file.size > 1024 * 1024) {
        showToast("Image must be smaller than 1 MB.");
        this.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = event => {
        uploadedImage = event.target.result;
        previewImg.src = uploadedImage;
        preview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
});

document.getElementById("removeImage").addEventListener("click", () => {
    uploadedImage = "";
    imageInput.value = "";
    previewImg.src = "";
    preview.classList.add("hidden");
});

// 10. POST NEW ITEM
const itemForm = document.getElementById("itemForm");

itemForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("itemName").value.trim();
    const category = document.getElementById("itemCategory").value;
    const price = Number(document.getElementById("itemPrice").value);
    const semester = document.getElementById("itemSemester").value;
    const branch = document.getElementById("itemBranch").value;
    const condition = document.getElementById("itemCondition").value;
    const seller = document.getElementById("sellerName").value.trim();
    const contact = document.getElementById("sellerContact").value.trim();
    const description = document.getElementById("itemDescription").value.trim();

    if (!name || !seller || !category || !semester || !branch || !condition) {
        showToast("Please complete all required fields.");
        return;
    }
    if (!Number.isSafeInteger(price) || price < 0) {
        showToast("Enter a valid non-negative whole-number price.");
        return;
    }
    if (contact && !/^[6-9][0-9]{9}$/.test(contact)) {
        showToast("Enter a valid 10-digit Indian mobile number.");
        return;
    }

    const newItem = {
        id: Date.now(),
        name, category, price, semester, branch, condition, seller, contact, description,
        image: uploadedImage,
        icon: getCategoryIcon(category)
    };

    items.unshift(newItem);
    if (!saveItems()) {
        items.shift();
        return;
    }

    myPostedItemIds.add(String(newItem.id));
    saveMyPostedItemIds();

    resetFilters();
    itemForm.reset();
    uploadedImage = "";
    previewImg.src = "";
    preview.classList.add("hidden");
    imageInput.value = "";

    showToast("Your item has been published successfully!");
    document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
});

// 11. DARK MODE
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

let savedTheme = "light";
try { savedTheme = localStorage.getItem("campusExchangeTheme") || "light"; } catch (e) { console.error("Could not load theme:", e); }
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
    const newTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
    applyTheme(newTheme);
    try { localStorage.setItem("campusExchangeTheme", newTheme); } catch (e) { console.error("Could not save theme:", e); }
});

// 12. AUTHENTICATION (LOGIN & SIGN UP)
const AUTH_API_BASE = "http://127.0.0.1:3000/api/auth";
const authBtn = document.getElementById("authBtn");
const userArea = document.getElementById("userArea");
const userNameText = document.getElementById("userNameText");
const logoutBtn = document.getElementById("logoutBtn");
const authModal = document.getElementById("authModal");
const closeAuthModalBtn = document.getElementById("closeAuthModal");
const authErrorBanner = document.getElementById("authError");
const loginTabBtn = document.getElementById("loginTabBtn");
const signupTabBtn = document.getElementById("signupTabBtn");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const switchToSignup = document.getElementById("switchToSignup");
const switchToLogin = document.getElementById("switchToLogin");

let currentUser = null;

function getAuthToken() {
    try { return localStorage.getItem("campusExchangeAuthToken"); } catch { return null; }
}

function setAuthToken(token) {
    try {
        if (token) localStorage.setItem("campusExchangeAuthToken", token);
        else localStorage.removeItem("campusExchangeAuthToken");
    } catch (e) { console.error("Storage error:", e); }
}

function updateAuthUI() {
    if (currentUser) {
        if (authBtn) authBtn.classList.add("hidden");
        if (userArea) userArea.classList.remove("hidden");
        if (userNameText) userNameText.textContent = currentUser.name;
    } else {
        if (authBtn) authBtn.classList.remove("hidden");
        if (userArea) userArea.classList.add("hidden");
        if (userNameText) userNameText.textContent = "";
    }
}

function showAuthError(message) {
    if (!authErrorBanner) return;
    authErrorBanner.textContent = message || "";
    authErrorBanner.classList.toggle("hidden", !message);
}

function switchAuthTab(tab) {
    showAuthError("");
    const isLogin = tab === "login";
    if (loginTabBtn) {
        loginTabBtn.classList.toggle("active", isLogin);
        loginTabBtn.setAttribute("aria-selected", isLogin ? "true" : "false");
    }
    if (signupTabBtn) {
        signupTabBtn.classList.toggle("active", !isLogin);
        signupTabBtn.setAttribute("aria-selected", !isLogin ? "true" : "false");
    }
    if (loginForm) loginForm.classList.toggle("hidden", !isLogin);
    if (signupForm) signupForm.classList.toggle("hidden", isLogin);

    document.querySelectorAll(".input-error").forEach(el => el.textContent = "");
    document.querySelectorAll(".auth-form input").forEach(input => input.classList.remove("input-invalid"));

    const firstInput = isLogin ? document.getElementById("loginEmail") : document.getElementById("signupName");
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
}

function openAuthModal(tab = "login") {
    switchAuthTab(tab);
    if (authModal) {
        authModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }
}

function closeAuthModal() {
    if (authModal) {
        authModal.classList.add("hidden");
        document.body.style.overflow = "";
    }
    showAuthError("");
    if (loginForm) loginForm.reset();
    if (signupForm) signupForm.reset();
}

async function initAuthSession() {
    const token = getAuthToken();
    if (!token) {
        updateAuthUI();
        return;
    }
    try {
        const response = await fetch(`${AUTH_API_BASE}/session`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.user) {
                currentUser = data.user;
                updateAuthUI();
                return;
            }
        }
        setAuthToken(null);
        currentUser = null;
        updateAuthUI();
    } catch {
        try {
            const cachedUser = localStorage.getItem("campusExchangeCachedUser");
            if (cachedUser) currentUser = JSON.parse(cachedUser);
        } catch {}
        updateAuthUI();
    }
}

async function handleLogin(email, password) {
    try {
        const response = await fetch(`${AUTH_API_BASE}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Login failed. Please check your credentials.");

        currentUser = data.user;
        setAuthToken(data.token);
        try { localStorage.setItem("campusExchangeCachedUser", JSON.stringify(currentUser)); } catch {}

        updateAuthUI();
        closeAuthModal();
        showToast(`Welcome back, ${currentUser.name}!`);
    } catch (err) {
        if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
            try {
                const localUsers = JSON.parse(localStorage.getItem("campusExchangeLocalUsers") || "[]");
                const found = localUsers.find(u => u.email === email.toLowerCase() && u.password === password);
                if (found) {
                    currentUser = { id: found.id, name: found.name, email: found.email };
                    setAuthToken("local_dev_token_" + found.id);
                    localStorage.setItem("campusExchangeCachedUser", JSON.stringify(currentUser));
                    updateAuthUI();
                    closeAuthModal();
                    showToast(`Welcome back, ${currentUser.name}!`);
                    return;
                }
            } catch {}
            showAuthError("Cannot reach auth server at " + AUTH_API_BASE + ". Please start 'node server.js' for genuine backend authentication.");
            return;
        }
        showAuthError(err.message || "An error occurred during login.");
    }
}

async function handleSignup(name, email, password) {
    try {
        const response = await fetch(`${AUTH_API_BASE}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Sign up failed. Please try again.");

        currentUser = data.user;
        setAuthToken(data.token);
        try { localStorage.setItem("campusExchangeCachedUser", JSON.stringify(currentUser)); } catch {}

        updateAuthUI();
        closeAuthModal();
        showToast(`Account created! Welcome to CampusExchange, ${currentUser.name}!`);
    } catch (err) {
        if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
            try {
                const localUsers = JSON.parse(localStorage.getItem("campusExchangeLocalUsers") || "[]");
                if (localUsers.some(u => u.email === email.toLowerCase())) {
                    showAuthError("An account with this email already exists.");
                    return;
                }
                const newLocalUser = { id: "usr_" + Date.now(), name, email: email.toLowerCase(), password };
                localUsers.push(newLocalUser);
                localStorage.setItem("campusExchangeLocalUsers", JSON.stringify(localUsers));

                currentUser = { id: newLocalUser.id, name: newLocalUser.name, email: newLocalUser.email };
                setAuthToken("local_dev_token_" + newLocalUser.id);
                localStorage.setItem("campusExchangeCachedUser", JSON.stringify(currentUser));
                updateAuthUI();
                closeAuthModal();
                showToast(`Account created! Welcome, ${currentUser.name}! (Running in local mode - start 'node server.js' for genuine server auth)`);
                return;
            } catch {}
            showAuthError("Cannot reach auth server at " + AUTH_API_BASE + ". Please start 'node server.js' for genuine backend authentication.");
            return;
        }
        showAuthError(err.message || "An error occurred during registration.");
    }
}

async function handleLogout() {
    const token = getAuthToken();
    if (token) {
        try {
            await fetch(`${AUTH_API_BASE}/logout`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch {}
    }
    currentUser = null;
    setAuthToken(null);
    try { localStorage.removeItem("campusExchangeCachedUser"); } catch {}
    updateAuthUI();
    showToast("You have been logged out.");
}

// Auth Event Listeners
if (authBtn) authBtn.addEventListener("click", () => openAuthModal("login"));
if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);
if (authModal) authModal.addEventListener("click", e => { if (e.target === authModal) closeAuthModal(); });
if (loginTabBtn) loginTabBtn.addEventListener("click", () => switchAuthTab("login"));
if (signupTabBtn) signupTabBtn.addEventListener("click", () => switchAuthTab("signup"));
if (switchToSignup) switchToSignup.addEventListener("click", () => switchAuthTab("signup"));
if (switchToLogin) switchToLogin.addEventListener("click", () => switchAuthTab("login"));
if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

// Login form submit
if (loginForm) {
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault();
        showAuthError("");

        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
        const emailError = document.getElementById("loginEmailError");
        const passwordError = document.getElementById("loginPasswordError");

        if (emailError) emailError.textContent = "";
        if (passwordError) passwordError.textContent = "";
        if (emailInput) emailInput.classList.remove("input-invalid");
        if (passwordInput) passwordInput.classList.remove("input-invalid");

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        let hasError = false;

        if (!email) {
            if (emailError) emailError.textContent = "Please enter your email address.";
            if (emailInput) emailInput.classList.add("input-invalid");
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (emailError) emailError.textContent = "Please enter a valid email format.";
            if (emailInput) emailInput.classList.add("input-invalid");
            hasError = true;
        }

        if (!password) {
            if (passwordError) passwordError.textContent = "Please enter your password.";
            if (passwordInput) passwordInput.classList.add("input-invalid");
            hasError = true;
        }

        if (hasError) return;
        handleLogin(email, password);
    });
}

// Signup form submit
if (signupForm) {
    signupForm.addEventListener("submit", function(event) {
        event.preventDefault();
        showAuthError("");

        const nameInput = document.getElementById("signupName");
        const emailInput = document.getElementById("signupEmail");
        const passwordInput = document.getElementById("signupPassword");
        const confirmInput = document.getElementById("signupConfirmPassword");

        const nameError = document.getElementById("signupNameError");
        const emailError = document.getElementById("signupEmailError");
        const passwordError = document.getElementById("signupPasswordError");
        const confirmError = document.getElementById("signupConfirmPasswordError");

        [nameError, emailError, passwordError, confirmError].forEach(el => { if (el) el.textContent = ""; });
        [nameInput, emailInput, passwordInput, confirmInput].forEach(el => { if (el) el.classList.remove("input-invalid"); });

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmInput ? confirmInput.value : "";
        let hasError = false;

        if (!name || name.length < 2) {
            if (nameError) nameError.textContent = "Please enter your full name (at least 2 characters).";
            if (nameInput) nameInput.classList.add("input-invalid");
            hasError = true;
        }

        if (!email) {
            if (emailError) emailError.textContent = "Please enter your email address.";
            if (emailInput) emailInput.classList.add("input-invalid");
            hasError = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            if (emailError) emailError.textContent = "Please enter a valid email format.";
            if (emailInput) emailInput.classList.add("input-invalid");
            hasError = true;
        }

        if (!password) {
            if (passwordError) passwordError.textContent = "Please enter a password.";
            if (passwordInput) passwordInput.classList.add("input-invalid");
            hasError = true;
        } else if (password.length < 6) {
            if (passwordError) passwordError.textContent = "Password must be at least 6 characters long.";
            if (passwordInput) passwordInput.classList.add("input-invalid");
            hasError = true;
        }

        if (!confirmPassword) {
            if (confirmError) confirmError.textContent = "Please confirm your password.";
            if (confirmInput) confirmInput.classList.add("input-invalid");
            hasError = true;
        } else if (password !== confirmPassword) {
            if (confirmError) confirmError.textContent = "Passwords do not match.";
            if (confirmInput) confirmInput.classList.add("input-invalid");
            hasError = true;
        }

        if (hasError) return;
        handleSignup(name, email, password);
    });
}

// 13. INITIALIZE WEBSITE
const footerWaLink = document.getElementById("footerWhatsAppLink");
if (footerWaLink) footerWaLink.href = getOfficialWhatsAppUrl();

filterItems();
initAuthSession();

console.log("Campus Exchange is ready!");
console.log("Total listings:", items.length);
