// ============================================
// STARTUP VALIDATOR AI - TEAM PHOENIX
// My Reports + PDF Download
// ============================================

const API_URL =
    "https://ai-based-startup-idea-validator-lvvt.onrender.com/analyze";

const STORAGE_KEY = "startupValidatorReports";

const validateBtn = document.getElementById("validateBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

const startupIdea = document.getElementById("startupIdea");
const audience = document.getElementById("audience");
const locationInput = document.getElementById("location");
const budget = document.getElementById("budget");

const results = document.getElementById("results");
const reportsSection = document.querySelector("#reports .form-card");

downloadPdfBtn.style.display = "none";

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

function getSavedReports() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        console.error("Could not read saved reports:", error);
        return [];
    }
}

function saveReport(report) {
    try {
        const reports = getSavedReports();

        reports.unshift(report);

        // Keep only the latest 20 reports
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(reports.slice(0, 20))
        );

        return true;
    } catch (error) {
        console.error("Could not save report:", error);
        return false;
    }
}

// ============================================
// DISPLAY SAVED REPORTS
// ============================================

function renderSavedReports() {
    if (!reportsSection) return;

    const reports = getSavedReports();

    if (reports.length === 0) {
        reportsSection.innerHTML = `
            <p>No saved reports yet.</p>
            <p>Generate your first startup analysis!</p>
        `;
        return;
    }

    reportsSection.innerHTML = `
        <div id="savedReportsList">
            ${reports.map(report => `
                <div class="feature-card">

                    <h3>${escapeHTML(report.idea)}</h3>

                    <p>
                        📅 ${escapeHTML(report.createdAt)}
                    </p>

                    <div style="margin-top:15px; display:flex; gap:10px; flex-wrap:wrap;">

                        <button
                            class="report-action-btn"
                            data-action="view"
                            data-id="${escapeHTML(report.id)}">
                            👁️ View Report
                        </button>

                        <button
                            class="report-action-btn"
                            data-action="delete"
                            data-id="${escapeHTML(report.id)}">
                            🗑️ Delete
                        </button>

                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

// ============================================
// VIEW AND DELETE REPORTS
// ============================================

reportsSection.addEventListener("click", function(event) {

    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const reportId = button.dataset.id;
    const action = button.dataset.action;

    const reports = getSavedReports();

    const selectedReport = reports.find(
        report => report.id === reportId
    );

    if (action === "view" && selectedReport) {

        displayReport(selectedReport);

        document.getElementById("validate").scrollIntoView({
            behavior: "smooth"
        });
    }

    if (action === "delete") {

        if (!confirm("Are you sure you want to delete this report?")) {
            return;
        }

        const updatedReports = reports.filter(
            report => report.id !== reportId
        );

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(updatedReports)
        );

        renderSavedReports();
    }
});

// ============================================
// DISPLAY A REPORT
// ============================================

function displayReport(report) {

    const reportHTML = window.marked
        ? window.marked.parse(report.report)
        : `<pre>${escapeHTML(report.report)}</pre>`;

    const safeReport = window.DOMPurify
        ? window.DOMPurify.sanitize(reportHTML)
        : `<pre>${escapeHTML(report.report)}</pre>`;

    const sources = (report.web_results || [])
        .map(item => {
            const url = safeURL(item.url);

            if (url === "#") return "";

            return `
                <li>
                    <a href="${escapeHTML(url)}"
                       target="_blank"
                       rel="noopener noreferrer">
                       ${escapeHTML(item.title || item.url)}
                    </a>
                </li>
            `;
        })
        .join("");

    results.innerHTML = `
        <div class="feature-card report-card">

            <h2>🎉 Startup Analysis Report</h2>

            <p><strong>Startup Idea:</strong>
                ${escapeHTML(report.idea)}
            </p>

            <div class="report-content">
                ${safeReport}
            </div>

            <div class="research-sources">
                <h3>🔍 Research Sources</h3>
                <ul>
                    ${sources || "<li>No sources found.</li>"}
                </ul>
            </div>

        </div>
    `;

    downloadPdfBtn.style.display = "block";
}

// ============================================
// STARTUP IDEA ANALYSIS
// ============================================

validateBtn.addEventListener("click", async function() {

    const idea = startupIdea.value.trim();

    if (!idea) {
        alert("Please enter your startup idea!");
        startupIdea.focus();
        return;
    }

    validateBtn.disabled = true;
    validateBtn.textContent = "Analyzing... Please wait";

    downloadPdfBtn.style.display = "none";

    results.innerHTML = `
        <div class="feature-card">
            <h3>🤖 AI is researching your idea...</h3>
            <p>Please wait while your report is generated.</p>
        </div>
    `;

    try {

        const requestData = {
            idea: idea,
            audience: audience.value.trim() || "General customers",
            location: locationInput.value.trim() || "India",
            budget: budget.value.trim() || "Not specified"
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : JSON.stringify(data.detail || data)
            );
        }

        if (!data.report || !data.report.trim()) {
            throw new Error("AI returned an empty report.");
        }

        const newReport = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            idea: requestData.idea,
            audience: requestData.audience,
            location: requestData.location,
            budget: requestData.budget,
            report: data.report,
            web_results: data.web_results || [],
            createdAt: new Date().toLocaleString()
        };

        displayReport(newReport);

        const saved = saveReport(newReport);

        renderSavedReports();

        if (!saved) {
            alert("Report generated, but could not be saved in browser storage.");
        }

    } catch (error) {

        console.error("Analysis error:", error);

        results.innerHTML = `
            <div class="feature-card">
                <h3>❌ Analysis Error</h3>
                <p>${escapeHTML(error.message)}</p>
                <p>Please check your backend and internet connection.</p>
            </div>
        `;

    } finally {

        validateBtn.disabled = false;
        validateBtn.textContent = "Analyze My Startup →";

    }
});

