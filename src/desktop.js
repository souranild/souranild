// Red Hat Workstation Desktop & Window Manager with Resizable Windows and Virtual Workspaces

import { parseLaTeXString } from './resumeParser.js';

let topZIndex = 30;
let isDraggingGlobal = false;
let currentWorkspace = 1;

// Define default workspace assignments for each window
const windowWorkspaces = {
    'terminal': 1,
    'libreoffice': 1,
    'pdfviewer': 1,
    'vscode': 1,
    'overleaf': 1,
    'calculator': 2,
    'verisium': 2
};

export function initDesktop() {
    // 1. Setup Windows
    const windows = document.querySelectorAll('.desktop-window');
    windows.forEach(win => {
        setupDrag(win);
        setupResize(win);
        setupWindowControls(win);
        
        // Focus window on click
        win.addEventListener('mousedown', () => {
            focusWindow(win);
        });
    });

    // 2. Desktop icon launchers (Single click to open for responsiveness)
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        const appId = icon.getAttribute('data-open');
        if (appId) {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                icons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                openAppWindow(appId);
            });
            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                openAppWindow(appId);
            });
            icon.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                openAppWindow(appId);
            });
        }
    });

    // Deselect icons when clicking desktop background
    document.querySelector('.desktop-area').addEventListener('mousedown', (e) => {
        if (e.target === e.currentTarget) {
            icons.forEach(i => i.classList.remove('selected'));
        }
    });

    // 3. Top Taskbar Badges Window Toggles
    const taskbarBadges = document.querySelectorAll('.window-tab-badge');
    taskbarBadges.forEach(badge => {
        const appId = badge.getAttribute('data-toggle');
        badge.onclick = (e) => {
            e.stopPropagation();
            const win = document.getElementById(`win-${appId}`);
            if (win) {
                if (win.style.display === 'none' || win.classList.contains('minimized')) {
                    openAppWindow(appId);
                } else if (win.style.zIndex < topZIndex) {
                    focusWindow(win);
                } else {
                    // Minimize if clicking active open window
                    win.style.display = 'none';
                    win.classList.add('minimized');
                    win.dataset.isMinimized = 'true';
                    focusNextWindow();
                }
            }
        };
    });

    // 4. Panel Launcher Shortcuts (Bottom Panel)
    const panelLaunchers = document.querySelectorAll('.launcher-icon');
    panelLaunchers.forEach(launcher => {
        const appId = launcher.getAttribute('data-open');
        if (appId) {
            launcher.addEventListener('click', (e) => {
                e.stopPropagation();
                openAppWindow(appId);
            });
        }
    });

    // 5. RHEL Bottom Panel System Popups
    setupSystemPopups();

    // 6. Workspace Switcher Setup
    setupWorkspaceSwitcher();

    // 7. Background Hover Transparency Setup
    setupHoverTransparency();

    // 8. Calculator app logic setup
    setupCalculator();

    // 9. Overleaf LaTeX app setup
    setupOverleaf();

    // 10. Verisium Hotspots Interactivity
    setupVerisiumHotspots();

    // 11. Default window position layouts and startup stacks
    arrangeDefaultWindows();
}

function focusWindow(win) {
    topZIndex++;
    win.style.zIndex = topZIndex;
    win.classList.remove('minimized');
    win.dataset.isMinimized = 'false';

    // Update active tab highlight in the top panel taskbar
    const winId = win.id.replace('win-', '');
    updateTaskbar(winId);
}

function updateTaskbar(activeId) {
    const badges = document.querySelectorAll('.window-tab-badge');
    badges.forEach(b => {
        if (b.getAttribute('data-toggle') === activeId) {
            b.classList.add('active');
        } else {
            b.classList.remove('active');
        }
    });
}

