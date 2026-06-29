import { initDesktop } from './desktop.js';
import { initZsh, updateZshFiles } from './zsh.js';
import { getResumeData } from './resumeParser.js';
import { initBootScreen } from './boot.js';
import { initPowerOff } from './theme.js';

// Application entry orchestrator
window.addEventListener('DOMContentLoaded', async () => {
    // 0. Boot screen (GRUB → systemd → login card) — runs on top of everything
    initBootScreen();

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

    // 6. Initialise the Power Off Button
    initPowerOff();
});

function updateWindowsWithResume(resumeData) {
    // 1. Evince PDF Resume Document Viewer - Now displays papers.pdf
    const sheet1 = document.getElementById('pdf-sheet-1');
    const sheet2 = document.getElementById('pdf-sheet-2');
    if (sheet1 && sheet2) {
        // Sheet 1: Paper 1 (AI Hydroponics)
        sheet1.innerHTML = `
            <div class="pdf-header-name" style="font-size:1.1rem; text-align:center; line-height:1.3; font-weight:800;">
                REVOLUTIONIZING HOLY-BASIL CULTIVATION WITH AI-ENABLED HYDROPONICS SYSTEM
            </div>
            <div style="font-size:0.75rem; text-align:center; color:#555; margin-top:0.3rem;">
                Souranil Das, et al. | IEEE Access (2023)
            </div>
            <div style="text-align:center; margin-top:0.25rem; font-size:0.7rem;">
                <a href="https://ieeexplore.ieee.org/document/10198435" target="_blank" style="color:#0284c7; text-decoration:underline; font-weight:bold;">Open Article (IEEE Xplore)</a>
            </div>
            <hr class="pdf-line" style="margin: 0.5rem 0 0.8rem 0;">
            
            <div style="font-size:0.75rem; font-weight:bold; color:#111; margin-bottom:0.3rem;">ABSTRACT</div>
            <p style="font-size:0.7rem; line-height:1.4; text-align:justify; margin:0 0 0.8rem 0; color:#222;">
                Traditional cultivation of medicinal crops such as Holy-Basil (Ocimum tenuiflorum) often struggles with inconsistent environmental factors, leading to variable chemical yields. This paper presents an automated vertical farming hydroponics framework coupled with cloud machine learning. Utilizing Azure IoT Hub, sensory readings for pH, Electrical Conductivity (EC), temperature, and air quality are logged in real-time. The gathered telemetry datasets are subsequently analyzed in Azure Databricks, where predictive regression models optimize lighting arrays and automated nutrient dosing schedules dynamically, yielding a highly controlled and efficient cultivation cycle.
            </p>
            
            <div style="font-size:0.75rem; font-weight:bold; color:#111; margin-bottom:0.3rem;">SYSTEM ARCHITECTURE</div>
            <p style="font-size:0.7rem; line-height:1.4; text-align:justify; margin:0 0 0.8rem 0; color:#222;">
                The hardware-software co-design consists of local sensory nodes wired to microcontrollers that handle telemetry packetization. A secure gateway uploads data to Azure. Databricks runs regression scripts every hour to adjust lighting duration and pH balance pump intervals automatically.
            </p>
            
            <div style="font-size:0.75rem; font-weight:bold; color:#111; margin-bottom:0.3rem;">KEY RESULTS & CONTRIBUTION</div>
            <p style="font-size:0.7rem; line-height:1.4; text-align:justify; margin:0 0 0 0; color:#222;">
                - Automated pH and EC maintenance loops reduced manual labor overhead by 92%.<br>
                - Regression modeling achieved 14% faster biomass growth compared to baseline static control schedules.<br>
                - Real-time plant vitals telemetry scoring enabled early detection of nutrient deficiencies.
            </p>
        `;

        // Sheet 2: Paper 2 (SMADE IoT Assist)
        sheet2.innerHTML = `
            <div class="pdf-header-name" style="font-size:1.1rem; text-align:center; line-height:1.3; font-weight:800;">
                SMADE - SMART MEDICAL ASSIST DEVICE FOR ELDERS
            </div>
            <div style="font-size:0.75rem; text-align:center; color:#555; margin-top:0.3rem;">
                Souranil Das, et al. | Springer, ICCCSP Proceedings (2022)
            </div>
            <div style="text-align:center; margin-top:0.25rem; font-size:0.7rem;">
                <a href="https://doi.org/10.1007/978-3-031-11633-9_19" target="_blank" style="color:#0284c7; text-decoration:underline; font-weight:bold;">Open Article (Springer Link)</a>
            </div>
            <hr class="pdf-line" style="margin: 0.5rem 0 0.8rem 0;">
            
            <div style="font-size:0.75rem; font-weight:bold; color:#111; margin-bottom:0.3rem;">ABSTRACT</div>
            <p style="font-size:0.7rem; line-height:1.4; text-align:justify; margin:0 0 0.8rem 0; color:#222;">
                Adherence to medication regimens is critical for geriatric healthcare. SMADE (Smart Medical Assist Device) is an embedded, assistive IoT capsule that automates multi-dose pill dispensing cycles. By integrating microcontrollers with vital sensors (photoplethysmogram for heart rate, thermal sensors), SMADE monitors patient vitals during dispensing interactions. Real-time telemetry streams are logged to secure web portal databases, raising automated alarm logs for caregivers upon detection of critical vital thresholds or missed medication cycles.
            </p>
            
            <div style="font-size:0.75rem; font-weight:bold; color:#111; margin-bottom:0.3rem;">HARDWARE & EMBEDDED LOGIC</div>
            <p style="font-size:0.7rem; line-height:1.4; text-align:justify; margin:0 0 0.8rem 0; color:#222;">
                The device houses an automated rotary pill dispenser mechanism calibrated with micro-servos. It leverages a low-power microcontroller with built-in Wi-Fi, executing local timing loops synchronized with network NTP servers to assure absolute schedule accuracy.
            </p>
            
            <div style="font-size:0.75rem; font-weight:bold; color:#111; margin-bottom:0.3rem;">KEY RESULTS & CONTRIBUTION</div>
            <p style="font-size:0.7rem; line-height:1.4; text-align:justify; margin:0 0 0 0; color:#222;">
                - Pill dispensing accuracy rate of 99.8% across 500 test trials.<br>
                - Vital signs monitoring triggers SMS/Email warnings to registered medical personnel within 1.2 seconds of telemetry anomalies.<br>
                - Dual power options (mains & auxiliary battery backup) ensure uninterrupted active service.
            </p>
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
    const codeEditor = document.getElementById('vscode-textarea');
    const previewBody = document.querySelector('.markdown-preview-body');
    if (codeEditor && previewBody) {
        let rawMd = `# Research Publications\n\n`;
        let previewHtml = `<h1>Research Publications</h1>`;

        resumeData.publications.forEach((pub, idx) => {
            rawMd += `## Paper ${idx + 1}: ${pub.title.split(':')[0]}\n`;
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

        codeEditor.value = rawMd;
        previewBody.innerHTML = previewHtml;
        
        // Update live state in terminalFiles and vsCodeFileContents
        if (window.terminalFiles) {
            window.terminalFiles['research_papers.md'] = rawMd;
        }
        
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

