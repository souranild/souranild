import { initDesktop } from './desktop.js';
import { initZsh, updateZshFiles } from './zsh.js';
import { getResumeData } from './resumeParser.js';

// Application entry orchestrator
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch and parse resume.tex
    const resumeData = await getResumeData();
    window.resumeData = resumeData;

    // 2. Populate application windows with parsed/fallback LaTeX details
    window.updateWindowsWithResume = updateWindowsWithResume;
    updateWindowsWithResume(resumeData);

    // 3. Initialise the Linux Desktop window manager and hotspots
    initDesktop();

    // 4. Initialise the ZSH shell command prompt
    initZsh();

    // 5. Sync and start Gnome system clock ticks
    startClock();
});

function updateWindowsWithResume(resumeData) {
    // 1. Evince PDF Resume Document Viewer
    const pdfSheet = document.querySelector('.pdf-sheet');
    if (pdfSheet) {
        let expHtml = '';
        resumeData.experience.forEach(job => {
            expHtml += `
                <div class="pdf-item">
                    <div class="pdf-item-title">${job.role} | ${job.company}</div>
                    <div class="pdf-item-date">${job.location} | ${job.date}</div>
                    <div class="pdf-item-desc">
                        ${job.bullets.map(b => `- ${b}`).join('<br>')}
                    </div>
                </div>
            `;
        });
        
        let edHtml = '';
        resumeData.education.forEach(edu => {
            edHtml += `
                <div class="pdf-item">
                    <div class="pdf-item-title">${edu.degree} | ${edu.school}</div>
                    <div class="pdf-item-date">${edu.location} | ${edu.date}</div>
                    <div class="pdf-item-desc">
                        ${edu.bullets.map(b => `- ${b}`).join('<br>')}
                    </div>
                </div>
            `;
        });

        pdfSheet.innerHTML = `
            <div class="pdf-header-name">${resumeData.name}</div>
            <div class="pdf-header-sub">${resumeData.title}</div>
            <hr class="pdf-line">
            
            <div class="pdf-section">EXPERIENCE</div>
            ${expHtml}
            
            <div class="pdf-section">EDUCATION</div>
            ${edHtml}
        `;
    }

    // 2. LibreOffice Projects Document
    const loSheet = document.querySelector('.lo-paper-sheet');
    if (loSheet) {
        let projHtml = '';
        resumeData.projects.forEach((proj, idx) => {
            projHtml += `
                <h2 class="lo-section-title">${idx + 1}. ${proj.name}</h2>
                <p class="lo-text">${proj.description}</p>
                <div class="lo-tags">Tags: ${proj.tags}</div>
            `;
        });

        loSheet.innerHTML = `
            <h1 class="lo-doc-title">Project Directory - ${resumeData.name}</h1>
            <p class="lo-doc-meta">Status: Released | Security: Internal</p>
            ${projHtml}
        `;
    }

    // 3. VS Code Papers Split-Editor
    const codeEditor = document.querySelector('.code-editor-area code');
    const previewBody = document.querySelector('.markdown-preview-body');
    if (codeEditor && previewBody) {
        let rawMd = `<span class="md-h1"># Research Publications</span>\n\n`;
        let previewHtml = `<h1>Research Publications</h1>`;

        resumeData.publications.forEach((pub, idx) => {
            rawMd += `<span class="md-h2">## Paper ${idx + 1}: ${pub.title.split(':')[0]}</span>\n`;
            rawMd += `* **Title:** ${pub.title}\n`;
            rawMd += `* **Publisher:** ${pub.publisher}\n`;
            rawMd += `* **Summary:** ${pub.summary}\n\n`;

            previewHtml += `
                <h2>Paper ${idx + 1}: ${pub.title.split(':')[0]}</h2>
                <p><strong>Title:</strong> ${pub.title}</p>
                <p><strong>Publisher:</strong> ${pub.publisher}</p>
                <p><strong>Summary:</strong> ${pub.summary}</p>
            `;
        });

        codeEditor.innerHTML = rawMd;
        previewBody.innerHTML = previewHtml;
        
        // Update line numbers dynamically
        const lineNumbers = document.querySelector('.line-numbers');
        if (lineNumbers) {
            const lineCount = rawMd.split('\n').length;
            let linesHtml = '';
            for (let l = 1; l <= lineCount; l++) {
                linesHtml += `<span>${l}</span>`;
            }
            lineNumbers.innerHTML = linesHtml;
        }
    }

    // 4. Propagate changes to Terminal local file assets
    updateZshFiles(resumeData);
}

function startClock() {
    const timeElem = document.getElementById('system-time');
    if (!timeElem) return;

    function updateClock() {
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const dayName = days[now.getDay()];
        const monthName = months[now.getMonth()];
        const dayNum = now.getDate();
        
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // convert 0 to 12
        
        // Output format: "Thu Jun 22, 01:18 AM"
        timeElem.textContent = `${dayName} ${monthName} ${dayNum}, ${hours}:${minutes} ${ampm}`;
    }

    updateClock();
    setInterval(updateClock, 30000); // refresh every 30s
}