function focusNextWindow() {
    const windows = Array.from(document.querySelectorAll('.desktop-window'))
        .filter(w => {
            const appId = w.id.replace('win-', '');
            const targetW = windowWorkspaces[appId] || 1;
            return targetW === currentWorkspace && w.dataset.isOpen === 'true' && w.dataset.isMinimized !== 'true';
        });
    
    if (windows.length > 0) {
        // Sort by z-index descending
        windows.sort((a, b) => parseInt(b.style.zIndex || 0) - parseInt(a.style.zIndex || 0));
        focusWindow(windows[0]);
    } else {
        updateTaskbar(null);
    }
}

export function openAppWindow(appId) {
    const win = document.getElementById(`win-${appId}`);
    if (win) {
        const targetWorkspace = windowWorkspaces[appId] || 1;
        
        // If window belongs to another workspace, switch workspace first!
        if (targetWorkspace !== currentWorkspace) {
            switchWorkspace(targetWorkspace);
        }

        win.style.display = 'flex';
        win.dataset.isOpen = 'true';
        win.dataset.isMinimized = 'false';
        focusWindow(win);
        
        // Filter tabs after launching
        updateTaskbarTabs();

        if (appId === 'terminal') {
            const input = document.getElementById('zsh-input');
            if (input) setTimeout(() => input.focus(), 100);
        }
    }
}

function setupDrag(win) {
    const titlebar = win.querySelector('.window-titlebar');
    if (!titlebar) return;

    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    titlebar.addEventListener('mousedown', dragMouseDown);
    titlebar.addEventListener('touchstart', dragTouchStart, { passive: false });

    function dragMouseDown(e) {
        if (win.classList.contains('maximized')) return;
        if (e.target.closest('.window-controls')) return;
        
        e.preventDefault();
        isDraggingGlobal = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
        focusWindow(win);
    }

    function elementDrag(e) {
        e.preventDefault();
        
        posX = mouseX - e.clientX;
        posY = mouseY - e.clientY;
        mouseX = e.clientX;
        mouseY = e.clientY;

        const topVal = win.offsetTop - posY;
        const leftVal = win.offsetLeft - posX;
        
        win.style.top = `${Math.max(30, topVal)}px`; // clamp below top panel
        win.style.left = `${leftVal}px`;
    }

    function closeDragElement() {
        isDraggingGlobal = false;
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }

    function dragTouchStart(e) {
        if (win.classList.contains('maximized')) return;
        if (e.target.closest('.window-controls')) return;
        
        isDraggingGlobal = true;
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;

        document.addEventListener('touchend', closeTouchDrag);
        document.addEventListener('touchmove', elementTouchDrag, { passive: false });
        focusWindow(win);
    }

    function elementTouchDrag(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        posX = mouseX - touch.clientX;
        posY = mouseY - touch.clientY;
        mouseX = touch.clientX;
        mouseY = touch.clientY;

        win.style.top = `${Math.max(30, win.offsetTop - posY)}px`;
        win.style.left = `${win.offsetLeft - posX}px`;
    }

    function closeTouchDrag() {
        isDraggingGlobal = false;
        document.removeEventListener('touchend', closeTouchDrag);
        document.removeEventListener('touchmove', elementTouchDrag);
    }
}

// Window resizing borders setup
function setupResize(win) {
    const handle = document.createElement('div');
    handle.className = 'window-resize-handle';
    win.appendChild(handle);
    
    handle.addEventListener('mousedown', initResize);
    handle.addEventListener('touchstart', initResizeTouch, { passive: false });
    
    function initResize(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const startWidth = win.offsetWidth;
        const startHeight = win.offsetHeight;
        const startX = e.clientX;
        const startY = e.clientY;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        
        function resize(e) {
            const newWidth = Math.max(300, startWidth + (e.clientX - startX));
            const newHeight = Math.max(200, startHeight + (e.clientY - startY));
            win.style.width = `${newWidth}px`;
            win.style.height = `${newHeight}px`;
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }
    
    function initResizeTouch(e) {
        e.stopPropagation();
        const touch = e.touches[0];
        const startWidth = win.offsetWidth;
        const startHeight = win.offsetHeight;
        const startX = touch.clientX;
        const startY = touch.clientY;
        
        document.addEventListener('touchmove', resizeTouch, { passive: false });
        document.addEventListener('touchend', stopResizeTouch);
        
        function resizeTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const newWidth = Math.max(300, startWidth + (touch.clientX - startX));
            const newHeight = Math.max(200, startHeight + (touch.clientY - startY));
            win.style.width = `${newWidth}px`;
            win.style.height = `${newHeight}px`;
        }
        
        function stopResizeTouch() {
            document.removeEventListener('touchmove', resizeTouch);
            document.removeEventListener('touchend', stopResizeTouch);
        }
    }
}

