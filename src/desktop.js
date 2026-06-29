// Red Hat Workstation Desktop & Window Manager with Resizable Windows and Virtual Workspaces

import { parseLaTeXString } from './resumeParser.js';
import { gsap } from 'gsap';

let topZIndex = 30;
let isDraggingGlobal = false;
let currentWorkspace = 1;
let topWidgetZIndex = 5;

// Define default workspace assignments for each window
const windowWorkspaces = {
    'terminal': 1,
    'libreoffice': 1,
    'pdfviewer': 1,
    'vscode': 1,
    'overleaf': 1,
    'calculator': 2,
    'verisium': 2,
    'games-folder': 4,
    'emulator': 4,
    'sysapps-folder': 1,
    'sysmonitor': 2,
    'clock': 2,
    'weather': 2,
    'imageviewer': 1,
    'firefox': 1
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
            // If this is the terminal, always focus its input field
            if (win.id === 'win-terminal') {
                const termInput = document.getElementById('zsh-input');
                if (termInput) setTimeout(() => termInput.focus(), 0);
            }
        });
    });

    // 2. Desktop icon launchers (Single click to open for responsiveness)
    const icons = document.querySelectorAll('.desktop-icon');
    icons.forEach(icon => {
        const appId = icon.getAttribute('data-open');
        const fileOpen = icon.getAttribute('data-file-open');
        const fileAction = icon.getAttribute('data-file-action');
        
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
        } else if (fileOpen) {
            // Desktop file icons that open an associated app
            const handler = (e) => {
                e.stopPropagation();
                icons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                if (fileOpen === 'photowidget') {
                    const pw = document.getElementById('photo-widget');
                    if (pw) {
                        pw.style.display = (pw.style.display === 'none') ? 'block' : 'none';
                    }
                } else {
                    openAppWindow(fileOpen);
                }
            };
            icon.addEventListener('click', handler);
            icon.addEventListener('dblclick', handler);
            icon.addEventListener('touchend', (e) => { e.preventDefault(); handler(e); });
        } else if (fileAction === 'run-aboutme') {
            // about_me.sh: opens terminal and runs the about_me display
            const handler = (e) => {
                e.stopPropagation();
                icons.forEach(i => i.classList.remove('selected'));
                icon.classList.add('selected');
                openAppWindow('terminal');
                // Run about_me display in terminal
                import('./zsh.js').then(module => {
                    module.runZshCommand('cat about_me.txt');
                });
            };
            icon.addEventListener('click', handler);
            icon.addEventListener('dblclick', handler);
            icon.addEventListener('touchend', (e) => { e.preventDefault(); handler(e); });
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
                    minimizeWindow(win);
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

    // 11. Games Folder & GBA Emulator setup
    setupGamesApp();

    // 12. PDF Viewer Setup
    setupPDFViewer();

    // 13. System Clock Setup
    setupClock();

    // 14. Desktop Icon Drag
    setupIconDrag();

    // 15. System Apps Folder setup
    setupSysAppsFolder();

    // 16. VS Code tab switching
    setupVSCodeTabs();

    // 17. System Monitor, World Clock, and Weather Widgets
    initSystemWidget();
    initClockWidget();
    initWeatherWidget();
    initPhotoWidget();
    
    // 18. Text Editor & LibreOffice usability setups
    setupTextEditor();
    setupLibreOffice();
    
    // 19. New desktop helper apps setup
    setupClockApp();
    setupWeatherApp();
    setupImageViewerApp();
    setupFirefox();
    
    // Initialize random wallpaper rotation
    initWallpaperRotator();
    
    // Final default window arrangement
    arrangeDefaultWindows();
    
    // Initialize desktop wallpaper blur
    initDesktopWallpaperBlur();
}

function focusWindow(win) {
    topZIndex++;
    win.style.zIndex = topZIndex;
    win.classList.remove('minimized');
    win.dataset.isMinimized = 'false';

    // Update active tab highlight in the top panel taskbar
    const winId = win.id.replace('win-', '');
    updateTaskbar(winId);

    // Automatically focus GBA emulator keyboard input on focus
    if (win.id === 'win-emulator') {
        const iframe = document.getElementById('emulator-iframe');
        if (iframe) {
            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.focus();
            }, 100);
        }
    }

    saveSessionState();
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
        // Reset hover transparency state
        if (typeof window.resetHoverTransparencyState === 'function') {
            window.resetHoverTransparencyState();
        }

        // Associate the window to the current active workspace
        windowWorkspaces[appId] = currentWorkspace;

        // If already open and focused in the active workspace, just focus it
        if (win.style.display === 'flex' && win.style.zIndex == topZIndex && win.dataset.isMinimized !== 'true') {
            return;
        }

        win.style.display = 'flex';
        win.classList.remove('minimized');
        win.dataset.isOpen = 'true';
        win.dataset.isMinimized = 'false';
        focusWindow(win);
        
        updateTaskbarTabs();
        saveSessionState();
        updateWallpaperBlur();

        // Animate expand from launcher/badge
        const launcher = document.querySelector(`.launcher-icon[data-open="${appId}"]`) || 
                         document.querySelector(`.window-tab-badge[data-toggle="${appId}"]`);
                         
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight;
        
        if (launcher) {
            const rect = launcher.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        }
        
        const winRect = win.getBoundingClientRect();
        const winCenterX = winRect.left + winRect.width / 2;
        const winCenterY = winRect.top + winRect.height / 2;
        
        const deltaX = startX - winCenterX;
        const deltaY = startY - winCenterY;
        
        win.dataset.isAnimating = 'true';
        
        gsap.set(win, {
            x: deltaX,
            y: deltaY,
            scale: 0.05,
            opacity: 0,
            transformOrigin: "center center"
        });
        
        gsap.to(win, {
            duration: 0.45,
            x: 0,
            y: 0,
            scale: 1,
            opacity: 1,
            ease: "power2.out",
            onComplete: () => {
                win.dataset.isAnimating = 'false';
                if (appId === 'terminal') {
                    const input = document.getElementById('zsh-input');
                    if (input) setTimeout(() => input.focus(), 100);
                }
            }
        });
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
        saveSessionState();
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
        saveSessionState();
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
            saveSessionState();
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
            saveSessionState();
        }
    }
}

export function updateWindowMaximizeState(win) {
    const isMax = win.classList.contains('maximized');
    const maxBtn = win.querySelector('.win-btn.maximize');
    if (maxBtn) {
        maxBtn.textContent = isMax ? '❐' : '▢';
        maxBtn.title = isMax ? 'Restore' : 'Maximize';
    }
}

function setupWindowControls(win) {
    const closeBtn = win.querySelector('.win-btn.close');
    const minBtn = win.querySelector('.win-btn.minimize');
    const maxBtn = win.querySelector('.win-btn.maximize');

    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            
            // Clear GBA emulator iframe after a delay to allow saves to flush
            if (win.id === 'win-emulator') {
                const iframe = document.getElementById('emulator-iframe');
                if (iframe) {
                    setTimeout(() => {
                        if (win.dataset.isOpen !== 'true') {
                            iframe.src = '';
                        }
                    }, 1500);
                }
            }

            win.dataset.isAnimating = 'true';
            gsap.to(win, {
                duration: 0.25,
                opacity: 0,
                scale: 0.9,
                ease: "power2.in",
                onComplete: () => {
                    win.style.display = 'none';
                    win.dataset.isOpen = 'false';
                    win.dataset.isAnimating = 'false';
                    gsap.set(win, { scale: 1, opacity: 1 });
                    updateTaskbarTabs();
                    focusNextWindow();
                    saveSessionState();
                    updateWallpaperBlur();
                }
            });
        };
    }

    if (minBtn) {
        minBtn.onclick = (e) => {
            e.stopPropagation();
            minimizeWindow(win);
        };
    }

    if (maxBtn) {
        maxBtn.onclick = (e) => {
            e.stopPropagation();
            win.classList.toggle('maximized');
            updateWindowMaximizeState(win);
            saveSessionState();
        };
    }

    const titleBar = win.querySelector('.window-titlebar');
    if (titleBar) {
        titleBar.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            win.classList.toggle('maximized');
            updateWindowMaximizeState(win);
            saveSessionState();
        });
    }
}

