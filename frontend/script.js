
// ============================================
// STARTUP VALIDATOR AI - COMPLETE JAVASCRIPT
// Team Phoenix
// ============================================


// 1. GET HTML ELEMENTS

const validateBtn = document.getElementById("validateBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

const startupIdea = document.getElementById("startupIdea");
const audience = document.getElementById("audience");
const locationInput = document.getElementById("location");
const budget = document.getElementById("budget");

const results = document.getElementById("results");


// Check required elements

if (
    !validateBtn ||
    !downloadPdfBtn ||
    !startupIdea ||
    !audience ||
    !locationInput ||
    !budget ||
    !results
) {
    console.error("Required HTML elements are missing!");
}


// ============================================
// 2. STARTUP IDEA ANALYSIS
// ============================================

validateBtn.addEventListener("click", async function () {

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
            <h3>🤖 AI is researching your startup idea...</h3>
            <p>Please wait while we analyze your market and competitors.</p>
        </div>
    `;

    try {

        // Send request to FastAPI backend

        const response = await fetch(
            "https://ai-based-startup-idea-validator-lvvt.onrender.com/analyze",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    idea: idea,

                    audience:
                        audience.value.trim() || "General customers",

                    location:
                        locationInput.value.trim() || "India",

                    budget:
                        budget.value.trim() || "Not specified"

                })
            }
        );


        // Get API response

        const data = await response.json();


        // Debugging information

        console.log("API RESPONSE:", data);
        console.log("REPORT:", data.report);
        console.log("WEB RESULTS:", data.web_results);


        // Check response

        if (!response.ok) {

            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : "Backend request failed. Status: " + response.status
            );

        }


        if (!data.success) {
            throw new Error("Startup analysis failed.");
        }


        if (
            typeof data.report !== "string" ||
            !data.report.trim()
        ) {
            throw new Error("AI returned an empty report.");
        }


        // ============================================
        // 3. CONVERT MARKDOWN INTO HTML
        // ============================================

        let reportHTML;

        if (window.marked) {

            reportHTML = window.marked.parse(data.report);

        } else {

            reportHTML = `<pre>${escapeHTML(data.report)}</pre>`;

        }


        // Sanitize generated HTML

        const safeReport = window.DOMPurify
            ? window.DOMPurify.sanitize(reportHTML)
            : `<pre>${escapeHTML(data.report)}</pre>`;


        // ============================================
        // 4. DISPLAY RESEARCH SOURCES
        // ============================================

        const sources = (data.web_results || [])
            .map(item => {

                const url = safeURL(item.url);

                return `
                    <li>
                        <a
                            href="${url}"
                            target="_blank"
                            rel="noopener noreferrer">

                            ${escapeHTML(
                                item.title ||
                                item.url ||
                                "Research Source"
                            )}

                        </a>
                    </li>
                `;

            })
            .join("");


        // ============================================
        // 5. DISPLAY FINAL REPORT
        // ============================================

        results.innerHTML = `

            <div class="feature-card report-card">

                <h2>🎉 Your Startup Analysis Report</h2>

                <div class="report-content">
                    ${safeReport}
                </div>

                <div class="research-sources">

                    <h3>🔍 Research Sources</h3>

                    <ul>
                        ${
                            sources ||
                            "<li>No research sources found.</li>"
                        }
                    </ul>

                </div>

            </div>

        `;


        // Show PDF button

        downloadPdfBtn.style.display = "block";

        console.log("Startup report displayed successfully!");


    } catch (error) {

        console.error("STARTUP ANALYSIS ERROR:", error);

        results.innerHTML = `

            <div class="feature-card">

                <h3>❌ Analysis Error</h3>

                <p>${escapeHTML(error.message)}</p>

                <p>
                    Please check whether the backend server
                    is running.
                </p>

            </div>

        `;

    } finally {

        validateBtn.disabled = false;

        validateBtn.textContent = "Analyze My Startup →";

    }

});


// ============================================
// 6. DOWNLOAD REPORT USING PRINT TO PDF
// ============================================

downloadPdfBtn.addEventListener("click", function () {
    const report = document.querySelector(".report-card");

    if (!report) {
        alert("Please generate a startup report first!");
        return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
        alert("Please allow pop-ups for this website.");
        return;
    }

    downloadPdfBtn.disabled = true;
    downloadPdfBtn.textContent = "Preparing PDF...";

    const reportHTML = report.innerHTML;

    printWindow.document.open();

    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>Startup Analysis Report</title>

            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    color: #333;
                    background: white;
                    line-height: 1.6;
                    font-size: 12px;
                }

                h1, h2, h3 {
                    color: #343b80;
                    page-break-after: avoid;
                }

                h1 {
                    font-size: 25px;
                }

                h2 {
                    font-size: 20px;
                    margin-top: 25px;
                }

                h3 {
                    font-size: 16px;
                }

                p, li {
                    line-height: 1.6;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: auto;
                    margin: 16px 0;
                    page-break-inside: auto;
                }

                thead {
                    display: table-header-group;
                }

                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                    overflow-wrap: anywhere;
                    vertical-align: top;
                }

                th {
                    background: #343b80 !important;
                    color: white !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }

                ul, ol {
                    padding-left: 22px;
                }

                a {
                    color: #343b80;
                    overflow-wrap: anywhere;
                }

                .research-sources {
                    margin-top: 25px;
                    padding: 15px;
                    border: 1px solid #ddd;
                    page-break-inside: avoid;
                }

                .report-content {
                    width: 100%;
                    overflow: visible;
                }

                pre {
                    white-space: pre-wrap;
                    overflow-wrap: anywhere;
                }

                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>

        <body>
            <h1>🚀 Startup Validator AI</h1>

            <div class="report-card">
                ${reportHTML}
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();

    printWindow.onload = function () {
        printWindow.focus();

        setTimeout(function () {
            printWindow.print();

            downloadPdfBtn.disabled = false;
            downloadPdfBtn.textContent = "📥 Download PDF";
        }, 500);
    };
});



// ============================================
// 7. ESCAPE HTML CHARACTERS
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


// ============================================
// 8. VALIDATE RESEARCH SOURCE URLS
// ============================================

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