function setupWindowControls(win) {
    const closeBtn = win.querySelector('.win-btn.close');
    const minBtn = win.querySelector('.win-btn.minimize');
    const maxBtn = win.querySelector('.win-btn.maximize');

    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            win.style.display = 'none';
            win.dataset.isOpen = 'false';
            updateTaskbarTabs();
            focusNextWindow();
        };
    }

    if (minBtn) {
        minBtn.onclick = (e) => {
            e.stopPropagation();
            win.classList.add('minimized');
            win.style.display = 'none';
            win.dataset.isMinimized = 'true';
            updateTaskbarTabs();
            focusNextWindow();
        };
    }

    if (maxBtn) {
        maxBtn.onclick = (e) => {
            e.stopPropagation();
            win.classList.toggle('maximized');
        };
    }
}

// Workspace switcher widget action
function setupWorkspaceSwitcher() {
    const switcher = document.getElementById('workspace-switcher');
    if (!switcher) return;

    const buttons = switcher.querySelectorAll('.workspace-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const wId = parseInt(btn.getAttribute('data-workspace'));
            switchWorkspace(wId);
        });
    });
}

function switchWorkspace(wId) {
    currentWorkspace = wId;
    
    // Toggle active status in switcher
    const switcher = document.getElementById('workspace-switcher');
    if (switcher) {
        const buttons = switcher.querySelectorAll('.workspace-btn');
        buttons.forEach(btn => {
            const id = parseInt(btn.getAttribute('data-workspace'));
            if (id === wId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
    }

    // Toggle windows display based on active workspace assignments
    const windows = document.querySelectorAll('.desktop-window');
    windows.forEach(win => {
        const appId = win.id.replace('win-', '');
        const targetW = windowWorkspaces[appId] || 1;
        
        if (targetW === wId && win.dataset.isOpen === 'true' && win.dataset.isMinimized !== 'true') {
            win.style.display = 'flex';
        } else {
            win.style.display = 'none';
        }
    });

    // Refresh taskbar badges for this workspace
    updateTaskbarTabs();

    // Focus the highest active window in this workspace
    focusNextWindow();
}

function updateTaskbarTabs() {
    const badges = document.querySelectorAll('.window-tab-badge');
    badges.forEach(b => {
        const appId = b.getAttribute('data-toggle');
        const targetW = windowWorkspaces[appId] || 1;
        const win = document.getElementById(`win-${appId}`);
        
        if (targetW === currentWorkspace && win && win.dataset.isOpen === 'true') {
            b.style.display = 'flex';
        } else {
            b.style.display = 'none';
        }
    });
}

// Bottom Panel Popups (Applications Menu, System Clock, Volume/Wifi controls)
function setupSystemPopups() {
    const appsTrigger = document.getElementById('applications-menu-trigger');
    const appsPopup = document.getElementById('apps-menu-popup');
    const clockTrigger = document.getElementById('system-time');
    const calendarPopup = document.getElementById('calendar-popup');
    const wifiTrigger = document.getElementById('network-btn-trigger');
    const volumeTrigger = document.getElementById('volume-btn-trigger');
    const settingsPopup = document.getElementById('settings-popup');

    const popups = [appsPopup, calendarPopup, settingsPopup];

    function hideAllPopups() {
        popups.forEach(p => {
            if (p) p.classList.remove('visible');
        });
    }

    // Apps Menu
    if (appsTrigger && appsPopup) {
        appsTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasVisible = appsPopup.classList.contains('visible');
            hideAllPopups();
            if (!wasVisible) appsPopup.classList.add('visible');
        });

        const menuItems = appsPopup.querySelectorAll('.menu-popup-item[data-app]');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const app = item.getAttribute('data-app');
                openAppWindow(app);
                appsPopup.classList.remove('visible');
            });
        });
    }

    // System Clock
    if (clockTrigger && calendarPopup) {
        clockTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const wasVisible = calendarPopup.classList.contains('visible');
            hideAllPopups();
            if (!wasVisible) {
                generateCalendar();
                calendarPopup.classList.add('visible');
            }
        });
    }

    // Wifi & Volume Triggers
    const settingsTriggers = [wifiTrigger, volumeTrigger];
    settingsTriggers.forEach(trigger => {
        if (trigger && settingsPopup) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasVisible = settingsPopup.classList.contains('visible');
                hideAllPopups();
                if (!wasVisible) settingsPopup.classList.add('visible');
            });
        }
    });

    // Volume Slider Sync
    const volSlider = document.getElementById('vol-slider');
    if (volSlider && volumeTrigger) {
        volSlider.addEventListener('input', () => {
            const val = parseInt(volSlider.value);
            if (val === 0) {
                volumeTrigger.textContent = '🔇';
            } else if (val < 40) {
                volumeTrigger.textContent = '🔈';
            } else {
                volumeTrigger.textContent = '🔊';
            }
        });
    }

    // Global Click Outside dismisses popups
    document.addEventListener('click', () => {
        hideAllPopups();
    });

    popups.forEach(p => {
        if (p) {
            p.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent closing when clicking inside
            });
        }
    });
}