// macOS-style minimizing animation using GSAP
function minimizeWindow(win) {
    if (win.dataset.isAnimating === 'true') return;
    
    const appId = win.id.replace('win-', '');
    const launcher = document.querySelector(`.launcher-icon[data-open="${appId}"]`) || 
                     document.querySelector(`.window-tab-badge[data-toggle="${appId}"]`);
    
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight;
    
    if (launcher) {
        const rect = launcher.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
    }
    
    const winRect = win.getBoundingClientRect();
    const winCenterX = winRect.left + winRect.width / 2;
    const winCenterY = winRect.top + winRect.height / 2;
    
    const deltaX = targetX - winCenterX;
    const deltaY = targetY - winCenterY;
    
    win.dataset.isAnimating = 'true';
    
    gsap.to(win, {
        duration: 0.45,
        x: deltaX,
        y: deltaY,
        scale: 0.05,
        opacity: 0,
        transformOrigin: "center center",
        ease: "power2.inOut",
        onComplete: () => {
            win.style.display = 'none';
            win.classList.add('minimized');
            win.dataset.isMinimized = 'true';
            win.dataset.isOpen = 'true';
            win.dataset.isAnimating = 'false';
            // Reset scale/position values for normal state layout
            gsap.set(win, { x: 0, y: 0, scale: 1, opacity: 1 });
            updateTaskbarTabs();
            focusNextWindow();
            saveSessionState();
            updateWallpaperBlur();
        }
    });
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
    if (typeof window.resetHoverTransparencyState === 'function') {
        window.resetHoverTransparencyState();
    }
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

    const windows = document.querySelectorAll('.desktop-window');
    const terminal = document.getElementById('win-terminal');
    
    // Check if switching to Workspace 3
    if (wId === 3) {
        // Move terminal to Workspace 3 and maximize it
        if (terminal) {
            windowWorkspaces['terminal'] = 3;
            terminal.classList.add('maximized');
            updateWindowMaximizeState(terminal);
            terminal.dataset.isOpen = 'true';
            terminal.dataset.isMinimized = 'false';
            
            // Execute neofetch in terminal
            import('./zsh.js').then(module => {
                module.runZshCommand('clear');
                module.runZshCommand('neofetch');
            });
        }
    } else {
        // If switching away from Workspace 3, restore terminal workspace to 1
        if (terminal && windowWorkspaces['terminal'] === 3) {
            windowWorkspaces['terminal'] = 1;
            terminal.classList.remove('maximized');
            updateWindowMaximizeState(terminal);
        }
    }

    // Check if switching to Workspace 4
    const overleaf = document.getElementById('win-overleaf');
    if (wId === 4) {
        // Move overleaf to Workspace 4 and load controls guide
        if (overleaf) {
            windowWorkspaces['overleaf'] = 4;
            overleaf.dataset.isOpen = 'true';
            overleaf.dataset.isMinimized = 'false';
            
            // Position beside the games folder
            overleaf.style.top = '60px';
            overleaf.style.left = '640px';
            overleaf.style.width = '760px';
            overleaf.style.height = '520px';
            overleaf.style.zIndex = '15';
            
            // Load controls.tex into the editor
            openTexInOverleaf('/controls.tex');
        }
    } else {
        // If switching away from Workspace 4, restore overleaf to workspace 1
        if (overleaf && windowWorkspaces['overleaf'] === 4) {
            windowWorkspaces['overleaf'] = 1;
            // Reload the resume.tex back silently without opening the window
            openTexInOverleaf('/resume.tex', true);
        }
    }

    // Toggle windows display based on active workspace assignments
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
    saveSessionState();
    updateWallpaperBlur();
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

            // Sync volume to Emulator iframe
            const iframe = document.getElementById('emulator-iframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ type: 'setVolume', value: val }, '*');
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
let hasHoveredWindow = false;

window.resetHoverTransparencyState = function() {
    hasHoveredWindow = false;
    if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }
    const windows = document.querySelectorAll('.desktop-window');
    windows.forEach(w => w.classList.remove('desktop-transparent'));
};

function setupHoverTransparency() {
    const desktopArea = document.querySelector('.desktop-area');
    if (!desktopArea) return;

    desktopArea.addEventListener('mouseover', (e) => {
        if (isDraggingGlobal) return;

        const isOverWindow = e.target.closest('.desktop-window');

        if (isOverWindow) {
            hasHoveredWindow = true;
            // Cancel any pending show-desktop timer
            if (hoverTimer) {
                clearTimeout(hoverTimer);
                hoverTimer = null;
            }
            // Restore window opacity immediately
            const windows = document.querySelectorAll('.desktop-window');
            windows.forEach(w => w.classList.remove('desktop-transparent'));
        } else {
            // If they are hovering on the background, only start the timer if they previously hovered a window
            if (hasHoveredWindow) {
                if (!hoverTimer) {
                    hoverTimer = setTimeout(() => {
                        const windows = document.querySelectorAll('.desktop-window');
                        windows.forEach(w => w.classList.add('desktop-transparent'));
                    }, 1000); // 1 second
                }
            }
        }
    });

    desktopArea.addEventListener('mouseleave', () => {
        if (hoverTimer) {
            clearTimeout(hoverTimer);
            hoverTimer = null;
        }
        hasHoveredWindow = false;
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
        // Never steal keypresses from a focused input / textarea (e.g. the terminal)
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

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
            if (key === 'Escape' || key === 'c' || key === 'C') key = 'C';
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
    const latexInput = document.getElementById('overleaf-latex-input');
    
    if (latexInput) {
        latexInput.addEventListener('input', () => {
            const currentText = latexInput.value;
            if (vsCodeFileContents['resume.tex']) {
                vsCodeFileContents['resume.tex'].currentContent = currentText;
            }
            if (window.terminalFiles) {
                window.terminalFiles['resume.tex'] = currentText;
            }
            // Sync with VS Code editor textarea if resume.tex is active
            if (vsCodeActiveFile === 'resume.tex') {
                const vsCodeTextarea = document.getElementById('vscode-textarea');
                if (vsCodeTextarea && vsCodeTextarea.value !== currentText) {
                    vsCodeTextarea.value = currentText;
                }
            }
        });
    }

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

    // Set up workspace panel resizer
    const resizer = document.getElementById('overleaf-resizer');
    const editorPanel = document.querySelector('.overleaf-editor-panel');
    const previewPanel = document.querySelector('.overleaf-preview-panel');
    const workspace = document.querySelector('.overleaf-workspace');

    if (resizer && editorPanel && previewPanel && workspace) {
        resizer.addEventListener('mousedown', initDrag);
        resizer.addEventListener('touchstart', initDragTouch, { passive: false });

        function initDrag(e) {
            e.preventDefault();
            e.stopPropagation();
            resizer.classList.add('resizing');
            
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', stopDrag);
        }

        function drag(e) {
            const workspaceRect = workspace.getBoundingClientRect();
            let newEditorWidth = e.clientX - workspaceRect.left;
            
            const minWidth = workspaceRect.width * 0.15;
            const maxWidth = workspaceRect.width * 0.85;
            
            if (newEditorWidth < minWidth) newEditorWidth = minWidth;
            if (newEditorWidth > maxWidth) newEditorWidth = maxWidth;
            
            const editorPercent = (newEditorWidth / workspaceRect.width) * 100;
            editorPanel.style.width = `${editorPercent}%`;
            previewPanel.style.width = `${100 - editorPercent}%`;
        }

        function stopDrag() {
            resizer.classList.remove('resizing');
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('mouseup', stopDrag);
        }

        function initDragTouch(e) {
            e.stopPropagation();
            resizer.classList.add('resizing');
            document.addEventListener('touchmove', dragTouch, { passive: false });
            document.addEventListener('touchend', stopDragTouch);
        }

        function dragTouch(e) {
            e.preventDefault();
            const touch = e.touches[0];
            const workspaceRect = workspace.getBoundingClientRect();
            let newEditorWidth = touch.clientX - workspaceRect.left;
            
            const minWidth = workspaceRect.width * 0.15;
            const maxWidth = workspaceRect.width * 0.85;
            
            if (newEditorWidth < minWidth) newEditorWidth = minWidth;
            if (newEditorWidth > maxWidth) newEditorWidth = maxWidth;
            
            const editorPercent = (newEditorWidth / workspaceRect.width) * 100;
            editorPanel.style.width = `${editorPercent}%`;
            previewPanel.style.width = `${100 - editorPercent}%`;
        }

        function stopDragTouch() {
            resizer.classList.remove('resizing');
            document.removeEventListener('touchmove', dragTouch);
            document.removeEventListener('touchend', stopDragTouch);
        }
    }

    // Load initial content
    initOverleafContent();
}

async function initOverleafContent() {
    let text = '';
    try {
        const response = await fetch('./resume.tex');
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
    
    // Check if this is a resume document or a generic LaTeX document
    const isResume = latexText.includes('\\resumeSubheading') || 
                     latexText.includes('\\section{Experience}') || 
                     latexText.includes('\\section{Education}');
    
    const sheet1 = document.getElementById('overleaf-pdf-sheet-1');
    const sheet2 = document.getElementById('overleaf-pdf-sheet-2');
    
    if (!sheet1 || !sheet2) return;
    
    if (!isResume) {
        // Render as a generic formatted document split across two sheets
        renderGenericLatex(latexText, sheet1, sheet2);
        return;
    }
    
    // Parse the LaTeX string dynamically as a resume
    const parsedData = parseLaTeXString(latexText);
    window.resumeData = parsedData;
    
    // Split experience items: first 2 on Page 1, rest on Page 2
    const exp1 = parsedData.experience.slice(0, 2);
    const exp2 = parsedData.experience.slice(2);
    
    let expHtml1 = '';
    exp1.forEach(job => {
        expHtml1 += `
            <div class="pdf-item" style="margin-bottom: 0.8rem;">
                <div class="pdf-item-title" style="font-size:0.8rem; font-weight:bold;">${job.role} | ${job.company}</div>
                <div class="pdf-item-date" style="font-size:0.7rem; color:#555;">${job.location} | ${job.date}</div>
                <div class="pdf-item-desc" style="font-size:0.73rem; color:#222; margin-top:0.2rem; line-height:1.4;">
                    ${job.bullets.map(b => `- ${b}`).join('<br>')}
                </div>
            </div>
        `;
    });
    
    let expHtml2 = '';
    if (exp2.length > 0) {
        expHtml2 += `<div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem; margin-bottom:0.5rem;">EXPERIENCE (Continued)</div>`;
        exp2.forEach(job => {
            expHtml2 += `
                <div class="pdf-item" style="margin-bottom: 0.8rem;">
                    <div class="pdf-item-title" style="font-size:0.8rem; font-weight:bold;">${job.role} | ${job.company}</div>
                    <div class="pdf-item-date" style="font-size:0.7rem; color:#555;">${job.location} | ${job.date}</div>
                    <div class="pdf-item-desc" style="font-size:0.73rem; color:#222; margin-top:0.2rem; line-height:1.4;">
                        ${job.bullets.map(b => `- ${b}`).join('<br>')}
                    </div>
                </div>
            `;
        });
    }
    
    let edHtml = '';
    parsedData.education.forEach(edu => {
        edHtml += `
            <div class="pdf-item" style="margin-bottom: 0.8rem;">
                <div class="pdf-item-title" style="font-size:0.8rem; font-weight:bold;">${edu.degree} | ${edu.school}</div>
                <div class="pdf-item-date" style="font-size:0.7rem; color:#555;">${edu.location} | ${edu.date}</div>
                <div class="pdf-item-desc" style="font-size:0.73rem; color:#222; margin-top:0.2rem; line-height:1.4;">
                    ${edu.bullets.map(b => `- ${b}`).join('<br>')}
                </div>
            </div>
        `;
    });
    
    // Page 1 Render
    sheet1.innerHTML = `
        <div class="pdf-header-name" style="font-size:1.2rem; font-weight:700; text-align:center;">${parsedData.name}</div>
        <div class="pdf-header-sub" style="font-size:0.75rem; text-align:center; color:#555;">${parsedData.contact}</div>
        <hr class="pdf-line" style="margin: 0.4rem 0 0.6rem 0;">
        
        <div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem; margin-bottom:0.5rem;">EXPERIENCE</div>
        ${expHtml1}
    `;
    
    // Page 2 Render
    sheet2.innerHTML = `
        ${expHtml2}
        <div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem; margin-bottom:0.5rem;">EDUCATION</div>
        ${edHtml}
    `;
    
    // 2. Propagate updates to all other open apps (PDF viewer, LibreOffice, VS Code, Terminal)
    if (window.updateWindowsWithResume) {
        window.updateWindowsWithResume(parsedData);
    }
}

function renderGenericLatex(latexText, sheet1, sheet2) {
    // Extract title from \centerline{\Huge \bf ...} or \title{...}
    let title = '';
    const titleMatch = latexText.match(/\\centerline\s*\{\s*\\Huge\s*\\bf\s+([^}]+)\}/);
    if (titleMatch) title = titleMatch[1].trim();
    const titleMatch2 = latexText.match(/\\title\s*\{([^}]+)\}/);
    if (!title && titleMatch2) title = titleMatch2[1].trim();
    
    // Extract subtitle from second \centerline
    let subtitle = '';
    const centerlines = latexText.match(/\\centerline\s*\{([^}]+)\}/g);
    if (centerlines && centerlines.length > 1) {
        const subMatch = centerlines[1].match(/\\centerline\s*\{(.+)\}/);
        if (subMatch) subtitle = subMatch[1].replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').trim();
    }
    
    // Extract sections
    const sections = [];
    const sectionRegex = /\\section\s*\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;
    let match;
    while ((match = sectionRegex.exec(latexText)) !== null) {
        const sectionTitle = match[1].trim();
        const sectionBody = match[2].trim();
        
        // Parse items from itemize environments
        const items = [];
        const itemRegex = /\\item\s+([\s\S]*?)(?=\\item|\\end\{itemize\}|\\end\{enumerate\}|$)/g;
        let itemMatch;
        while ((itemMatch = itemRegex.exec(sectionBody)) !== null) {
            let itemText = itemMatch[1].trim()
                .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
                .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
                .replace(/\\texttt\{([^}]+)\}/g, '<code style="background:#f1f5f9; padding:1px 4px; border-radius:2px; font-size:0.8em;">$1</code>')
                .replace(/\\\\/g, '')
                .replace(/\n/g, ' ')
                .trim();
            if (itemText) items.push(itemText);
        }
        
        // Plain text outside itemize
        let plainText = sectionBody
            .replace(/\\begin\{itemize\}[\s\S]*?\\end\{itemize\}/g, '')
            .replace(/\\begin\{enumerate\}[\s\S]*?\\end\{enumerate\}/g, '')
            .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
            .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
            .replace(/\\texttt\{([^}]+)\}/g, '<code style="background:#f1f5f9; padding:1px 4px; border-radius:2px; font-size:0.8em;">$1</code>')
            .replace(/\\\\/g, '')
            .replace(/\n\s*\n/g, '</p><p style="margin:0.4rem 0; font-size:0.78rem; color:#222; line-height:1.5;">')
            .trim();
        
        sections.push({ title: sectionTitle, items, plainText });
    }
    
    // Split sections across pages
    const mid = Math.ceil(sections.length / 2);
    const secs1 = sections.slice(0, mid);
    const secs2 = sections.slice(mid);
    
    // Build the HTML for Page 1
    let html1 = '';
    if (title) {
        html1 += `<div style="font-size:1.2rem; font-weight:800; text-align:center; margin-bottom:0.3rem; color:#111;">${title}</div>`;
    }
    if (subtitle) {
        html1 += `<div style="font-size:0.75rem; text-align:center; color:#555; margin-bottom:0.8rem;">${subtitle}</div>`;
    }
    if (title || subtitle) {
        html1 += `<hr class="pdf-line" style="margin: 0.4rem 0 0.6rem 0;">`;
    }
    
    secs1.forEach(sec => {
        html1 += `<div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem; margin-bottom:0.5rem; text-transform:uppercase;">${sec.title}</div>`;
        if (sec.plainText) {
            html1 += `<p style="margin:0.3rem 0 0.5rem 0; font-size:0.75rem; color:#222; line-height:1.45;">${sec.plainText}</p>`;
        }
        if (sec.items.length > 0) {
            html1 += '<ul style="margin:0.3rem 0 0.5rem 1.2rem; padding:0; list-style:disc;">';
            sec.items.forEach(item => {
                html1 += `<li style="font-size:0.73rem; color:#222; margin-bottom:0.25rem; line-height:1.4;">${item}</li>`;
            });
            html1 += '</ul>';
        }
    });
    sheet1.innerHTML = html1 || '<p style="color:#888; font-style:italic; text-align:center; margin-top:2rem;">Document preview</p>';

    // Build HTML for Page 2
    let html2 = '';
    secs2.forEach(sec => {
        html2 += `<div class="pdf-section" style="font-size:0.85rem; font-weight:bold; color:var(--rhel-red); margin-top:0.6rem; margin-bottom:0.5rem; text-transform:uppercase;">${sec.title}</div>`;
        if (sec.plainText) {
            html2 += `<p style="margin:0.3rem 0 0.5rem 0; font-size:0.75rem; color:#222; line-height:1.45;">${sec.plainText}</p>`;
        }
        if (sec.items.length > 0) {
            html2 += '<ul style="margin:0.3rem 0 0.5rem 1.2rem; padding:0; list-style:disc;">';
            sec.items.forEach(item => {
                html2 += `<li style="font-size:0.73rem; color:#222; margin-bottom:0.25rem; line-height:1.4;">${item}</li>`;
            });
            html2 += '</ul>';
        }
    });
    sheet2.innerHTML = html2;
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
\\centerline{Bangalore, India | souranil.das@gmail.com}

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

