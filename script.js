
/* ---------- LOAD AND SAVE ITEMS ---------- */

function loadSavedItems() {
    try {
        const savedData = localStorage.getItem("lifeAdminItems");
        const parsedData = savedData ? JSON.parse(savedData) : [];

        if (!Array.isArray(parsedData)) return [];

        return parsedData.filter(function(item) {
            return item &&
                typeof item.name === "string" &&
                typeof item.category === "string" &&
                typeof item.date === "string";
        });
    } catch (error) {
        return [];
    }
}

const items = loadSavedItems();

function saveItems() {
    try {
        localStorage.setItem("lifeAdminItems", JSON.stringify(items));
    } catch (error) {
        console.error("Unable to save items.", error);
    }
}

/* ---------- ELEMENTS ---------- */

const totalItemsElement = document.querySelector("#total-items");
const activeItemsElement = document.querySelector("#active-items");
const expiringItemsElement = document.querySelector("#expiring-items");
const expiredItemsElement = document.querySelector("#expired-items");

const form = document.querySelector("#item-form");
const itemName = document.querySelector("#item-name");
const itemCategory = document.querySelector("#item-category");
const itemDate = document.querySelector("#item-date");
const itemNotes = document.querySelector("#item-notes");

const searchInput = document.querySelector(".header-actions input");
const recentList = document.querySelector(".recent-list");
const upcomingList = document.querySelector(".upcoming-list");

const recentViewAllButton = document.querySelector(".view-all-btn");
const upcomingViewAllButton = document.querySelector(".upcoming-view-all-btn");

const detailsModal = document.querySelector("#details-modal");
const detailsCloseButton = document.querySelector("#details-close");
const detailsTitle = document.querySelector("#details-title");
const detailsCategory = document.querySelector("#details-category");
const detailsDate = document.querySelector("#details-date");
const detailsStatus = document.querySelector("#details-status");
const detailsNotes = document.querySelector("#details-notes");

let searchText = "";
let activeCategory = "all";
let showAllRecent = false;
let showAllUpcoming = false;

/* ---------- ITEM STATUS ---------- */

function getStatus(date) {
    const expiryDate = new Date(date);

    if (Number.isNaN(expiryDate.getTime())) return "Unknown";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const daysRemaining = (expiryDate - today) / (1000 * 60 * 60 * 24);

    if (daysRemaining < 0) return "Expired";
    if (daysRemaining <= 30) return "Expiring Soon";

    return "Active";
}

function getStatusClass(status) {
    if (status === "Expiring Soon") return "warning";
    if (status === "Expired") return "expired";
    return "active";
}

function formatCategory(category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
}

/* ---------- UPDATE STATISTICS ---------- */

function updateStats() {
    let active = 0;
    let expiring = 0;
    let expired = 0;

    items.forEach(function(item) {
        const status = getStatus(item.date);

        if (status === "Active") active++;
        else if (status === "Expiring Soon") expiring++;
        else if (status === "Expired") expired++;
    });

    totalItemsElement.textContent = items.length;
    activeItemsElement.textContent = active;
    expiringItemsElement.textContent = expiring;
    expiredItemsElement.textContent = expired;
}

/* ---------- ADD ITEM ---------- */

form.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = itemName.value.trim();
    const category = itemCategory.value;
    const date = itemDate.value;
    const notes = itemNotes.value.trim();

    if (!name || !category || !date) {
        form.reportValidity();
        return;
    }

    items.push({
        name: name,
        category: category,
        date: date,
        notes: notes
    });

    saveItems();
    updateStats();
    renderRecentItems();
    updateUpcomingRenewals();

    form.reset();
});

/* ---------- RECENT ITEMS ---------- */