// Calendar Month Grid Generator
function generateCalendar() {
    const daysContainer = document.getElementById('calendar-days-container');
    const monthYearHeader = document.getElementById('calendar-month-year');
    if (!daysContainer || !monthYearHeader) return;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearHeader.textContent = `${months[currentMonth]} ${currentYear}`;
    
    daysContainer.innerHTML = '';
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // Day of week (0-6)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Fill leading empty cells
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day-cell empty';
        daysContainer.appendChild(emptyCell);
    }
    
    // Fill month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day-cell';
        dayCell.textContent = d;
        if (d === currentDate) {
            dayCell.classList.add('today');
        }
        daysContainer.appendChild(dayCell);
    }
}

// Desktop Background Hover Transparency Rule
let hoverTimer = null;

function setupHoverTransparency() {
    const desktopArea = document.querySelector('.desktop-area');
    if (!desktopArea) return;

    desktopArea.addEventListener('mouseover', (e) => {
        if (isDraggingGlobal) return;

        const isOverWindow = e.target.closest('.desktop-window');

        if (isOverWindow) {
            // Cancel any pending show-desktop timer
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
            // Restore window opacity immediately
            const windows = document.querySelectorAll('.desktop-window');
            windows.forEach(w => w.classList.remove('desktop-transparent'));
        } else {
            // If they are hovering on the background, start a 2-second timer
            if (!hoverTimer) {
                hoverTimer = setTimeout(() => {
                    const windows = document.querySelectorAll('.desktop-window');
                    windows.forEach(w => w.classList.add('desktop-transparent'));
                }, 2000); // 2 seconds
            }
        }
    });

    desktopArea.addEventListener('mouseleave', () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        const windows = document.querySelectorAll('.desktop-window');
        windows.forEach(w => w.classList.remove('desktop-transparent'));
    });
}

// GNOME Calculator app evaluation logic
let calcExpression = '0';