// PDF Viewer App Setup
function setupPDFViewer() {
    const zoomInBtn = document.getElementById('pdf-zoom-in');
    const zoomOutBtn = document.getElementById('pdf-zoom-out');
    let currentZoom = 1;

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentZoom < 3) {
                currentZoom += 0.25;
                applyZoom();
            }
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentZoom > 0.5) {
                currentZoom -= 0.25;
                applyZoom();
            }
        });
    }

    function applyZoom() {
        const sheets = document.querySelectorAll('.pdf-sheet');
        sheets.forEach(sheet => {
            sheet.style.transform = `scale(${currentZoom})`;
            sheet.style.transformOrigin = 'top center';
        });
    }

    // PDF page navigation & scroll detection
    const thumbnails = document.querySelectorAll('.pdf-thumbnail');
    const viewerPane = document.querySelector('.pdf-viewer-pane');
    const pageIndicator = document.querySelector('.pdf-page-indicator');

    if (thumbnails.length > 0 && viewerPane) {
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                const pageNum = thumb.getAttribute('data-page');
                const targetSheet = document.getElementById(`pdf-sheet-${pageNum}`);
                if (targetSheet) {
                    targetSheet.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    
                    thumbnails.forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                    if (pageIndicator) pageIndicator.textContent = `${pageNum} / 2`;
                }
            });
        });

        viewerPane.addEventListener('scroll', () => {
            const paneScrollTop = viewerPane.scrollTop;
            const paneHeight = viewerPane.clientHeight;
            
            let activePage = 1;
            const sheet2 = document.getElementById('pdf-sheet-2');
            if (sheet2 && sheet2.offsetTop - viewerPane.offsetTop <= paneScrollTop + paneHeight / 2) {
                activePage = 2;
            }
            
            thumbnails.forEach(thumb => {
                const pageNum = thumb.getAttribute('data-page');
                if (parseInt(pageNum) === activePage) {
                    thumb.classList.add('active');
                } else {
                    thumb.classList.remove('active');
                }
            });
            if (pageIndicator) pageIndicator.textContent = `${activePage} / 2`;
        });
    }
}

// Dynamic System Clock
function setupClock() {
    const clockEl = document.getElementById('system-time');
    if (!clockEl) return;

    function updateTime() {
        const now = new Date();
        const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: false };
        clockEl.textContent = now.toLocaleString('en-US', options).replace(',', '');
    }

    updateTime();
    setInterval(updateTime, 60000);
}

// Draggable Desktop Icons
function setupIconDrag() {
    const icons = document.querySelectorAll('.desktop-icon');
    const desktopArea = document.querySelector('.desktop-area');
    
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    icons.forEach(icon => {
        icon.setAttribute('draggable', 'true');
        
        icon.addEventListener('dragstart', (e) => {
            const rect = icon.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            icon.classList.add('dragging');
            // Allow storing dragged item info
            e.dataTransfer.effectAllowed = 'move';
        });

        icon.addEventListener('dragend', () => {
            icon.classList.remove('dragging');
        });
    });

    desktopArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    desktopArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const draggingIcon = document.querySelector('.desktop-icon.dragging');
        if (draggingIcon) {
            // Append to desktop area if not already (breaks it out of grid layout)
            if (draggingIcon.parentElement !== desktopArea) {
                desktopArea.appendChild(draggingIcon);
            }
            
            const desktopRect = desktopArea.getBoundingClientRect();
            
            // Calculate absolute position relative to desktop area
            let newX = e.clientX - desktopRect.left - dragOffsetX;
            let newY = e.clientY - desktopRect.top - dragOffsetY;
            
            // Constrain to desktop bounds
            newX = Math.max(0, Math.min(newX, desktopRect.width - draggingIcon.offsetWidth));
            newY = Math.max(0, Math.min(newY, desktopRect.height - draggingIcon.offsetHeight));
            
            draggingIcon.style.position = 'absolute';
            draggingIcon.style.left = `${newX}px`;
            draggingIcon.style.top = `${newY}px`;
            draggingIcon.style.margin = '0';
        }
    });
}

function setupGamesApp() {
    const iframe = document.getElementById('emulator-iframe');
    
    // Bind all game launch items in Games Folder Nautilus grid
    const gameItems = document.querySelectorAll('.game-launch-item');
    gameItems.forEach(item => {
        const game = item.getAttribute('data-game');
        const core = item.getAttribute('data-core');
        const title = item.getAttribute('data-title');
        
        const launchAction = (e) => {
            e.stopPropagation();
            const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) || '';
            const targetUrl = `${basePath}/emulator.html?game=${encodeURIComponent(game)}&core=${encodeURIComponent(core)}`;
            if (iframe && iframe.getAttribute('src') !== targetUrl) {
                iframe.src = targetUrl;
            }
            
            // Set window title to current game dynamically based on the system core
            const emulatorWinTitle = document.querySelector('#win-emulator .window-title');
            if (emulatorWinTitle) {
                const consoleNames = {
                    'gba': 'Game Boy Advance',
                    'snes': 'Super Nintendo',
                    'nes': 'NES',
                    'gb': 'Game Boy',
                    'nds': 'Nintendo DS'
                };
                const consoleName = consoleNames[core] || 'Retro Console';
                emulatorWinTitle.textContent = `${consoleName} - ${title}`;
            }

            openAppWindow('emulator');
        };
        
        item.addEventListener('click', launchAction);
        item.addEventListener('dblclick', launchAction);
    });

    // Bind controls.tex guide document launch to open inside Overleaf
    const controlsBtn = document.getElementById('launch-controls-tex');
    if (controlsBtn) {
        const launchControls = (e) => {
            e.stopPropagation();
            openTexInOverleaf('/controls.tex');
        };
        controlsBtn.addEventListener('click', launchControls);
        controlsBtn.addEventListener('dblclick', launchControls);
    }
}