function renderRecentItems() {
    recentList.innerHTML = "";

    const filteredItems = items.filter(function(item) {
        const matchesSearch =
            item.name.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText);

        const matchesCategory =
            activeCategory === "all" ||
            item.category.toLowerCase() === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const visibleItems = showAllRecent
        ? filteredItems.slice().reverse()
        : filteredItems.slice(-3).reverse();

    visibleItems.forEach(function(item) {
        const status = getStatus(item.date);
        const recentItem = document.createElement("div");

        recentItem.className = "recent-item";

        recentItem.innerHTML = `
            <div class="recent-item-main">
                <div>
                    <h3 class="item-name"></h3>
                    <p class="item-category"></p>
                </div>
            </div>

            <div class="recent-item-details">
                <span class="item-date"></span>
                <span class="recent-status"></span>
                <button class="recent-details-btn" type="button">Details</button>
                <button class="recent-delete-btn" type="button">Delete</button>
            </div>
        `;

        // Display item information as plain text.
        recentItem.querySelector(".item-name").textContent = item.name;
        recentItem.querySelector(".item-category").textContent =
            formatCategory(item.category);
        recentItem.querySelector(".item-date").textContent = item.date;

        const statusElement = recentItem.querySelector(".recent-status");
        statusElement.textContent = status;
        statusElement.classList.add(getStatusClass(status));

        // Open item details.
        recentItem.querySelector(".recent-details-btn")
            .addEventListener("click", function() {
                detailsTitle.textContent = item.name;
                detailsCategory.textContent = formatCategory(item.category);
                detailsDate.textContent = item.date;
                detailsStatus.textContent = status;
                detailsNotes.textContent = item.notes || "No notes added.";

                detailsModal.classList.add("show");
            });

        // Delete item.
        recentItem.querySelector(".recent-delete-btn")
            .addEventListener("click", function() {
                const itemIndex = items.indexOf(item);

                if (itemIndex === -1) return;

                items.splice(itemIndex, 1);
                saveItems();
                updateStats();
                renderRecentItems();
                updateUpcomingRenewals();
            });

        recentList.appendChild(recentItem);
    });
}

/* ---------- UPCOMING RENEWALS ---------- */

function updateUpcomingRenewals() {
    upcomingList.innerHTML = "";

    const upcomingItems = items.filter(function(item) {
        return getStatus(item.date) === "Expiring Soon";
    });

    const visibleItems = showAllUpcoming
        ? upcomingItems
        : upcomingItems.slice(0, 3);

    visibleItems.forEach(function(item) {
        const listItem = document.createElement("li");
        listItem.className = "upcoming-item";

        const itemInfo = document.createElement("div");
        const name = document.createElement("h3");
        const category = document.createElement("p");

        name.textContent = item.name;
        category.textContent = formatCategory(item.category);

        itemInfo.append(name, category);

        const dateInfo = document.createElement("div");
        const date = document.createElement("span");
        const status = document.createElement("span");

        date.textContent = item.date;
        status.className = "status status-warning";
        status.textContent = "Expiring Soon";

        dateInfo.append(date, status);
        listItem.append(itemInfo, dateInfo);
        upcomingList.appendChild(listItem);
    });
}

/* ---------- VIEW ALL BUTTONS ---------- */

recentViewAllButton.addEventListener("click", function() {
    if (searchText) return;

    showAllRecent = !showAllRecent;

    recentViewAllButton.textContent =
        showAllRecent ? "Show Less" : "View All";

    renderRecentItems();
});

if (upcomingViewAllButton) {
    upcomingViewAllButton.addEventListener("click", function() {
        showAllUpcoming = !showAllUpcoming;

        upcomingViewAllButton.textContent =
            showAllUpcoming ? "Show Less" : "View All";

        updateUpcomingRenewals();
    });
}

/* ---------- SEARCH ---------- */

if (searchInput) {
    searchInput.addEventListener("input", function() {
        searchText = searchInput.value.trim().toLowerCase();
        showAllRecent = searchText !== "";

        recentViewAllButton.textContent =
            searchText ? "Search Results" : "View All";

        renderRecentItems();
    });
}

/* ---------- SIDEBAR NAVIGATION ---------- */

const quickAddLink = document.querySelector(".quick-add-link");
const quickAddSection = document.querySelector(".quick-add-section");
const dashboardLink = document.querySelector(".dashboard-link");

if (quickAddLink) {
    quickAddLink.addEventListener("click", function(event) {
        event.preventDefault();
        quickAddSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
        itemName.focus();
    });
}

if (dashboardLink) {
    dashboardLink.addEventListener("click", function(event) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function filterByCategory(category) {
    activeCategory = category;
    showAllRecent = true;
    searchText = "";

    if (searchInput) searchInput.value = "";

    recentViewAllButton.textContent = "Show Less";
    renderRecentItems();

    document.querySelector(".recent-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

[
    [".documents-link", "document"],
    [".warranties-link", "warranty"],
    [".subscriptions-link", "subscription"],
    [".renewals-link", "renewal"],
    [".all-items-link", "all"]
].forEach(function(entry) {
    const link = document.querySelector(entry[0]);

    if (link) {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            filterByCategory(entry[1]);
        });
    }
});

/* ---------- DARK MODE ---------- */

const darkModeToggle = document.querySelector(".dark-mode-toggle");

if (darkModeToggle) {
    darkModeToggle.addEventListener("click", function(event) {
        event.preventDefault();
        document.body.classList.toggle("dark-mode");
    });
}

/* ---------- CLOSE DETAILS POPUP ---------- */

function closeDetails() {
    detailsModal.classList.remove("show");
}

detailsCloseButton.addEventListener("click", closeDetails);

detailsModal.addEventListener("click", function(event) {
    if (event.target === detailsModal) closeDetails();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") closeDetails();
});

/* ---------- INITIAL DISPLAY ---------- */

updateStats();
renderRecentItems();
updateUpcomingRenewals();