function setupCalculator() {
    const calcWin = document.getElementById('win-calculator');
    const display = document.getElementById('calc-display');
    if (!calcWin || !display) return;

    const buttons = calcWin.querySelectorAll('.calc-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            let key = btn.textContent;
            if (btn.classList.contains('btn-back')) {
                key = 'Backspace';
            }
            handleCalcInput(key);
        });
    });

    document.addEventListener('keydown', (e) => {
        const isFocused = calcWin.style.zIndex == topZIndex && calcWin.style.display !== 'none' && !calcWin.classList.contains('minimized');
        if (!isFocused) return;

        const validKeys = [
            '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
            '+', '-', '*', '/', '.', '=', 'Enter', 'Backspace', 'Escape', 'c', 'C'
        ];

        if (validKeys.includes(e.key)) {
            e.preventDefault();
            let key = e.key;
            if (key === 'Enter') key = '=';
            if (key === 'Escape' || key === 'c') key = 'C';
            handleCalcInput(key);
        }
    });
}

function handleCalcInput(val) {
    const display = document.getElementById('calc-display');
    if (!display) return;
    
    if (val === 'C') {
        calcExpression = '0';
    } else if (val === 'Backspace' || val === '⌫') {
        if (calcExpression.length > 1) {
            calcExpression = calcExpression.slice(0, -1);
        } else {
            calcExpression = '0';
        }
    } else if (val === '=') {
        try {
            const sanitized = calcExpression.replace(/[^0-9+\-*/.]/g, '');
            if (sanitized === '') {
                calcExpression = '0';
            } else {
                const result = Function(`"use strict"; return (${sanitized})`)();
                calcExpression = Number.isFinite(result) ? String(result) : 'Error';
            }
        } catch (e) {
            calcExpression = 'Error';
        }
    } else {
        if (calcExpression === '0' || calcExpression === 'Error') {
            if (['+', '-', '*', '/'].includes(val)) {
                calcExpression = '0' + val;
            } else {
                calcExpression = val;
            }
        } else {
            calcExpression += val;
        }
    }
    display.value = calcExpression;
}

// Overleaf App Logic
function setupOverleaf() {
    const recompileBtn = document.getElementById('overleaf-recompile');
    const spinner = document.getElementById('overleaf-spinner');
    
    if (recompileBtn) {
        recompileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (spinner) spinner.style.display = 'inline-block';
            recompileBtn.disabled = true;
            
            // Simulate compile delay
            setTimeout(() => {
                if (spinner) spinner.style.display = 'none';
                recompileBtn.disabled = false;
                
                recompileOverleaf();
            }, 800);
        });
    }

    // Load initial content
    initOverleafContent();
}

async function initOverleafContent() {
    let text = '';
    try {
        const response = await fetch('/resume.tex');
        if (response.ok) {
            text = await response.text();
        }
    } catch(err) {
        console.warn("Could not load initial resume.tex");
    }

    const textarea = document.getElementById('overleaf-latex-input');
    if (textarea) {
        if (text && text.trim() !== '') {
            textarea.value = text;
        } else {
            textarea.value = getDefaultLatexTemplate();
        }
    }

    // Initial compile
    recompileOverleaf();
}