function setupFirefox() {
    const firefoxWindow = document.getElementById('win-firefox');
    if (!firefoxWindow) return;

    const iframe = document.getElementById('firefox-iframe');
    const addressInput = document.getElementById('firefox-address-input');
    const blockedOverlay = document.getElementById('firefox-iframe-blocked');
    const blockedLink = document.getElementById('firefox-blocked-link');

    // Resolve blog.html path — works on both Vite dev server and GitHub Pages
    let resolvedBlogPath = null;
    (async function probeBlogPath() {
        const candidates = ['./blog.html', './public/blog.html'];
        for (const path of candidates) {
            try {
                const res = await fetch(path, { method: 'HEAD' });
                if (res.ok) { resolvedBlogPath = path; return; }
            } catch (e) {}
        }
        resolvedBlogPath = './blog.html'; // fallback
    })();

    // Simulated site mockup renderer
    function renderSimulatedSite(domain, fullUrl) {
        const mockups = {
            'google.com': {
                bg: '#202124', fg: '#e8eaed', accent: '#8ab4f8',
                logo: `<div style="font-size: 3.5rem; font-weight: 700; margin-bottom: 1.5rem; font-family: 'Product Sans', Arial, sans-serif; letter-spacing: -1px;">
                    <span style="color:#4285f4">G</span><span style="color:#ea4335">o</span><span style="color:#fbbc05">o</span><span style="color:#4285f4">g</span><span style="color:#34a853">l</span><span style="color:#ea4335">e</span>
                </div>`,
                content: `<div style="width: 85%; max-width: 560px; display: flex; align-items: center; background: #303134; border-radius: 24px; padding: 12px 18px; margin-bottom: 2rem; border: 1px solid #5f6368;">
                    <span style="color: #9aa0a6; margin-right: 12px; font-size: 1.1rem;">🔍</span>
                    <span style="color: #bdc1c6; font-size: 0.95rem; flex: 1;">Search Google or type a URL</span>
                    <span style="color: #8ab4f8; font-size: 1rem;">🎤</span>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button style="background: #303134; color: #e8eaed; border: 1px solid #303134; padding: 8px 18px; border-radius: 4px; font-size: 0.8rem; cursor: default;">Google Search</button>
                    <button style="background: #303134; color: #e8eaed; border: 1px solid #303134; padding: 8px 18px; border-radius: 4px; font-size: 0.8rem; cursor: default;">I'm Feeling Lucky</button>
                </div>`
            },
            'github.com': {
                bg: '#0d1117', fg: '#e6edf3', accent: '#238636',
                logo: `<div style="margin-bottom: 1.5rem;">
                    <svg height="48" viewBox="0 0 16 16" width="48" fill="#e6edf3"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                </div>`,
                content: `<div style="font-size: 1.6rem; font-weight: 600; margin-bottom: 0.5rem; color: #e6edf3;">souranild</div>
                <div style="color: #8b949e; font-size: 0.9rem; margin-bottom: 1.5rem;">Design Verification Engineer • Semiconductor DV • Full-Stack Developer</div>
                <div style="display: flex; gap: 20px; color: #8b949e; font-size: 0.8rem; margin-bottom: 1.5rem;">
                    <span>📦 <strong style="color:#e6edf3">12</strong> repositories</span>
                    <span>👥 <strong style="color:#e6edf3">8</strong> followers</span>
                    <span>⭐ <strong style="color:#e6edf3">5</strong> following</span>
                </div>
                <div style="background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 12px 16px; width: 85%; max-width: 480px; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="color: #58a6ff; font-size: 0.85rem; font-weight: 600;">souranild/souranild</span>
                        <span style="background: #30363d; color: #8b949e; font-size: 0.65rem; padding: 2px 8px; border-radius: 12px;">Public</span>
                    </div>
                    <div style="color: #8b949e; font-size: 0.75rem;">Interactive Virtual Workstation Portfolio</div>
                </div>`
            },
            'linkedin.com': {
                bg: '#1b1f23', fg: '#e8e8e8', accent: '#0a66c2',
                logo: `<div style="margin-bottom: 1.5rem;">
                    <div style="background: #0a66c2; color: white; font-size: 1.8rem; font-weight: 800; padding: 8px 14px; border-radius: 4px; font-family: Arial, sans-serif; display: inline-block;">in</div>
                </div>`,
                content: `<div style="font-size: 1.4rem; font-weight: 600; margin-bottom: 0.4rem;">Souranil Das</div>
                <div style="color: #ffffffb3; font-size: 0.85rem; margin-bottom: 0.3rem;">Design Verification Engineer @ NXP Semiconductors</div>
                <div style="color: #ffffff80; font-size: 0.75rem; margin-bottom: 1.5rem;">SoC DV | Electronics & Communications | VIT Chennai</div>
                <div style="display: flex; gap: 10px; margin-bottom: 1rem;">
                    <span style="background: #0a66c2; color: white; padding: 6px 20px; border-radius: 16px; font-size: 0.8rem; font-weight: 600;">Connect</span>
                    <span style="border: 1px solid #0a66c2; color: #0a66c2; padding: 6px 20px; border-radius: 16px; font-size: 0.8rem; font-weight: 600;">Message</span>
                </div>`
            }
        };

        // Find matching mockup
        let mockKey = null;
        for (const key of Object.keys(mockups)) {
            if (domain.includes(key)) { mockKey = key; break; }
        }

        if (!mockKey) return null; // no mockup available

        const m = mockups[mockKey];
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: ${m.bg}; color: ${m.fg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; text-align: center; padding: 2rem; }
            .open-btn { margin-top: 2rem; background: ${m.accent}; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.2s; }
            .open-btn:hover { opacity: 0.85; }
            .sim-badge { position: fixed; bottom: 12px; right: 12px; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); font-size: 0.65rem; padding: 4px 10px; border-radius: 4px; backdrop-filter: blur(4px); }
        </style></head><body>
            ${m.logo}
            ${m.content}
            <a class="open-btn" href="${fullUrl}" target="_blank" rel="noopener">Open Actual Site ↗</a>
            <div class="sim-badge">🔒 Simulated Preview</div>
        </body></html>`;
    }

    function navigateFirefox(url) {
        if (!iframe || !blockedOverlay || !blockedLink || !addressInput) return;
        
        let targetUrl = url.trim();
        if (!targetUrl) targetUrl = 'blog.local';

        if (targetUrl === 'blog.local' || targetUrl === 'localhost' || targetUrl.includes('blog.html')) {
            const blogPath = resolvedBlogPath || './blog.html';
            iframe.src = `${blogPath}?t=${Date.now()}`;
            blockedOverlay.style.display = 'none';
            addressInput.value = 'blog.local';
            return;
        }

        // Add protocol if missing
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = 'https://' + targetUrl;
        }

        addressInput.value = targetUrl;
        blockedOverlay.style.display = 'none';

        // Try rendering a simulated mockup
        const simulatedHtml = renderSimulatedSite(targetUrl, targetUrl);
        if (simulatedHtml) {
            iframe.src = 'about:blank';
            iframe.onload = function onceLoaded() {
                iframe.onload = null;
                try {
                    iframe.contentDocument.open();
                    iframe.contentDocument.write(simulatedHtml);
                    iframe.contentDocument.close();
                } catch (e) {}
            };
        } else {
            // Unknown domain — show blocked overlay with open link
            iframe.src = 'about:blank';
            blockedOverlay.style.display = 'flex';
            blockedLink.href = targetUrl;
            blockedLink.textContent = `Open ${targetUrl.replace('https://', '')} in New Window ➡️`;
        }
    }

    if (addressInput) {
        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                navigateFirefox(addressInput.value);
            }
        });
    }

    const bookmarks = firefoxWindow.querySelectorAll('.bookmark-item');
    bookmarks.forEach(bm => {
        bm.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = bm.getAttribute('data-url');
            if (url) navigateFirefox(url);
        });
    });

    const btnBack = document.getElementById('firefox-back');
    const btnForward = document.getElementById('firefox-forward');
    const btnReload = document.getElementById('firefox-reload');
    const btnHome = document.getElementById('firefox-home');

    if (btnBack) {
        btnBack.addEventListener('click', (e) => {
            e.stopPropagation();
            try { iframe.contentWindow.history.back(); } catch (err) {}
        });
    }

    if (btnForward) {
        btnForward.addEventListener('click', (e) => {
            e.stopPropagation();
            try { iframe.contentWindow.history.forward(); } catch (err) {}
        });
    }

    if (btnReload) {
        btnReload.addEventListener('click', (e) => {
            e.stopPropagation();
            if (addressInput) navigateFirefox(addressInput.value);
        });
    }

    if (btnHome) {
        btnHome.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateFirefox('blog.local');
        });
    }

    // Load the blog page initially after the path probe resolves
    setTimeout(() => navigateFirefox('blog.local'), 200);
}

async function openTexInOverleaf(filePath, silent = false) {
    try {
        const response = await fetch(filePath);
        if (response.ok) {
            const text = await response.text();
            const textarea = document.getElementById('overleaf-latex-input');
            const docTitle = document.querySelector('.overleaf-doc-title');
            const winTitle = document.querySelector('#win-overleaf .window-title');
            
            if (textarea) {
                textarea.value = text;
            }
            if (docTitle) {
                docTitle.textContent = filePath.split('/').pop();
            }
            if (winTitle) {
                winTitle.textContent = `Overleaf - projects/${filePath.split('/').pop()}`;
            }
            
            // Trigger compile compilation
            const recompileBtn = document.getElementById('overleaf-recompile');
            if (recompileBtn) recompileBtn.click();

            // Bring Overleaf window on top and open if not silent
            if (!silent) {
                openAppWindow('overleaf');
            }
        }
    } catch(err) {
        console.error("Could not load tex file in Overleaf:", err);
    }
}

// System Apps Folder Nautilus launcher
function setupSysAppsFolder() {
    const sysAppItems = document.querySelectorAll('.sysapp-launch-item');
    sysAppItems.forEach(item => {
        const appId = item.getAttribute('data-app');
        if (appId) {
            const launchAction = (e) => {
                e.stopPropagation();
                openAppWindow(appId);
            };
            item.addEventListener('click', launchAction);
            item.addEventListener('dblclick', launchAction);
        }
    });
}

// VS Code Tab Switching (research_papers.md, projects.py, about_me.sh)
let vsCodeActiveFile = 'research_papers.md';

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const vsCodeFileContents = {
    'about_me.txt': {
        language: 'plaintext',
        getContent: () => {
            const rd = window.resumeData;
            if (!rd) return 'Loading about me...';
            return `NAME: ${rd.name}\nROLE: ${rd.title}\nCONTACT: ${rd.contact}\n\nCORE SKILLS:\n- Languages: ${rd.skills.languages}\n- Frameworks: ${rd.skills.frameworks}\n- Tools: ${rd.skills.tools}`;
        },
        getPreview: () => {
            const rd = window.resumeData;
            if (!rd) return '<p>Loading...</p>';
            return `<pre style="font-family:monospace; white-space:pre-wrap; padding:10px; color:#fff;">NAME: ${rd.name}\nROLE: ${rd.title}\nCONTACT: ${rd.contact}\n\nCORE SKILLS:\n- Languages: ${rd.skills.languages}\n- Frameworks: ${rd.skills.frameworks}\n- Tools: ${rd.skills.tools}</pre>`;
        },
        previewLabel: 'Preview about_me.txt'
    },
    'resume.tex': {
        language: 'latex',
        getContent: () => {
            const textarea = document.getElementById('overleaf-latex-input');
            return textarea ? textarea.value : '% LaTeX source code';
        },
        getPreview: () => {
            const textarea = document.getElementById('overleaf-latex-input');
            const text = textarea ? textarea.value : '% LaTeX source code';
            return `<pre style="font-family:monospace; white-space:pre-wrap; padding:10px; color:#d4d4d4; font-size:0.8rem;">${escapeHTML(text)}</pre>`;
        },
        previewLabel: 'Preview resume.tex'
    },
    'research_papers.md': {
        language: 'markdown',
        getContent: () => {
            const rd = window.resumeData;
            if (!rd) return '# Research Publications\n\nLoading...';
            let md = '# Research Publications\n\n';
            rd.publications.forEach((pub, idx) => {
                md += `## Paper ${idx + 1}: ${pub.title.split(':')[0]}\n`;
                md += `* **Title:** ${pub.title}\n`;
                md += `* **Publisher:** ${pub.publisher}\n`;
                md += `* **Summary:** ${pub.summary}\n\n`;
            });
            return md;
        },
        getPreview: () => {
            const rd = window.resumeData;
            if (!rd) return '<h1>Research Publications</h1><p>Loading...</p>';
            let html = '<h1>Research Publications</h1>';
            rd.publications.forEach((pub, idx) => {
                html += `
                    <h2>Paper ${idx + 1}: ${pub.title.split(':')[0]}</h2>
                    <p><strong>Title:</strong> ${pub.title}</p>
                    <p><strong>Publisher:</strong> ${pub.publisher}</p>
                    <p><strong>Summary:</strong> ${pub.summary}</p>
                `;
            });
            return html;
        },
        previewLabel: 'Preview research_papers.md'
    },
    'projects.py': {
        language: 'python',
        getContent: () => {
            const rd = window.resumeData;
            if (!rd) return '# projects.py\n# Loading...';
            let py = `#!/usr/bin/env python3\n`;
            py += `"""Project Directory - ${rd.name}"""\n\n`;
            py += `from dataclasses import dataclass\nfrom typing import List\n\n`;
            py += `@dataclass\nclass Project:\n    name: str\n    description: str\n    tags: List[str]\n\n`;
            py += `# === Project Registry ===\n\nprojects = [\n`;
            rd.projects.forEach((proj, idx) => {
                const tags = proj.tags.split(',').map(t => `"${t.trim()}"`).join(', ');
                py += `    Project(\n`;
                py += `        name="${proj.name}",\n`;
                py += `        description="${proj.description.replace(/"/g, '\\"').substring(0, 120)}...",\n`;
                py += `        tags=[${tags}]\n`;
                py += `    ),\n`;
            });
            py += `]\n\n`;
            py += `def display_projects():\n`;
            py += `    for i, proj in enumerate(projects, 1):\n`;
            py += `        print(f"\\n{'='*60}")\n`;
            py += `        print(f"  {i}. {proj.name}")\n`;
            py += `        print(f"{'='*60}")\n`;
            py += `        print(f"  {proj.description}")\n`;
            py += `        print(f"  Tags: {', '.join(proj.tags)}")\n\n`;
            py += `if __name__ == "__main__":\n`;
            py += `    display_projects()\n`;
            return py;
        },
        getPreview: () => {
            const rd = window.resumeData;
            if (!rd) return '<h1>Projects</h1><p>Loading...</p>';
            let html = '<h1 style="color:#dcdcaa;">Output: projects.py</h1>';
            html += '<pre style="font-family:var(--font-mono); font-size:0.78rem; color:#d4d4d4; white-space:pre-wrap;">';
            rd.projects.forEach((proj, idx) => {
                html += `\n<span style="color:#569cd6;">${'='.repeat(50)}</span>\n`;
                html += `  <span style="color:#dcdcaa; font-weight:bold;">${idx + 1}. ${proj.name}</span>\n`;
                html += `<span style="color:#569cd6;">${'='.repeat(50)}</span>\n`;
                html += `  <span style="color:#ce9178;">${proj.description.substring(0, 200)}</span>\n`;
                html += `  <span style="color:#6a9955;">Tags: ${proj.tags}</span>\n`;
            });
            html += '</pre>';
            return html;
        },
        previewLabel: 'Output: projects.py'
    },
    'about_me.sh': {
        language: 'bash',
        getContent: () => {
            const rd = window.resumeData;
            if (!rd) return '#!/bin/bash\n# about_me.sh\n# Loading...';
            let sh = `#!/bin/bash\n`;
            sh += `# about_me.sh - Personal profile display script\n`;
            sh += `# Run: chmod +x about_me.sh && ./about_me.sh\n\n`;
            sh += `# Colors\n`;
            sh += `GREEN="\\033[0;32m"\n`;
            sh += `CYAN="\\033[0;36m"\n`;
            sh += `YELLOW="\\033[1;33m"\n`;
            sh += `NC="\\033[0m"\n\n`;
            sh += `echo ""\n`;
            sh += `echo -e "\${GREEN}[SYSTEM CORE PROFILE]\${NC}"\n`;
            sh += `echo "===================================="\n`;
            sh += `echo -e "\${CYAN}NAME\${NC}     : ${rd.name}"\n`;
            sh += `echo -e "\${CYAN}ROLE\${NC}     : ${rd.title}"\n`;
            sh += `echo -e "\${CYAN}CONTACT\${NC}  : ${rd.contact}"\n`;
            sh += `echo "===================================="\n\n`;
            sh += `echo -e "\${GREEN}✔ System check:\${NC} ACTIVE"\n`;
            sh += `echo -e "\${GREEN}✔ Parameters:\${NC}  100%"\n\n`;
            sh += `echo -e "\${YELLOW}CORE SKILLS:\${NC}"\n`;
            if (rd.skills) {
                sh += `echo "  • Languages : ${rd.skills.languages || 'N/A'}"\n`;
                sh += `echo "  • Frameworks: ${rd.skills.frameworks || 'N/A'}"\n`;
                sh += `echo "  • Tools     : ${rd.skills.tools || 'N/A'}"\n\n`;
            }
            sh += `echo "------------------------------------"\n`;
            sh += `echo -e "\${YELLOW}BEYOND THE CODE:\${NC}"\n`;
            sh += `echo "  🎤 Singing       Classical & rock"\n`;
            sh += `echo "  📷 Photography   @the.sourlens"\n`;
            sh += `echo "  🎬 Videography   Cinematic edits"\n`;
            sh += `echo "  🎸 Guitar        Acoustic/electric"\n`;
            sh += `echo "  🎨 Drawing       Sketches"\n`;
            sh += `echo ""\n`;
            return sh;
        },
        getPreview: () => {
            const rd = window.resumeData;
            if (!rd) return '<h1>about_me.sh</h1><p>Loading...</p>';
            let html = '<h1 style="color:#dcdcaa;">Terminal Output</h1>';
            html += '<pre style="font-family:var(--font-mono); font-size:0.78rem; color:#d4d4d4; white-space:pre-wrap; background:#1e1e1e; padding:0.8rem; border-radius:4px;">';
            html += `<span style="color:#50fa7b; font-weight:bold;">[SYSTEM CORE PROFILE]</span>\n`;
            html += `<span style="color:#6272a4;">====================================</span>\n`;
            html += `<span style="color:#8be9fd;">NAME</span>     : <span style="font-weight:bold;">${rd.name}</span>\n`;
            html += `<span style="color:#8be9fd;">ROLE</span>     : ${rd.title}\n`;
            html += `<span style="color:#8be9fd;">CONTACT</span>  : <span style="color:#ff79c6;">${rd.contact}</span>\n`;
            html += `<span style="color:#6272a4;">====================================</span>\n\n`;
            html += `<span style="color:#50fa7b;">✔ System check:</span> ACTIVE\n`;
            html += `<span style="color:#50fa7b;">✔ Parameters:</span>  100%\n\n`;
            html += `<span style="color:#bd93f9; font-weight:bold;">CORE SKILLS:</span>\n`;
            if (rd.skills) {
                html += `  <span style="color:#ffb86c;">• Languages</span> : ${rd.skills.languages || 'N/A'}\n`;
                html += `  <span style="color:#ffb86c;">• Frameworks</span>: ${rd.skills.frameworks || 'N/A'}\n`;
                html += `  <span style="color:#ffb86c;">• Tools</span>     : ${rd.skills.tools || 'N/A'}\n`;
            }
            html += `\n<span style="color:#6272a4;">------------------------------------</span>\n`;
            html += `<span style="color:#bd93f9; font-weight:bold;">BEYOND THE CODE:</span>\n`;
            html += `  <span style="color:#ffb86c;">🎤 Singing</span>       Classical & rock\n`;
            html += `  <span style="color:#ffb86c;">📷 Photography</span>   @the.sourlens\n`;
            html += `  <span style="color:#ffb86c;">🎬 Videography</span>   Cinematic edits\n`;
            html += `  <span style="color:#ffb86c;">🎸 Guitar</span>        Acoustic/electric\n`;
            html += `  <span style="color:#ffb86c;">🎨 Drawing</span>       Sketches\n`;
            html += '</pre>';
            return html;
        },
        previewLabel: 'Terminal: about_me.sh'
    }
};