// ============================================
// PDF DOWNLOAD
// ============================================

downloadPdfBtn.addEventListener("click", function() {

    const report = document.querySelector(".report-card");

    if (!report) {
        alert("Please open a report first!");
        return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups for PDF download.");
        return;
    }

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Startup Analysis Report</title>

            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }

                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    line-height: 1.7;
                }

                h1, h2 {
                    color: #343b80;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 12px;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                    overflow-wrap: anywhere;
                }

                th {
                    background: #343b80;
                    color: white;
                }

                img {
                    max-width: 100%;
                }

                a {
                    color: #5146c8;
                    overflow-wrap: anywhere;
                }

                pre {
                    white-space: pre-wrap;
                }
            </style>
        </head>

        <body>
            <h1>🚀 Startup Validator AI</h1>
            ${report.innerHTML}
        </body>
        </html>
    `);

    printWindow.document.close();

    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
    };

});

// ============================================
// HELPER FUNCTIONS
// ============================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function safeURL(value) {
    try {
        const url = new URL(value);

        if (
            url.protocol === "http:" ||
            url.protocol === "https:"
        ) {
            return url.href;
        }

        return "#";

    } catch {
        return "#";
    }
}

// ============================================
// LOAD REPORTS WHEN PAGE OPENS
// ============================================

renderSavedReports();

console.log("Startup Validator AI is ready!");

// ============================================
// SEVEN INFORMATION POPUPS
// These explain each feature; live personalised
// research is still generated by the /analyze API.
// ============================================
const infoContent = {
    "ai-analysis": { title: "AI Startup Analysis", intro: "AI-powered analysis helps turn your startup idea into a structured business assessment.", heading: "What this feature explains", points: ["The problem your idea is trying to solve.", "Your target customers and the value you may offer them.", "Business feasibility, possible risks and areas that need validation.", "Practical next steps to improve the idea."] },
    "live-research": { title: "Live Market Research", intro: "Market research looks for relevant information about the industry and the market around your idea.", heading: "What it can help identify", points: ["Current market trends and customer needs.", "Signals of demand for the product or service.", "Relevant industry information and sources found during research.", "Market gaps that may create an opportunity."] },
    "competitors": { title: "Competitor Research", intro: "Competitor research helps you understand other businesses that offer similar products or solve the same customer problem.", heading: "What it can show", points: ["Names of relevant competitors when available.", "Their products, services and target customers.", "How your idea may be different from existing options.", "Possible gaps you could focus on."] },
    "market-research": { title: "Market Research", intro: "Market research studies the customers, demand and industry conditions related to your startup idea.", heading: "Key areas", points: ["Customer demand: who may need the product and why.", "Industry trends: changes that may affect the business.", "Target market: the customer group and location to focus on.", "Market opportunity: unmet needs or problems worth exploring."] },
    "competitor-analysis": { title: "Competitor Analysis", intro: "Competitor analysis compares your proposed business with existing alternatives in the market.", heading: "Key areas", points: ["Direct competitors offering a similar solution.", "Indirect competitors solving the same problem differently.", "Competitor products, services and positioning.", "Potential ways to differentiate your product or service."] },
    "ai-insights": { title: "AI Insights", intro: "AI insights turn the available research and analysis into suggestions you can consider while developing your startup.", heading: "Examples of suggestions", points: ["Refine the problem statement and value proposition.", "Focus on a clearer target customer segment.", "Consider useful features for an initial product version (MVP).", "Review pricing, marketing and launch priorities."] },
    "swot": { title: "SWOT Analysis", intro: "SWOT is a framework for looking at the internal and external factors that may affect a business idea.", heading: "The four parts", points: ["Strengths: internal advantages your startup may have.", "Weaknesses: internal limitations or areas to improve.", "Opportunities: external trends or market gaps you may benefit from.", "Threats: external risks such as competition, regulation or changing demand."] }
};

(function setupInfoPopups() {
    const modal = document.getElementById("infoModal");
    const dialog = modal?.querySelector(".info-modal-dialog");
    const title = document.getElementById("infoModalTitle");
    const body = document.getElementById("infoModalBody");
    if (!modal || !dialog || !title || !body) return;

    let previousFocus = null;

    function closeInfoModal() {
        modal.classList.remove("is-open");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    }

    function openInfoModal(key, trigger) {
        const content = infoContent[key];
        if (!content) return;
        previousFocus = trigger || document.activeElement;
        title.textContent = content.title;
        body.replaceChildren();
        const intro = document.createElement("p");
        intro.textContent = content.intro;
        body.appendChild(intro);
        const heading = document.createElement("h3");
        heading.textContent = content.heading;
        body.appendChild(heading);
        const list = document.createElement("ul");
        content.points.forEach((point) => {
            const item = document.createElement("li");
            item.textContent = point;
            list.appendChild(item);
        });
        body.appendChild(list);
        modal.classList.add("is-open");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        modal.querySelector(".info-modal-close")?.focus();
    }

    document.addEventListener("click", (event) => {
        const card = event.target.closest("[data-detail]");
        if (card) openInfoModal(card.dataset.detail, card);
        if (event.target.closest("[data-modal-close]")) closeInfoModal();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("is-open")) closeInfoModal();
        const card = event.target.closest?.("[data-detail]");
        if (card && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openInfoModal(card.dataset.detail, card);
        }
    });
})();