function recompileOverleaf() {
    const textarea = document.getElementById('overleaf-latex-input');
    if (!textarea) return;
    
    const latexText = textarea.value;
    
    // Parse the LaTeX string dynamically
    const parsedData = parseLaTeXString(latexText);
    window.resumeData = parsedData;
    
    // 1. Update Overleaf PDF preview layout
    const overleafPreview = document.getElementById('overleaf-pdf-sheet');
    if (overleafPreview) {
        let expHtml = '';
        parsedData.experience.forEach(job => {
            expHtml += `
                <div class="pdf-item" style="margin-bottom: 0.8rem;">
                    <div class="pdf-item-title" style="font-size:0.8rem; font-weight:bold;">${job.role} | ${job.company}</div>
                    <div class="pdf-item-date" style="font-size:0.7rem; color:#555;">${job.location} | ${job.date}</div>
                    <div class="pdf-item-desc" style="font-size:0.73rem; color:#222;">
                        ${job.bullets.map(b => `- ${b}`).join('<br>')}
                    </div>
                </div>
            `;
        });
        
        let edHtml = '';
        parsedData.education.forEach(edu => {
            edHtml += `
                <div class="pdf-item" style="margin-bottom: 0.8rem;">
                    <div class="pdf-item-title" style="font-size:0.8rem; font-weight:bold;">${edu.degree} | ${edu.school}</div>
                    <div class="pdf-item-date" style="font-size:0.7rem; color:#555;">${edu.location} | ${edu.date}</div>
                    <div class="pdf-item-desc" style="font-size:0.73rem; color:#222;">
                        ${edu.bullets.map(b => `- ${b}`).join('<br>')}
                    </div>
                </div>
            `;
        });

        overleafPreview.innerHTML = `
            <div class="pdf-header-name" style="font-size:1.2rem; font-weight:700; text-align:center;">${parsedData.name}</div>
            <div class="pdf-header-sub" style="font-size:0.75rem; text-align:center; color:#555;">${parsedData.contact}</div>
            <hr class="pdf-line" style="margin: 0.4rem 0 0.6rem 0;">
            
            <div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem;">EXPERIENCE</div>
            ${expHtml}
            
            <div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem;">EDUCATION</div>
            ${edHtml}
        `;
    }

    // 2. Propagate updates to all other open apps (PDF viewer, LibreOffice, VS Code, Terminal)
    if (window.updateWindowsWithResume) {
        window.updateWindowsWithResume(parsedData);
    }
}

function getDefaultLatexTemplate() {
    return `% Souranil Das Resume LaTeX Source Code
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}

\\begin{document}

\\centerline{\\Huge \\bf SOURANIL DAS}
\\centerline{Bangalore, India | souranil.das.2024@gmail.com}

\\section{Experience}
\\resumeSubheading{NXP Semiconductors}{Bangalore, India}{Design Verification Engineer}{Jan 2024 - Present}
\\begin{itemize}
    \\item Verify complex System-on-Chips (SoCs) and digital logic IPs.
    \\item Construct functional simulation verification testbenches utilizing SystemVerilog and Universal Verification Methodology (UVM).
    \\item Set up stimulus drivers, functional coverage blocks, and registers validation checkers.
    \\item Drive functional coverage closure, analyzing RTL code and simulation assertions.
\\end{itemize}

\\section{Education}
\\resumeSubheading{VIT Chennai}{Chennai, India}{B.Tech in Electronics \\& Communication}{2020 - 2024}
\\begin{itemize}
    \\item Specializations: VLSI circuit layout design, Computer Architecture, Embedded Networks.
\\end{itemize}

\\section{Projects}
\\resumeProjectHeading{AI-Enabled Hydroponics Cultivation System}{Azure, Databricks}
\\begin{itemize}
    \\item Automated IoT vertical farming design optimized for cultivation of medicinal crop yields.
\\end{itemize}

\\end{document}
`;
}

function setupVerisiumHotspots() {
    const hotspots = document.querySelectorAll('.verisium-hotspot');
    const popup = document.getElementById('verisium-status-popup');

    if (!popup) return;

    hotspots.forEach(hot => {
        hot.addEventListener('click', (e) => {
            e.stopPropagation();
            const title = hot.getAttribute('title');
            popup.innerHTML = `
                <div class="status-card-header">Verisium Debug Telemetry</div>
                <div class="status-card-line">Object: <span class="status-green">${title}</span></div>
                <div class="status-card-line">Status: Log parsing PASS</div>
                <div class="status-card-line">Session Tick: 387,395 ns</div>
            `;
            
            popup.style.borderColor = '#cc0000';
            setTimeout(() => {
                popup.style.borderColor = 'rgba(204, 0, 0, 0.3)';
            }, 300);
        });
    });
}