function setupVSCodeTabs() {
    // File explorer click handlers
    const fileItems = document.querySelectorAll('#win-vscode .file-item');
    fileItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const fileName = item.textContent.replace('📄 ', '').trim();
            
            // Check for non-compatible files and open in corresponding app
            if (fileName.endsWith('.pdf')) {
                openAppWindow('pdfviewer');
            } else if (fileName.endsWith('.odt')) {
                openAppWindow('libreoffice');
            } else {
                switchVSCodeFile(fileName);
            }
        });
    });

    // Tab close handlers and tab click
    const tabContainer = document.querySelector('#win-vscode .editor-tabs');
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.editor-tab');
            const closeBtn = e.target.closest('.tab-close');
            
            if (closeBtn && tab) {
                e.stopPropagation();
                const fileName = tab.getAttribute('data-file');
                if (fileName && fileName !== vsCodeActiveFile) {
                    tab.remove();
                }
                return;
            }
            
            if (tab) {
                e.stopPropagation();
                const fileName = tab.getAttribute('data-file');
                if (fileName) {
                    switchVSCodeFile(fileName);
                }
            }
        });
    }

    // Live VS Code input typing handler
    const textarea = document.getElementById('vscode-textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            const currentText = textarea.value;
            const fileData = vsCodeFileContents[vsCodeActiveFile];
            if (fileData) {
                fileData.currentContent = currentText;
            }

            // Sync with terminal virtual filesystem
            if (window.terminalFiles) {
                window.terminalFiles[vsCodeActiveFile] = currentText;
            }

            // Keep resume.tex synced with Overleaf in real-time
            if (vsCodeActiveFile === 'resume.tex') {
                const overleafTextarea = document.getElementById('overleaf-latex-input');
                if (overleafTextarea && overleafTextarea.value !== currentText) {
                    overleafTextarea.value = currentText;
                }
            }

            // Update live markdown, Python output, Bash output, or plaintext previews
            const previewBody = document.querySelector('#win-vscode .markdown-preview-body');
            if (previewBody) {
                if (vsCodeActiveFile.endsWith('.md')) {
                    previewBody.innerHTML = renderMarkdownToHTML(currentText);
                } else if (vsCodeActiveFile.endsWith('.py')) {
                    previewBody.innerHTML = renderPythonOutput(currentText);
                } else if (vsCodeActiveFile.endsWith('.sh')) {
                    previewBody.innerHTML = renderBashOutput(currentText);
                } else if (vsCodeActiveFile === 'resume.tex') {
                    previewBody.innerHTML = `<pre style="font-family:monospace; white-space:pre-wrap; padding:10px; color:#d4d4d4; font-size:0.8rem;">${escapeHTML(currentText)}</pre>`;
                } else {
                    previewBody.innerHTML = `<pre style="font-family:monospace; white-space:pre-wrap; padding:10px; color:#fff;">${escapeHTML(currentText)}</pre>`;
                }
            }

            // Update line numbers dynamically on typing
            const lineNumbers = document.querySelector('.line-numbers');
            if (lineNumbers) {
                const lineCount = currentText.split('\n').length;
                let linesHtml = '';
                for (let l = 1; l <= lineCount; l++) {
                    linesHtml += `<span>${l}</span>`;
                }
                lineNumbers.innerHTML = linesHtml;
            }
        });
    }
}

// Markdown parser helper for real-time preview
function renderMarkdownToHTML(md) {
    let html = '';
    const lines = md.split('\n');
    lines.forEach(line => {
        let cleanLine = line.trim();
        if (cleanLine.startsWith('# ')) {
            html += `<h1>${escapeHTML(cleanLine.substring(2))}</h1>`;
        } else if (cleanLine.startsWith('## ')) {
            html += `<h2>${escapeHTML(cleanLine.substring(3))}</h2>`;
        } else if (cleanLine.startsWith('### ')) {
            html += `<h3>${escapeHTML(cleanLine.substring(4))}</h3>`;
        } else if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
            let content = cleanLine.substring(2);
            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `<ul><li>${content}</li></ul>`;
        } else if (cleanLine !== '') {
            let content = cleanLine;
            content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html += `<p>${content}</p>`;
        }
    });
    return html;
}

// Python execution output visualizer
function renderPythonOutput(code) {
    let html = '<h1 style="color:#dcdcaa;">Output: projects.py</h1>';
    html += '<pre style="font-family:var(--font-mono); font-size:0.78rem; color:#d4d4d4; white-space:pre-wrap;">';
    
    const projectRegex = /Project\(\s*name="([^"]+)",\s*description="([^"]+)"(?:.*?tags=\[(.*?)\])?/gs;
    let match;
    let count = 1;
    let found = false;
    while ((match = projectRegex.exec(code)) !== null) {
        found = true;
        const name = match[1];
        const desc = match[2];
        const tags = match[3] ? match[3].replace(/"/g, '').trim() : '';
        html += `\n<span style="color:#569cd6;">${'='.repeat(50)}</span>\n`;
        html += `  <span style="color:#dcdcaa; font-weight:bold;">${count}. ${name}</span>\n`;
        html += `<span style="color:#569cd6;">${'='.repeat(50)}</span>\n`;
        html += `  <span style="color:#ce9178;">${desc}</span>\n`;
        html += `  <span style="color:#6a9955;">Tags: ${tags}</span>\n`;
        count++;
    }
    
    if (!found) {
        html += `Running projects.py...\n\n<span style="color:#ff5f56;">[Syntax Error or No Projects Found in script]</span>`;
    }
    html += '</pre>';
    return html;
}

// Bash execution output visualizer
function renderBashOutput(code) {
    let html = '<h1 style="color:#dcdcaa;">Terminal Output</h1>';
    html += '<pre style="font-family:var(--font-mono); font-size:0.78rem; color:#d4d4d4; white-space:pre-wrap; background:#1e1e1e; padding:0.8rem; border-radius:4px;">';
    
    const nameMatch = code.match(/NAME["']?\s*:\s*([^"\n]+)/i) || code.match(/NAME=["']([^"']+)["']/i);
    const roleMatch = code.match(/ROLE["']?\s*:\s*([^"\n]+)/i) || code.match(/ROLE=["']([^"']+)["']/i);
    const contactMatch = code.match(/CONTACT["']?\s*:\s*([^"\n]+)/i) || code.match(/CONTACT=["']([^"']+)["']/i);
    
    const name = nameMatch ? nameMatch[1].trim() : 'SOURANIL DAS';
    const role = roleMatch ? roleMatch[1].trim() : 'Design Verification Engineer';
    const contact = contactMatch ? contactMatch[1].trim() : '';
    
    html += `<span style="color:#50fa7b; font-weight:bold;">[SYSTEM CORE PROFILE]</span>\n`;
    html += `<span style="color:#6272a4;">====================================</span>\n`;
    html += `<span style="color:#8be9fd;">NAME</span>     : <span style="font-weight:bold;">${name}</span>\n`;
    html += `<span style="color:#8be9fd;">ROLE</span>     : ${role}\n`;
    html += `<span style="color:#8be9fd;">CONTACT</span>  : <span style="color:#ff79c6;">${contact}</span>\n`;
    html += `<span style="color:#6272a4;">====================================</span>\n\n`;
    html += `<span style="color:#50fa7b;">✔ System check:</span> ACTIVE\n`;
    html += `<span style="color:#50fa7b;">✔ Parameters:</span>  100%\n\n`;
    html += `<span style="color:#bd93f9; font-weight:bold;">CORE SKILLS:</span>\n`;
    
    const langMatch = code.match(/Languages\s*:\s*([^"\n]+)/i) || code.match(/Languages\s*::\s*([^"\n]+)/i);
    const toolsMatch = code.match(/Tools\s*:\s*([^"\n]+)/i) || code.match(/Tools\s*::\s*([^"\n]+)/i);
    
    if (langMatch) html += `  <span style="color:#ffb86c;">• Languages</span> : ${langMatch[1].trim()}\n`;
    if (toolsMatch) html += `  <span style="color:#ffb86c;">• Tools</span>     : ${toolsMatch[1].trim()}\n`;
    
    html += `\n<span style="color:#6272a4;">------------------------------------</span>\n`;
    html += `<span style="color:#bd93f9; font-weight:bold;">BEYOND THE CODE:</span>\n`;
    html += `  <span style="color:#ffb86c;">🎤 Singing</span>       Classical & rock\n`;
    html += `  <span style="color:#ffb86c;">📷 Photography</span>   @the.sourlens\n`;
    html += `  <span style="color:#ffb86c;">🎬 Videography</span>   Cinematic edits\n`;
    html += `  <span style="color:#ffb86c;">🎸 Guitar</span>        Acoustic/electric\n`;
    html += `  <span style="color:#ffb86c;">🎨 Drawing</span>       Sketches\n`;
    html += '</pre>';
    return html;
}

function switchVSCodeFile(fileName) {
    if (!vsCodeFileContents[fileName]) return;
    
    vsCodeActiveFile = fileName;
    const fileData = vsCodeFileContents[fileName];
    
    if (fileData.currentContent === undefined) {
        fileData.currentContent = fileData.getContent();
    }
    
    // Update explorer active state
    const fileItems = document.querySelectorAll('#win-vscode .file-item');
    fileItems.forEach(item => {
        const name = item.textContent.replace('📄 ', '').trim();
        if (name === fileName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update or create tab
    const tabContainer = document.querySelector('#win-vscode .editor-tabs');
    if (tabContainer) {
        let existingTab = tabContainer.querySelector(`.editor-tab[data-file="${fileName}"]`);
        tabContainer.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
        
        if (!existingTab) {
            existingTab = document.createElement('div');
            existingTab.className = 'editor-tab';
            existingTab.setAttribute('data-file', fileName);
            existingTab.innerHTML = `${fileName} <span class="tab-close">&times;</span>`;
            tabContainer.appendChild(existingTab);
        }
        existingTab.classList.add('active');
    }
    
    // Update editor content
    const textarea = document.getElementById('vscode-textarea');
    if (textarea) {
        textarea.value = fileData.currentContent;
    }
    
    // Toggle preview pane visibility based on file type
    const leftPane = document.querySelector('#win-vscode .left-pane');
    const rightPane = document.querySelector('#win-vscode .right-pane');
    const showPreview = !fileName.endsWith('.txt');

    if (leftPane && rightPane) {
        if (showPreview) {
            rightPane.style.display = 'block';
            leftPane.style.width = '50%';
            leftPane.style.borderRight = '1px solid #3c3c3c';
        } else {
            rightPane.style.display = 'none';
            leftPane.style.width = '100%';
            leftPane.style.borderRight = 'none';
        }
    }

    // Update preview
    const previewHeader = document.querySelector('#win-vscode .markdown-preview-header');
    const previewBody = document.querySelector('#win-vscode .markdown-preview-body');
    if (previewHeader) {
        previewHeader.textContent = fileData.previewLabel;
    }
    if (previewBody) {
        if (fileName.endsWith('.md')) {
            previewBody.innerHTML = renderMarkdownToHTML(fileData.currentContent);
        } else if (fileName.endsWith('.py')) {
            previewBody.innerHTML = renderPythonOutput(fileData.currentContent);
        } else if (fileName.endsWith('.sh')) {
            previewBody.innerHTML = renderBashOutput(fileData.currentContent);
        } else {
            previewBody.innerHTML = fileData.getPreview();
        }
    }
    
    // Update window title
    const winTitle = document.querySelector('#win-vscode .window-title');
    if (winTitle) {
        winTitle.textContent = `Visual Studio Code - ${fileName}`;
    }
}

// Export switchVSCodeFile for use from about_me.sh desktop icon
export { switchVSCodeFile };

function saveSessionState() {
    const windows = document.querySelectorAll('.desktop-window');
    const state = {
        currentWorkspace,
        topZIndex,
        windowWorkspaces,
        windows: {}
    };

    windows.forEach(win => {
        const appId = win.id.replace('win-', '');
        state.windows[appId] = {
            isOpen: win.dataset.isOpen === 'true',
            isMinimized: win.dataset.isMinimized === 'true',
            isMaximized: win.classList.contains('maximized'),
            zIndex: win.style.zIndex,
            top: win.style.top,
            left: win.style.left,
            width: win.style.width,
            height: win.style.height,
            emulatorSrc: appId === 'emulator' ? document.getElementById('emulator-iframe')?.src || '' : ''
        };
    });

    try {
        localStorage.setItem('rhel_desktop_session_state', JSON.stringify(state));
    } catch (e) {
        console.warn('localStorage write blocked:', e);
    }
}

function arrangeDefaultWindows() {
    const terminal = document.getElementById('win-terminal');
    const lo = document.getElementById('win-libreoffice');
    const pdf = document.getElementById('win-pdfviewer');
    const vscode = document.getElementById('win-vscode');
    const verisium = document.getElementById('win-verisium');
    const calculator = document.getElementById('win-calculator');
    const overleaf = document.getElementById('win-overleaf');
    const gamesFolder = document.getElementById('win-games-folder');
    const emulator = document.getElementById('win-emulator');

    // Attempt to load from persisted session
    let saved = null;
    try {
        saved = localStorage.getItem('rhel_desktop_session_state');
    } catch (e) {
        console.warn('localStorage read blocked:', e);
    }
    if (saved) {
        try {
            const state = JSON.parse(saved);
            currentWorkspace = state.currentWorkspace || 1;
            topZIndex = state.topZIndex || 30;
            
            if (state.windowWorkspaces) {
                Object.assign(windowWorkspaces, state.windowWorkspaces);
            }

            // Restore active switcher status
            const switcher = document.getElementById('workspace-switcher');
            if (switcher) {
                const buttons = switcher.querySelectorAll('.workspace-btn');
                buttons.forEach(btn => {
                    const id = parseInt(btn.getAttribute('data-workspace'));
                    if (id === currentWorkspace) btn.classList.add('active');
                    else btn.classList.remove('active');
                });
            }

            const windows = document.querySelectorAll('.desktop-window');
            windows.forEach(win => {
                const appId = win.id.replace('win-', '');
                const savedWin = state.windows[appId];
                if (savedWin) {
                    win.dataset.isOpen = savedWin.isOpen ? 'true' : 'false';
                    win.dataset.isMinimized = savedWin.isMinimized ? 'true' : 'false';
                    
                    if (savedWin.isMaximized) win.classList.add('maximized');
                    else win.classList.remove('maximized');
                    updateWindowMaximizeState(win);

                    win.style.zIndex = savedWin.zIndex;
                    win.style.top = savedWin.top;
                    win.style.left = savedWin.left;
                    win.style.width = savedWin.width;
                    win.style.height = savedWin.height;

                    const targetW = windowWorkspaces[appId] || 1;
                    if (targetW === currentWorkspace && savedWin.isOpen && !savedWin.isMinimized) {
                        win.style.display = 'flex';
                    } else {
                        win.style.display = 'none';
                    }

                    // Restore GBA emulator if open and active
                    if (appId === 'emulator' && savedWin.isOpen && !savedWin.isMinimized && savedWin.emulatorSrc) {
                        const iframe = document.getElementById('emulator-iframe');
                        if (iframe) {
                            iframe.src = savedWin.emulatorSrc;
                        }
                    }
                }
            });

            updateTaskbarTabs();
            focusNextWindow();
            return; // Exit function since layout is fully restored
        } catch (e) {
            console.error("Failed to restore saved session state, falling back to defaults:", e);
        }
    }

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

            // Position and size the PDF resume viewer prominently on top of the stack
            pdf.style.top = '60px';
            pdf.style.left = '150px';
            pdf.style.width = '720px';
            pdf.style.height = '540px';
            pdf.style.zIndex = '29'; // Highest z-index to load on top
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

        const gamesFolder = document.getElementById('win-games-folder');
        const emulator = document.getElementById('win-emulator');

        if (gamesFolder) {
            gamesFolder.dataset.isOpen = 'true';
            gamesFolder.dataset.isMinimized = 'false';
            gamesFolder.style.display = 'none'; // hidden because in Workspace 4
            
            gamesFolder.style.top = '80px';
            gamesFolder.style.left = '60px';
            gamesFolder.style.width = '560px';
            gamesFolder.style.height = '420px';
            gamesFolder.style.zIndex = '14';
        }

        if (emulator) {
            emulator.dataset.isOpen = 'false';
            emulator.dataset.isMinimized = 'false';
            emulator.style.display = 'none';
            
            emulator.style.top = '80px';
            emulator.style.left = '150px';
            emulator.style.width = '680px';
            emulator.style.height = '500px';
            emulator.style.zIndex = '15';
        }
    } else {
        const gamesFolder = document.getElementById('win-games-folder');
        const emulator = document.getElementById('win-emulator');
        const firefox = document.getElementById('win-firefox');
        const wins = [overleaf, terminal, vscode, pdf, lo, calculator, verisium, gamesFolder, emulator, firefox];
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

    // Default focus to PDF Viewer (since it is the main thing)
    if (pdf) focusWindow(pdf);
}

function setupWidgetDrag(widget) {
    const handle = widget.querySelector('.widget-header') || widget;
    if (!handle) return;

    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    function focusWidget() {
        if (topWidgetZIndex >= 28) {
            document.querySelectorAll('.desktop-widget').forEach(w => w.style.zIndex = '5');
            topWidgetZIndex = 5;
        }
        topWidgetZIndex++;
        widget.style.zIndex = topWidgetZIndex;
    }

    widget.addEventListener('mousedown', focusWidget);
    widget.addEventListener('touchstart', focusWidget, { passive: true });

    handle.addEventListener('mousedown', dragMouseDown);
    handle.addEventListener('touchstart', dragTouchStart, { passive: false });

    function dragMouseDown(e) {
        e.preventDefault();
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
        e.preventDefault();
        posX = mouseX - e.clientX;
        posY = mouseY - e.clientY;
        mouseX = e.clientX;
        mouseY = e.clientY;

        const topVal = widget.offsetTop - posY;
        const leftVal = widget.offsetLeft - posX;

        const desktop = document.querySelector('.desktop-area');
        const maxTop = (desktop?.clientHeight || window.innerHeight) - widget.clientHeight - 5;
        const maxLeft = (desktop?.clientWidth || window.innerWidth) - widget.clientWidth - 5;

        widget.style.top = `${Math.max(5, Math.min(topVal, maxTop))}px`;
        widget.style.left = `${Math.max(5, Math.min(leftVal, maxLeft))}px`;
        widget.style.right = 'auto'; // Break initial right positioning
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
        saveSessionState();
    }

    function dragTouchStart(e) {
        const touch = e.touches[0];
        mouseX = touch.clientX;
        mouseY = touch.clientY;
        document.addEventListener('touchend', touchEnd);
        document.addEventListener('touchmove', touchMove, { passive: false });
    }

    function touchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        posX = mouseX - touch.clientX;
        posY = mouseY - touch.clientY;
        mouseX = touch.clientX;
        mouseY = touch.clientY;

        const topVal = widget.offsetTop - posY;
        const leftVal = widget.offsetLeft - posX;

        const desktop = document.querySelector('.desktop-area');
        const maxTop = (desktop?.clientHeight || window.innerHeight) - widget.clientHeight - 5;
        const maxLeft = (desktop?.clientWidth || window.innerWidth) - widget.clientWidth - 5;

        widget.style.top = `${Math.max(5, Math.min(topVal, maxTop))}px`;
        widget.style.left = `${Math.max(5, Math.min(leftVal, maxLeft))}px`;
        widget.style.right = 'auto';
    }

    function touchEnd() {
        document.removeEventListener('touchend', touchEnd);
        document.removeEventListener('touchmove', touchMove);
        saveSessionState();
    }
}

function initSystemWidget() {
    const widget = document.getElementById('sys-widget');
    if (!widget) return;

    setupWidgetDrag(widget);

    // Click handler (distinguish from drag)
    let dragMove = false;
    widget.addEventListener('mousedown', () => { dragMove = false; });
    widget.addEventListener('mousemove', () => { dragMove = true; });
    widget.addEventListener('mouseup', (e) => {
        if (!dragMove) {
            e.stopPropagation();
            openAppWindow('sysmonitor');
        }
    });

    const cpuFill = document.getElementById('widget-cpu-fill');
    const cpuText = document.getElementById('widget-cpu-text');
    const ramFill = document.getElementById('widget-ram-fill');
    const ramText = document.getElementById('widget-ram-text');
    const tempText = document.getElementById('widget-temp-text');
    const uptimeText = document.getElementById('widget-uptime-text');
    const cpuBadge = document.querySelector('.cpu-load-badge');
    const canvas = document.getElementById('widget-cpu-canvas');
    
    if (cpuBadge) {
        cpuBadge.style.cursor = 'pointer';
        cpuBadge.addEventListener('click', (e) => {
            e.stopPropagation();
            openAppWindow('sysmonitor');
        });
    }

    const startTime = Date.now();
    const cpuHistory = new Array(40).fill(8);

    function updateStats() {
        const baseCpu = 2 + Math.random() * 6;
        const isSpiking = Math.random() > 0.85;
        const cpuVal = Math.round(isSpiking ? baseCpu + 15 + Math.random() * 20 : baseCpu);

        if (cpuFill) cpuFill.style.width = `${cpuVal}%`;
        if (cpuText) cpuText.textContent = `${cpuVal}%`;
        if (cpuBadge) cpuBadge.textContent = `CPU: ${cpuVal}%`;

        cpuHistory.shift();
        cpuHistory.push(cpuVal);

        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const width = canvas.width;
                const height = canvas.height;
                ctx.clearRect(0, 0, width, height);

                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
                grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

                ctx.beginPath();
                ctx.moveTo(0, height);

                const step = width / (cpuHistory.length - 1);
                for (let i = 0; i < cpuHistory.length; i++) {
                    const x = i * step;
                    const y = height - 4 - ((cpuHistory[i] / 100) * (height - 8));
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(width, height);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();

                ctx.beginPath();
                for (let i = 0; i < cpuHistory.length; i++) {
                    const x = i * step;
                    const y = height - 4 - ((cpuHistory[i] / 100) * (height - 8));
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        const ramVal = (3.12 + Math.sin(Date.now() / 20000) * 0.12 + Math.random() * 0.04).toFixed(2);
        const ramPct = ((ramVal / 16.0) * 100).toFixed(1);
        if (ramFill) ramFill.style.width = `${ramPct}%`;
        if (ramText) ramText.textContent = `${ramVal} GiB (${ramPct}%)`;

        const tempVal = Math.round(40 + Math.sin(Date.now() / 25000) * 2 + Math.random() * 1.2);
        if (tempText) tempText.textContent = `${tempVal}°C`;

        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const baseOffset = 2 * 3600 + 45 * 60;
        const totalUptime = elapsed + baseOffset;
        const h = Math.floor(totalUptime / 3600);
        const m = Math.floor((totalUptime % 3600) / 60);
        const s = totalUptime % 60;
        if (uptimeText) uptimeText.textContent = `${h}h ${m}m ${s}s`;
    }

    setInterval(updateStats, 1000);
    updateStats();
}

function setupTextEditor() {
    const textarea = document.querySelector('#win-texteditor textarea');
    if (textarea) {
        textarea.addEventListener('input', () => {
            const val = textarea.value;
            if (window.terminalFiles) {
                window.terminalFiles['new_file.txt'] = val;
            }
        });
    }
}

function setupLibreOffice() {
    const sheet = document.querySelector('#win-libreoffice .lo-paper-sheet');
    if (sheet) {
        sheet.setAttribute('contenteditable', 'true');
        sheet.addEventListener('input', () => {
            const val = sheet.innerText;
            if (window.terminalFiles) {
                window.terminalFiles['projects.odt'] = val;
            }
        });
    }
}

function initClockWidget() {
    const widget = document.getElementById('clock-widget');
    if (!widget) return;
    setupWidgetDrag(widget);

    // Click handler (distinguish from drag)
    let clockDrag = false;
    widget.addEventListener('mousedown', () => { clockDrag = false; });
    widget.addEventListener('mousemove', () => { clockDrag = true; });
    widget.addEventListener('mouseup', (e) => {
        if (!clockDrag) {
            e.stopPropagation();
            openAppWindow('clock');
        }
    });

    const bengaluruElem = document.getElementById('clock-bengaluru');
    const newyorkElem = document.getElementById('clock-newyork');
    const amsterdamElem = document.getElementById('clock-amsterdam');
    const japanElem = document.getElementById('clock-japan');

    function updateClocks() {
        const now = new Date();
        
        const blrStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
        const nyStr = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
        const amsStr = now.toLocaleTimeString('en-US', { timeZone: 'Europe/Amsterdam', hour: '2-digit', minute: '2-digit' });
        const jpnStr = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });

        if (bengaluruElem) bengaluruElem.textContent = blrStr;
        if (newyorkElem) newyorkElem.textContent = nyStr;
        if (amsterdamElem) amsterdamElem.textContent = amsStr;
        if (japanElem) japanElem.textContent = jpnStr;
    }

    updateClocks();
    setInterval(updateClocks, 1000);
}

function initWeatherWidget() {
    const widget = document.getElementById('weather-widget');
    if (!widget) return;
    setupWidgetDrag(widget);

    // Click handler (distinguish from drag)
    let weatherDrag = false;
    widget.addEventListener('mousedown', () => { weatherDrag = false; });
    widget.addEventListener('mousemove', () => { weatherDrag = true; });
    widget.addEventListener('mouseup', (e) => {
        if (!weatherDrag) {
            e.stopPropagation();
            openAppWindow('weather');
        }
    });

    const cityElem = document.getElementById('weather-city');
    const descElem = document.getElementById('weather-desc');
    const tempElem = document.getElementById('weather-temp');
    const iconElem = document.getElementById('weather-icon');

    const tzCities = {
        'Asia/Kolkata': { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
        'Asia/Calcutta': { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
        'Europe/Berlin': { name: 'Munich', lat: 48.1351, lon: 11.5820 },
        'America/Chicago': { name: 'Austin', lat: 30.2672, lon: -97.7431 },
        'America/New_York': { name: 'New York', lat: 40.7128, lon: -74.0060 },
        'America/Los_Angeles': { name: 'San Jose', lat: 37.3382, lon: -121.8863 }
    };

    function getWeatherIcon(code, isDay) {
        if ([0].includes(code)) return isDay ? '☀️' : '🌙';
        if ([1, 2, 3].includes(code)) return isDay ? '⛅' : '☁️';
        if ([45, 48].includes(code)) return '🌫️';
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
        if ([71, 73, 75, 85, 86].includes(code)) return '❄️';
        if ([95, 96, 99].includes(code)) return '⛈️';
        return '☁️';
    }

    function getWeatherDesc(code) {
        if (code === 0) return 'Clear Sky';
        if (code === 1 || code === 2) return 'Partly Cloudy';
        if (code === 3) return 'Overcast';
        if (code === 45 || code === 48) return 'Foggy';
        if (code === 51 || code === 53 || code === 55) return 'Light Drizzle';
        if (code === 61 || code === 63 || code === 65) return 'Rainy';
        if (code === 71 || code === 73 || code === 75) return 'Snowy';
        if (code === 80 || code === 81 || code === 82) return 'Rain Showers';
        if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
        return 'Cloudy';
    }

    async function fetchWeather() {
        let city = 'Bangalore';
        let lat = 12.9716;
        let lon = 77.5946;

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz && tzCities[tz]) {
            city = tzCities[tz].name;
            lat = tzCities[tz].lat;
            lon = tzCities[tz].lon;
        }

        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            try {
                const geoRes = await fetch('https://ipapi.co/json/');
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    if (geoData.city && geoData.latitude && geoData.longitude) {
                        city = geoData.city;
                        lat = geoData.latitude;
                        lon = geoData.longitude;
                    }
                }
            } catch (e) {
                console.warn('Geo IP API failed, using timezone fallback', e);
            }
        }

        try {
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            if (weatherRes.ok) {
                const weatherData = await weatherRes.json();
                const cur = weatherData.current_weather;
                if (cur) {
                    const temp = Math.round(cur.temperature);
                    const code = cur.weathercode;
                    const isDay = cur.is_day === 1;

                    if (cityElem) cityElem.textContent = city;
                    if (descElem) descElem.textContent = getWeatherDesc(code);
                    if (tempElem) tempElem.textContent = `${temp}°C`;
                    if (iconElem) iconElem.textContent = getWeatherIcon(code, isDay);
                    return;
                }
            }
        } catch (e) {
            console.warn('Weather API failed, rendering fallback', e);
        }

        const hours = new Date().getHours();
        const isDay = hours > 6 && hours < 18;
        if (cityElem) cityElem.textContent = city;
        if (descElem) descElem.textContent = 'Partly Cloudy';
        if (tempElem) tempElem.textContent = '27°C';
        if (iconElem) iconElem.textContent = isDay ? '⛅' : '☁️';
    }

    fetchWeather();
    setInterval(fetchWeather, 15 * 60 * 1000);
}

function initPhotoWidget() {
    const widget = document.getElementById('photo-widget');
    if (!widget) return;
    setupWidgetDrag(widget);

    const photoImg = widget.querySelector('img');
    if (photoImg) {
        photoImg.style.cursor = 'pointer';
        photoImg.addEventListener('click', (e) => {
            e.stopPropagation();
            openAppWindow('imageviewer');
        });
    }
}

// ─── New Applications Setups ──────────────────────────────────────────────

function setupClockApp() {
    const localTimeEl = document.getElementById('clock-local-time');
    const localDateEl = document.getElementById('clock-local-date');
    const appNy = document.getElementById('clock-app-ny');
    const appLondon = document.getElementById('clock-app-london');
    const appTokyo = document.getElementById('clock-app-tokyo');
    const appBlr = document.getElementById('clock-app-blr');

    // 1. Time ticking
    function tick() {
        const now = new Date();
        if (localTimeEl) {
            localTimeEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
        if (localDateEl) {
            localDateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
        if (appNy) {
            appNy.textContent = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit' });
        }
        if (appLondon) {
            appLondon.textContent = now.toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
        }
        if (appTokyo) {
            appTokyo.textContent = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit' });
        }
        if (appBlr) {
            appBlr.textContent = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
        }
    }
    tick();
    setInterval(tick, 1000);

    // 2. Tabs logic
    const tabBtns = document.querySelectorAll('.clock-tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.borderBottomColor = 'transparent';
                b.style.color = '#aaa';
            });
            btn.classList.add('active');
            btn.style.borderBottomColor = '#ef4444';
            btn.style.color = '#fff';

            const targetTab = btn.getAttribute('data-tab');
            document.querySelectorAll('.clock-tab-content').forEach(c => c.style.display = 'none');
            const activeContent = document.getElementById(`tab-${targetTab}`);
            if (activeContent) activeContent.style.display = 'flex';
        });
    });

    // 3. Stopwatch logic
    let stopwatchInterval = null;
    let stopwatchStart = 0;
    let stopwatchElapsed = 0;
    let stopwatchRunning = false;
    let lapCount = 0;

    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const stopwatchStartBtn = document.getElementById('stopwatch-start');
    const stopwatchLapBtn = document.getElementById('stopwatch-lap');
    const stopwatchResetBtn = document.getElementById('stopwatch-reset');
    const stopwatchLapsContainer = document.getElementById('stopwatch-laps');

    function formatStopwatchTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }

    if (stopwatchStartBtn) {
        stopwatchStartBtn.addEventListener('click', () => {
            if (stopwatchRunning) {
                // Pause
                stopwatchRunning = false;
                stopwatchElapsed += Date.now() - stopwatchStart;
                clearInterval(stopwatchInterval);
                stopwatchStartBtn.textContent = 'Start';
                stopwatchStartBtn.style.background = '#10b981';
                if (stopwatchLapBtn) stopwatchLapBtn.disabled = true;
            } else {
                // Start
                stopwatchRunning = true;
                stopwatchStart = Date.now();
                stopwatchInterval = setInterval(() => {
                    const elapsed = stopwatchElapsed + (Date.now() - stopwatchStart);
                    if (stopwatchDisplay) stopwatchDisplay.textContent = formatStopwatchTime(elapsed);
                }, 10);
                stopwatchStartBtn.textContent = 'Pause';
                stopwatchStartBtn.style.background = '#ef4444';
                if (stopwatchLapBtn) stopwatchLapBtn.disabled = false;
            }
        });
    }

    if (stopwatchLapBtn) {
        stopwatchLapBtn.addEventListener('click', () => {
            if (!stopwatchRunning) return;
            const elapsed = stopwatchElapsed + (Date.now() - stopwatchStart);
            lapCount++;
            const lapDiv = document.createElement('div');
            lapDiv.style.cssText = 'display: flex; justify-content: space-between; border-bottom: 1px solid #2d3748; padding: 0.25rem 0; font-size: 0.85rem; font-family: monospace; color: #fff;';
            lapDiv.innerHTML = `<span>Lap ${lapCount}</span><span>${formatStopwatchTime(elapsed)}</span>`;
            if (stopwatchLapsContainer) {
                stopwatchLapsContainer.appendChild(lapDiv);
                stopwatchLapsContainer.scrollTop = stopwatchLapsContainer.scrollHeight;
            }
        });
    }

    if (stopwatchResetBtn) {
        stopwatchResetBtn.addEventListener('click', () => {
            stopwatchRunning = false;
            clearInterval(stopwatchInterval);
            stopwatchElapsed = 0;
            lapCount = 0;
            if (stopwatchDisplay) stopwatchDisplay.textContent = '00:00.00';
            if (stopwatchStartBtn) {
                stopwatchStartBtn.textContent = 'Start';
                stopwatchStartBtn.style.background = '#ef4444';
            }
            if (stopwatchLapBtn) stopwatchLapBtn.disabled = true;
            if (stopwatchLapsContainer) stopwatchLapsContainer.innerHTML = '';
        });
    }
}