function arrangeDefaultWindows() {
    const terminal = document.getElementById('win-terminal');
    const lo = document.getElementById('win-libreoffice');
    const pdf = document.getElementById('win-pdfviewer');
    const vscode = document.getElementById('win-vscode');
    const verisium = document.getElementById('win-verisium');
    const calculator = document.getElementById('win-calculator');
    const overleaf = document.getElementById('win-overleaf');

    const w = window.innerWidth;

    if (w > 1200) {
        // Startup Stack Layout
        // Workspace 1 visible items: Overleaf (on top), Terminal, PDF Resume, VS Code.
        // Workspace 2 visible items: Calculator, Verisium Debug.
        // LibreOffice starts closed.

        // 1. Mark states
        if (overleaf) {
            overleaf.dataset.isOpen = 'true';
            overleaf.dataset.isMinimized = 'false';
            overleaf.style.display = 'flex';
            
            overleaf.style.top = '60px';
            overleaf.style.left = '120px';
            overleaf.style.width = '780px';
            overleaf.style.height = '500px';
            overleaf.style.zIndex = '28'; // On top!
        }

        if (terminal) {
            terminal.dataset.isOpen = 'true';
            terminal.dataset.isMinimized = 'false';
            terminal.style.display = 'flex';

            terminal.style.top = '120px';
            terminal.style.left = '80px';
            terminal.style.width = '550px';
            terminal.style.height = '380px';
            terminal.style.zIndex = '27'; // Right below Overleaf
        }

        if (pdf) {
            pdf.dataset.isOpen = 'true';
            pdf.dataset.isMinimized = 'false';
            pdf.style.display = 'flex';

            pdf.style.top = '280px';
            pdf.style.left = '640px';
            pdf.style.width = '520px';
            pdf.style.height = '440px';
            pdf.style.zIndex = '25';
        }

        if (vscode) {
            vscode.dataset.isOpen = 'true';
            vscode.dataset.isMinimized = 'false';
            vscode.style.display = 'flex';

            vscode.style.top = '90px';
            vscode.style.left = '520px';
            vscode.style.width = '680px';
            vscode.style.height = '430px';
            vscode.style.zIndex = '26';
        }

        if (lo) {
            lo.dataset.isOpen = 'false';
            lo.dataset.isMinimized = 'false';
            lo.style.display = 'none';

            lo.style.top = '360px';
            lo.style.left = '160px';
            lo.style.width = '620px';
            lo.style.height = '380px';
            lo.style.zIndex = '10';
        }

        // Workspace 2 Items (will display none since currentWorkspace = 1)
        if (calculator) {
            calculator.dataset.isOpen = 'true';
            calculator.dataset.isMinimized = 'false';
            calculator.style.display = 'none'; // hidden because in Workspace 2

            calculator.style.top = '180px';
            calculator.style.left = '480px';
            calculator.style.width = '280px';
            calculator.style.height = '350px';
            calculator.style.zIndex = '13';
        }

        if (verisium) {
            verisium.dataset.isOpen = 'true';
            verisium.dataset.isMinimized = 'false';
            verisium.style.display = 'none'; // hidden because in Workspace 2

            verisium.style.top = '50px';
            verisium.style.left = '50px';
            verisium.style.width = '1080px';
            verisium.style.height = '600px';
            verisium.style.zIndex = '2'; // At the bottom of the stack!
        }
    } else {
        const wins = [overleaf, terminal, vscode, pdf, lo, calculator, verisium];
        wins.forEach((win, index) => {
            if (win) {
                win.dataset.isOpen = (win === lo) ? 'false' : 'true';
                win.dataset.isMinimized = 'false';
                
                // Show if in current workspace and open
                const appId = win.id.replace('win-', '');
                const targetW = windowWorkspaces[appId] || 1;
                
                if (targetW === currentWorkspace && win.dataset.isOpen === 'true') {
                    win.style.display = 'flex';
                } else {
                    win.style.display = 'none';
                }

                win.style.top = `${60 + index * 20}px`;
                win.style.left = `${40 + index * 12}px`;
                win.style.width = '85%';
                win.style.height = '65%';
            }
        });
    }

    // Toggle tabs correctly on boot
    updateTaskbarTabs();

    // Default focus to Overleaf (since it is on top)
    if (overleaf) focusWindow(overleaf);
}