function setupWeatherApp() {
    const searchInput = document.getElementById('weather-search-input');
    const appCity = document.getElementById('weather-app-city');
    const appTemp = document.getElementById('weather-app-temp');
    const appDesc = document.getElementById('weather-app-desc');
    const appIcon = document.getElementById('weather-app-icon');
    const appHumidity = document.getElementById('weather-app-humidity');
    const appWind = document.getElementById('weather-app-wind');
    const appVisibility = document.getElementById('weather-app-visibility');
    const forecastContainer = document.getElementById('weather-forecast-container');

    const simulatedCities = {
        'bangalore': { name: 'Bangalore', lat: 12.9716, lon: 77.5946, humidity: '62%', wind: '11 km/h', visibility: '10 km' },
        'blr': { name: 'Bangalore', lat: 12.9716, lon: 77.5946, humidity: '62%', wind: '11 km/h', visibility: '10 km' },
        'bengaluru': { name: 'Bangalore', lat: 12.9716, lon: 77.5946, humidity: '62%', wind: '11 km/h', visibility: '10 km' },
        'mumbai': { name: 'Mumbai', lat: 19.0760, lon: 72.8777, humidity: '80%', wind: '18 km/h', visibility: '6 km' },
        'delhi': { name: 'New Delhi', lat: 28.6139, lon: 77.2090, humidity: '45%', wind: '8 km/h', visibility: '4 km' },
        'london': { name: 'London', lat: 51.5074, lon: -0.1278, humidity: '72%', wind: '15 km/h', visibility: '10 km' },
        'new york': { name: 'New York', lat: 40.7128, lon: -74.0060, humidity: '55%', wind: '12 km/h', visibility: '10 km' },
        'ny': { name: 'New York', lat: 40.7128, lon: -74.0060, humidity: '55%', wind: '12 km/h', visibility: '10 km' },
        'tokyo': { name: 'Tokyo', lat: 35.6762, lon: 139.6503, humidity: '50%', wind: '9 km/h', visibility: '10 km' },
        'paris': { name: 'Paris', lat: 48.8566, lon: 2.3522, humidity: '58%', wind: '14 km/h', visibility: '10 km' },
        'munich': { name: 'Munich', lat: 48.1351, lon: 11.5820, humidity: '65%', wind: '10 km/h', visibility: '10 km' },
        'austin': { name: 'Austin', lat: 30.2672, lon: -97.7431, humidity: '40%', wind: '7 km/h', visibility: '10 km' },
        'san jose': { name: 'San Jose', lat: 37.3382, lon: -121.8863, humidity: '48%', wind: '8 km/h', visibility: '10 km' }
    };

    function getWeatherIcon(code, isDay) {
        if ([0].includes(code)) return isDay ? '☀️' : '🌙';
        if ([1, 2, 3].includes(code)) return isDay ? '⛅' : '☁️';
        if ([45, 48].includes(code)) return '🌫️';
        if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
        if ([71, 73, 75, 85, 86].includes(code)) return '❄️';
        if ([95, 96, 99].includes(code)) return '⛈️';
        return '☁️';
    }

    function getWeatherDesc(code) {
        if (code === 0) return 'Clear Sky';
        if (code === 1 || code === 2) return 'Partly Cloudy';
        if (code === 3) return 'Overcast';
        if (code === 45 || code === 48) return 'Foggy';
        if (code === 51 || code === 53 || code === 55) return 'Light Drizzle';
        if (code === 61 || code === 63 || code === 65) return 'Rainy';
        if (code === 71 || code === 73 || code === 75) return 'Snowy';
        if (code === 80 || code === 81 || code === 82) return 'Rain Showers';
        if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
        return 'Cloudy';
    }

    async function loadCityWeather(cityName, lat, lon, metadata) {
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
            if (res.ok) {
                const data = await res.json();
                const cur = data.current_weather;
                if (cur) {
                    const temp = Math.round(cur.temperature);
                    const code = cur.weathercode;
                    const isDay = cur.is_day === 1;

                    if (appCity) appCity.textContent = cityName;
                    if (appTemp) appTemp.textContent = `${temp}°C`;
                    if (appDesc) appDesc.textContent = getWeatherDesc(code);
                    if (appIcon) appIcon.textContent = getWeatherIcon(code, isDay);
                    if (appHumidity) appHumidity.textContent = metadata?.humidity || '60%';
                    if (appWind) appWind.textContent = metadata?.wind || '10 km/h';
                    if (appVisibility) appVisibility.textContent = metadata?.visibility || '10 km';

                    // Forecast
                    if (forecastContainer && data.daily) {
                        forecastContainer.innerHTML = '';
                        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                        for (let i = 0; i < 5; i++) {
                            const date = new Date(data.daily.time[i]);
                            const dayName = i === 0 ? 'Today' : days[date.getDay()];
                            const fCode = data.daily.weathercode[i];
                            const fMin = Math.round(data.daily.temperature_2m_min[i]);
                            const fMax = Math.round(data.daily.temperature_2m_max[i]);

                            const fItem = document.createElement('div');
                            fItem.style.cssText = 'background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; padding: 0.6rem 0.4rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; font-size: 0.75rem;';
                            fItem.innerHTML = `
                                <div style="color: #94a3b8; font-weight: bold;">${dayName}</div>
                                <div style="font-size: 1.25rem; margin: 0.1rem 0;">${getWeatherIcon(fCode, true)}</div>
                                <div style="font-weight: 800;">${fMax}°</div>
                                <div style="color: #64748b;">${fMin}°</div>
                            `;
                            forecastContainer.appendChild(fItem);
                        }
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Weather App fetch failed', e);
        }

        // Fallback simulated load
        if (appCity) appCity.textContent = cityName;
        if (appTemp) appTemp.textContent = '24°C';
        if (appDesc) appDesc.textContent = 'Partly Cloudy';
        if (appIcon) appIcon.textContent = '⛅';
        if (forecastContainer) {
            forecastContainer.innerHTML = '';
            const days = ['Today', 'Mon', 'Tue', 'Wed', 'Thu'];
            for (let i = 0; i < 5; i++) {
                const fItem = document.createElement('div');
                fItem.style.cssText = 'background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.04); border-radius: 6px; padding: 0.6rem 0.4rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; font-size: 0.75rem;';
                fItem.innerHTML = `
                    <div style="color: #94a3b8; font-weight: bold;">${days[i]}</div>
                    <div style="font-size: 1.25rem; margin: 0.1rem 0;">⛅</div>
                    <div style="font-weight: 800;">28°</div>
                    <div style="color: #64748b;">20°</div>
                `;
                forecastContainer.appendChild(fItem);
            }
        }
    }

    // Default load
    loadCityWeather('Bangalore', 12.9716, 77.5946, { humidity: '62%', wind: '11 km/h', visibility: '10 km' });

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const term = searchInput.value.trim().toLowerCase();
                if (term) {
                    if (simulatedCities[term]) {
                        const cityObj = simulatedCities[term];
                        loadCityWeather(cityObj.name, cityObj.lat, cityObj.lon, cityObj);
                    } else {
                        // Simulated search search response
                        const stylizedName = searchInput.value.trim().charAt(0).toUpperCase() + searchInput.value.trim().slice(1);
                        loadCityWeather(stylizedName, 40 + Math.random()*10, -70 - Math.random()*20, {
                            humidity: `${Math.round(40 + Math.random()*40)}%`,
                            wind: `${Math.round(5 + Math.random()*15)} km/h`,
                            visibility: '10 km'
                        });
                    }
                }
            }
        });
    }
}

function setupImageViewerApp() {
    const img = document.getElementById('imageviewer-img');
    const zoomInBtn = document.getElementById('img-zoom-in');
    const zoomOutBtn = document.getElementById('img-zoom-out');
    const resetBtn = document.getElementById('img-reset');
    const rotLeftBtn = document.getElementById('img-rotate-left');
    const rotRightBtn = document.getElementById('img-rotate-right');
    const zoomLevelEl = document.getElementById('img-zoom-level');
    
    const prevBtn = document.getElementById('img-prev');
    const nextBtn = document.getElementById('img-next');
    const filenameEl = document.getElementById('img-filename');

    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) || '';

    const images = [
        { name: 'profile.png', path: `${basePath}/profile.png` },
        { name: 'hanoi.jpg', path: `${basePath}/wallpapers/hanoi.jpg` },
        { name: 'hcm.jpg', path: `${basePath}/wallpapers/hcm.jpg` },
        { name: 'hoian.jpg', path: `${basePath}/wallpapers/hoian.jpg` },
        { name: 'kuah.jpg', path: `${basePath}/wallpapers/kuah.jpg` },
        { name: 'mua.jpg', path: `${basePath}/wallpapers/mua.jpg` },
        { name: 'petronas.jpg', path: `${basePath}/wallpapers/petronas.jpg` },
        { name: 'sungsot.jpg', path: `${basePath}/wallpapers/sungsot.jpg` },
        { name: 'towerkl.jpg', path: `${basePath}/wallpapers/towerkl.jpg` }
    ];
    let currentIdx = 0;

    let currentScale = 1.0;
    let currentRotation = 0;

    function applyTransforms() {
        if (img) {
            img.style.transform = `scale(${currentScale}) rotate(${currentRotation}deg)`;
        }
        if (zoomLevelEl) {
            zoomLevelEl.textContent = `${Math.round(currentScale * 100)}%`;
        }
    }

    function showImage(idx) {
        if (idx < 0) idx = images.length - 1;
        if (idx >= images.length) idx = 0;
        currentIdx = idx;

        const activeImg = images[currentIdx];
        if (img) {
            img.src = activeImg.path;
            img.alt = activeImg.name;
        }
        if (filenameEl) {
            filenameEl.textContent = activeImg.name;
        }

        currentScale = 1.0;
        currentRotation = 0;
        applyTransforms();
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIdx - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIdx + 1);
        });
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentScale = Math.min(3.0, currentScale + 0.1);
            applyTransforms();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentScale = Math.max(0.2, currentScale - 0.1);
            applyTransforms();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentScale = 1.0;
            currentRotation = 0;
            applyTransforms();
        });
    }

    if (rotLeftBtn) {
        rotLeftBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentRotation -= 90;
            applyTransforms();
        });
    }

    if (rotRightBtn) {
        rotRightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentRotation += 90;
            applyTransforms();
        });
    }

    // Initialize with first image
    showImage(0);
}

function initWallpaperRotator() {
    const wallpapers = [
        'hanoi.jpg', 'hcm.jpg', 'hoian.jpg', 'kuah.jpg',
        'mua.jpg', 'petronas.jpg', 'sungsot.jpg', 'towerkl.jpg'
    ];
    
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) || '';
    
    function setRandomWallpaper() {
        const randomIdx = Math.floor(Math.random() * wallpapers.length);
        const wallpaperFile = wallpapers[randomIdx];
        const imageUrl = `url('${basePath}/wallpapers/${wallpaperFile}')`;
        
        // Set the background on body, desktop-area, and boot-login
        const desktopArea = document.querySelector('.desktop-area');
        const bootLogin = document.getElementById('boot-login');
        
        if (desktopArea) {
            desktopArea.style.setProperty('background', `${imageUrl} center/cover no-repeat`, 'important');
        }
        if (bootLogin) {
            bootLogin.style.setProperty('background', `${imageUrl} center/cover no-repeat`, 'important');
        }
        
        // Update CSS variable so other elements fallback to it
        document.body.style.setProperty('--theme-desktop-bg', `${imageUrl} center/cover no-repeat`, 'important');
    }
    
    setRandomWallpaper();
    setInterval(setRandomWallpaper, 10 * 60 * 1000); // 10 minutes
}

export function updateWallpaperBlur() {
    const blurOverlay = document.getElementById('desktop-blur-overlay');
    if (!blurOverlay) return;

    const openWindows = Array.from(document.querySelectorAll('.desktop-window')).filter(win => {
        return win.style.display === 'flex' && win.dataset.isOpen === 'true' && win.dataset.isMinimized !== 'true';
    });

    const isAnyAppOpen = openWindows.length > 0;
    
    if (isAnyAppOpen) {
        blurOverlay.style.opacity = '1';
    } else {
        blurOverlay.style.opacity = '0';
    }
}

function initDesktopWallpaperBlur() {
    const desktopArea = document.querySelector('.desktop-area');
    if (!desktopArea) return;

    desktopArea.addEventListener('mousemove', (e) => {
        const blurOverlay = document.getElementById('desktop-blur-overlay');
        if (!blurOverlay) return;

        const openWindows = Array.from(document.querySelectorAll('.desktop-window')).filter(win => {
            return win.style.display === 'flex' && win.dataset.isOpen === 'true' && win.dataset.isMinimized !== 'true';
        });

        if (openWindows.length === 0) {
            blurOverlay.style.opacity = '0';
            return;
        }

        let isOverWindow = false;
        for (const win of openWindows) {
            const rect = win.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                isOverWindow = true;
                break;
            }
        }

        const rhelTop = document.querySelector('.rhel-top-panel');
        const rhelBottom = document.querySelector('.rhel-bottom-panel');
        if (rhelTop) {
            const rect = rhelTop.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                isOverWindow = true;
            }
        }
        if (rhelBottom) {
            const rect = rhelBottom.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                isOverWindow = true;
            }
        }

        if (isOverWindow) {
            blurOverlay.style.opacity = '1';
        } else {
            blurOverlay.style.opacity = '0';
        }
    });

    desktopArea.addEventListener('mouseleave', () => {
        updateWallpaperBlur();
    });

    updateWallpaperBlur();
}
