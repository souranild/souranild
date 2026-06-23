// ZSH Interactive Terminal Command Simulator with Syntax Highlighting, Autocomplete, and Animating Banner

import { openAppWindow } from './desktop.js';

let displayContainer;
let inputField;
let suggestSpan;
let currentDir = 'portfolio';
let cmdHistory = [];

// Live filesystem assets updated dynamically from LaTeX
const files = {
    'about_me.txt': '',
    'resume.tex': 'LaTeX resume source file. Open with Overleaf or view in VS Code.',
    'resume.desktop': `[Desktop Entry]
Name=resume.tex
Comment=Resume LaTeX Document
Exec=overleaf /resume.tex
Icon=text-x-tex
Terminal=false
Type=Application`,
    'projects.odt': 'LibreOffice document projects.odt. Run "./open_projects.sh" or click the LibreOffice icon.',
    "Souranil's Resume.pdf": 'PDF Document Souranil\'s Resume.pdf. Run "./open_resume.sh" or click the PDF Viewer icon.',
    'research_papers.md': 'Markdown document research_papers.md. Run "./open_vscode.sh" or click the VS Code icon.',
    'open_projects.sh': 'Launcher script for LibreOffice projects.odt. Running...',
    'open_resume.sh': "Launcher script for Souranil's Resume.pdf. Running...",
    'open_vscode.sh': 'Launcher script for VS Code editor. Running...',
    'open_calculator.sh': 'Launcher script for Calculator app. Running...'
};

const COMMANDS = [
    'help', 'ls', 'clear', 'whoami', 'date', 'git status',
    'libreoffice', 'evince', 'pdf', 'code', 'vscode', 'calculator', 'neofetch',
    'cat about_me.txt', 'cat projects.odt', 'cat "Souranil\'s Resume.pdf"', 'cat research_papers.md',
    'cat open_projects.sh', 'cat open_resume.sh', 'cat open_vscode.sh',
    './open_projects.sh', './open_resume.sh', './open_vscode.sh', './open_calculator.sh',
    'pwd', 'cd', 'uname -a', 'uptime', 'history', 'sudo', 'cowsay'
];

export function updateZshFiles(resumeData) {
    const border = 'color: #bd93f9;';
    const textPurple = 'color: #bd93f9; font-weight: bold;';
    const textPink = 'color: #ff79c6; font-weight: bold;';
    const textCyan = 'color: #8be9fd; font-weight: bold;';
    const textGreen = 'color: #50fa7b; font-weight: bold;';
    const textYellow = 'color: #f1fa8c; font-weight: bold;';
    const textOrange = 'color: #ffb86c; font-weight: bold;';
    const comment = 'color: #6272a4;';
    
    files['about_me.txt'] = `<span style="${border}">_________________________________________________________________________________________</span>
<span style="${border}">/\\</span>                                                                                       <span style="${border}">\\</span>
<span style="${border}">\\_|</span>  <span style="${textPink}">____   ___  _   _ ____    _   _   _ ___ _       ____    _    ____ </span>                   <span style="${border}">|</span>
<span style="${border}">  |</span> <span style="${textPink}">/ ___| / _ \\| | | |  _ \\  / \\ | \\ | |_ _| |     |  _ \\  / \\  / ___|</span>                   <span style="${border}">|</span>
<span style="${border}">  |</span> <span style="${textCyan}">\\___ \\| | | | | | | |_) |/ _ \\|  \\| || || |     | | | |/ _ \\ \\___ \\</span>                   <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${textGreen}">___) | |_| | |_| |  _ &lt;| ___ \\ |\\  || || |___  | |_| / ___ \\ ___) |</span>                  <span style="${border}">|</span>
<span style="${border}">  |</span> <span style="${textYellow}">|____/ \\___/ \\___/|_| \\_\\_/   \\_|_| \\_|___|_____| |____/_/   \\_\\____/</span>                  <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${textOrange}">======================== [ SYSTEM CORE INITIALIZED ] ========================</span>        <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>   <span style="color: #f8f8f2;">STATUS: ACTIVE [</span><span style="${textGreen}">██████████████████████████████</span><span style="color: #f8f8f2;">] 100% SECURE</span>                         <span style="${border}">|</span>
<span style="${border}">  |</span>   <span style="${textCyan}">LOGIC CHECK: PASSED (V_CORE = 1.2V)</span>                                                 <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${comment}">-----------------------------------------------------------------------------------</span>  <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${textPurple}">► USER PROFILE</span>                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${comment}">-----------------------------------------------------------------------------------</span>  <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textCyan}">[IDENTITY]</span>     : <span style="color: #f8f8f2; font-weight: bold;">${resumeData.name}</span>                                                      <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textCyan}">[DESIGNATION]</span>  : <span style="color: #f8f8f2;">Design Verification Engineer - G2</span>                                 <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textCyan}">[DEPLOYMENT]</span>   : <span style="color: #f8f8f2;">NXP Semiconductors</span>                                                <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textCyan}">[LOCATION]</span>     : <span style="color: #f8f8f2;">Bangalore, India</span>                                                  <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textCyan}">[COMMS]</span>        : <span style="color: #f8f8f2;">${resumeData.contact}</span>                                            <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${comment}">-----------------------------------------------------------------------------------</span>  <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${textPurple}">► HARDWARE &amp; SOFTWARE SPECIFICATIONS (CORE SKILLS)</span>                                   <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${comment}">-----------------------------------------------------------------------------------</span>  <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textGreen}">&lt;/&gt; LANGUAGES</span>  ::  <span style="color: #f8f8f2;">SystemVerilog ── C/C++ ── Python ── Bash</span>                        <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textGreen}">⚙️  DOMAINS</span>    ::  <span style="color: #f8f8f2;">RTL Design ── Embedded Systems ── IoT</span>                           <span style="${border}">|</span>
<span style="${border}">  |</span>                       <span style="color: #f8f8f2;">Automation ── JTAG ── Ethernet</span>                                  <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textGreen}">🔧 TOOLS</span>       ::  <span style="color: #f8f8f2;">Cadence Xcelium ── Verisium Debug ── VS Code</span>                    <span style="${border}">|</span>
<span style="${border}">  |</span>                       <span style="color: #f8f8f2;">Git ── LibreOffice ── LaTeX</span>                                     <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${comment}">-----------------------------------------------------------------------------------</span>  <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${textPurple}">► BACKGROUND THREADS (BEYOND THE CODE)</span>                                               <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${comment}">-----------------------------------------------------------------------------------</span>  <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textYellow}">🎤 [SINGING]</span>       <span style="color: #f8f8f2;">Loves to sing — from Bollywood to classic rock</span>                  <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textYellow}">📸 [PHOTOGRAPHY]</span>   <span style="color: #f8f8f2;">Street &amp; landscape photography (@the.sourlens)</span>                  <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textYellow}">🎬 [VIDEOGRAPHY]</span>   <span style="color: #f8f8f2;">Short films, reels, and cinematic edits</span>                         <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textYellow}">🎸 [GUITAR]</span>        <span style="color: #f8f8f2;">Acoustic &amp; electric — instrumental covers on YouTube</span>            <span style="${border}">|</span>
<span style="${border}">  |</span>    <span style="${textYellow}">🎨 [DRAWING]</span>       <span style="color: #f8f8f2;">Sketches &amp; illustrations when the mood strikes</span>                  <span style="${border}">|</span>
<span style="${border}">  |</span>                                                                                       <span style="${border}">|</span>
<span style="${border}">  |</span>  <span style="${textOrange}">=============================================================================</span>        <span style="${border}">|</span>
<span style="${border}">  |</span>   <span style="${comment}">[CTRL+C to exit session]</span>                                                            <span style="${border}">|</span>
<span style="${border}">  \\_|_____________________________________________________________________________________/</span>`;
}

let historyIndex = -1; // -1 = not browsing history

export function initZsh() {
    displayContainer = document.getElementById('zsh-display');
    inputField = document.getElementById('zsh-input');
    suggestSpan = document.getElementById('zsh-suggest');

    // Share the terminal files globally for sync with desktop apps
    window.terminalFiles = files;

    if (!displayContainer || !inputField) return;

    // Run the startup animation sequence
    runStartupSequence();

    // Focus input field on terminal click
    const terminalWin = document.getElementById('win-terminal');
    if (terminalWin) {
        terminalWin.addEventListener('click', () => {
            inputField.focus();
        });
    }

    // Input text listener for syntax highlighting and autocomplete
    inputField.addEventListener('input', handleInput);

    // Key handlers for executing commands, Ctrl+C, Ctrl+L, history navigation
    inputField.addEventListener('keydown', (e) => {
        // Ctrl+C — interrupt: print ^C and a fresh prompt line
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            const interrupted = inputField.value;
            inputField.value = '';
            if (suggestSpan) suggestSpan.textContent = '';
            historyIndex = -1;
            const ctrlLine = document.createElement('div');
            ctrlLine.className = 'prompt-line';
            ctrlLine.innerHTML = `
                <span class="zsh-prompt">➜  <span class="zsh-dir">${currentDir}</span> <span class="zsh-git">git:(<span class="git-branch">main</span>)</span> <span class="zsh-cross">✗</span> </span>
                <span class="prompt-cmd">${escapeHTML(interrupted)}</span><span style="color:#ff5555;"> ^C</span>
            `;
            displayContainer.appendChild(ctrlLine);
            const terminalBody = displayContainer.parentElement;
            terminalBody.scrollTop = terminalBody.scrollHeight;
            return;
        }

        // Ctrl+L — clear screen
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            displayContainer.innerHTML = '';
            return;
        }

        // Up arrow — browse history backwards
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (cmdHistory.length === 0) return;
            if (historyIndex === -1) historyIndex = cmdHistory.length - 1;
            else if (historyIndex > 0) historyIndex--;
            inputField.value = cmdHistory[historyIndex];
            handleInput();
            // move cursor to end
            setTimeout(() => inputField.setSelectionRange(inputField.value.length, inputField.value.length), 0);
            return;
        }

        // Down arrow — browse history forwards
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;
            if (historyIndex < cmdHistory.length - 1) {
                historyIndex++;
                inputField.value = cmdHistory[historyIndex];
            } else {
                historyIndex = -1;
                inputField.value = '';
            }
            handleInput();
            return;
        }

        if (e.key === 'Tab' || e.key === 'ArrowRight') {
            if (suggestSpan && suggestSpan.textContent) {
                e.preventDefault();
                inputField.value = suggestSpan.textContent;
                handleInput();
            }
        } else if (e.key === 'Enter') {
            const cmd = inputField.value;
            inputField.value = '';
            if (suggestSpan) suggestSpan.textContent = '';
            historyIndex = -1;
            
            if (cmd.trim()) {
                executeCommand(cmd.trim());
            }
        }
    });
}

// Programmatic command trigger (e.g. from workspaces manager)
export function runZshCommand(commandLine) {
    if (!displayContainer) {
        displayContainer = document.getElementById('zsh-display');
    }
    if (!inputField) {
        inputField = document.getElementById('zsh-input');
    }
    if (displayContainer) {
        executeCommand(commandLine);
        // Always re-focus the input so the user can type immediately after
        if (inputField) {
            setTimeout(() => inputField.focus(), 50);
        }
    }
}

function handleInput() {
    const rawVal = inputField.value;
    const val = rawVal.trim().toLowerCase();
    
    let isValid = false;
    
    if (rawVal === '') {
        isValid = true;
    } else {
        const firstWord = val.split(' ')[0];
        const validFirstWords = [
            'help', 'ls', 'clear', 'whoami', 'date', 'git', 'libreoffice',
            'evince', 'pdf', 'code', 'vscode', 'calculator', 'cat', 'neofetch',
            './open_projects.sh', './open_resume.sh', './open_vscode.sh', './open_calculator.sh',
            'pwd', 'cd', 'uname', 'uptime', 'history', 'sudo', 'cowsay', 'echo', 'touch', 'rm'
        ];
        
        if (validFirstWords.includes(firstWord)) {
            if (firstWord === 'git') {
                isValid = val === 'git' || val === 'git status';
            } else if (firstWord === 'cat') {
                const arg = val.split(' ')[1] || '';
                const validFiles = Object.keys(files);
                isValid = arg === '' || validFiles.some(f => f.startsWith(arg));
            } else {
                isValid = true;
            }
        }
    }
    
    // Lint command text color
    inputField.style.color = isValid ? 'var(--accent-green)' : '#ff5f56';
    
    // Find autosuggestion
    let suggestion = '';
    if (rawVal.length > 0) {
        const match = COMMANDS.find(c => c.startsWith(rawVal.toLowerCase()));
        if (match && match !== rawVal.toLowerCase()) {
            suggestion = rawVal + match.substring(rawVal.length);
        }
    }
    
    if (suggestSpan) {
        suggestSpan.textContent = suggestion;
    }
}

function printLine(text, className = '') {
    const line = document.createElement('div');
    if (className) line.className = className;
    line.innerHTML = text.replace(/\n/g, '<br>');
    displayContainer.appendChild(line);

    // Scroll to bottom
    const terminalBody = displayContainer.parentElement;
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

// Typing startup animation
function runStartupSequence() {
    printLine('UVM Simulation Station booting...', 'terminal-warning');
    setTimeout(() => {
        printLine('zsh shell loaded successfully.', 'terminal-info');
        
        // Show profile info (about_me.txt) directly without duplicate name banner
        const profileInfo = files['about_me.txt'] || `Loading system profile...`;
        printLine(profileInfo);
        
        // Game of Life seeded from user ASCII art
        const golContainer = document.createElement('pre');
        golContainer.style.margin = '1rem 0';
        golContainer.style.fontFamily = 'var(--font-mono)';
        golContainer.style.fontSize = '0.72rem';
        golContainer.style.lineHeight = '1.15';
        golContainer.style.letterSpacing = '0.02em';
        golContainer.style.userSelect = 'none';
        displayContainer.appendChild(golContainer);

        // ── Seed pattern (user art) ──────────────────────────────────────
        // Non-space, non-dot chars are ALIVE cells.
        const SEED = [
            '                    .   .xXXXX+.   .                   ',
            '               .   ..   xXXXX+.-   ..   .              ',
            '         .   ..  ... ..xXXXX+. --.. ...  ..   .        ',
            '     .   ..  ... .....xXXXX+.  -.-..... ...  ..   .    ',
            '   .   ..  ... ......xXXXX+.  . .--...... ...  ..   .  ',
            '  .   ..  ... ......xXXXX+.    -.- -...... ...  ..   . ',
            ' .   ..  ... ......xXXXX+.   .-+-.-.-...... ...  ..   .',
            ' .   ..  ... .....xXXXX+. . --xx+.-.--..... ...  ..   .',
            '.   ..  ... .....xXXXX+. - .-xxxx+- .-- .... ...  ..   ',
            ' .   ..  ... ...xXXXX+.  -.-xxxxxx+ .---... ...  ..   .',
            ' .   ..  ... ..xXXXX+. .---..xxxxxx+-..--.. ...  ..   .',
            '  .   ..  ... xXXXX+. . --....xxxxxx+  -.- ...  ..   . ',
            '   .   ..  ..xXXXX+. . .-......xxxxxx+-. --..  ..   .  ',
            '     .   .. xXXXXXXXXXXXXXXXXXXXxxxxxx+. .-- ..   .    ',
            '         . xXXXXXXXXXXXXXXXXXXXXXxxxxxx+.  -- .        ',
            '           xxxxxxxxxxxxxxxxxxxxxxxxxxxxx+.--             ',
            '            xxxxxxxxxxxxxxxxxxxxxxxxxxxxx+-   Ojosh!ro   ',
        ];

        const DEAD_CHARS  = new Set([' ', '.']);
        const COLS = SEED[0].length;
        const ROWS = SEED.length;

        // Build initial grid: 1 = alive, 0 = dead
        let grid = SEED.map(row =>
            Array.from(row.padEnd(COLS, ' ')).map(ch => DEAD_CHARS.has(ch) ? 0 : 1)
        );
        // Pad to ROWS rows if shorter
        while (grid.length < ROWS) grid.push(new Array(COLS).fill(0));

        // ── GoL step ────────────────────────────────────────────────────
        function golStep(g) {
            return g.map((row, r) =>
                row.map((cell, c) => {
                    let n = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue;
                            const nr = r + dr, nc = c + dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) n += g[nr][nc];
                        }
                    }
                    if (cell) return (n === 2 || n === 3) ? 1 : 0;
                    return n === 3 ? 1 : 0;
                })
            );
        }

        // ── Neighbour count (for colour mapping) ────────────────────────
        function neighborCount(g, r, c) {
            let n = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) n += g[nr][nc];
                }
            }
            return n;
        }

        // ── Render grid as coloured HTML ─────────────────────────────────
        // Colour ramp: sparse (1-2) → cyan, medium (3-4) → purple, dense (5-8) → red/orange
        const COLORS = ['', '#8be9fd','#8be9fd','#bd93f9','#bd93f9','#ffb86c','#ff79c6','#ff5555','#ff5555'];
        // Char ramp by neighbour count
        const CHARS  = [' ', '·', '░', '▒', '▓', '+', 'x', 'X', '█'];

        function renderGrid(g) {
            let html = '';
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (g[r][c]) {
                        const n = neighborCount(g, r, c);
                        const ch  = CHARS[Math.min(n, 8)];
                        const col = COLORS[Math.min(n, 8)];
                        html += `<span style="color:${col}">${ch}</span>`;
                    } else {
                        html += ' ';
                    }
                }
                html += '\n';
            }
            return html;
        }

        // ── Animation loop ───────────────────────────────────────────────
        let generation = 0;
        const golInterval = setInterval(() => {
            if (!document.body.contains(golContainer)) {
                clearInterval(golInterval);
                return;
            }
            golContainer.innerHTML = renderGrid(grid);
            grid = golStep(grid);
            generation++;
            // After 300 generations reset to seed to keep it alive forever
            if (generation >= 300) {
                generation = 0;
                grid = SEED.map(row =>
                    Array.from(row.padEnd(COLS, ' ')).map(ch => DEAD_CHARS.has(ch) ? 0 : 1)
                );
                while (grid.length < ROWS) grid.push(new Array(COLS).fill(0));
            }
        }, 120);
    }, 400);
}

function executeCommand(commandLine) {
    cmdHistory.push(commandLine);
    
    // Print original prompt line
    const promptRow = document.createElement('div');
    promptRow.className = 'prompt-line';
    promptRow.innerHTML = `
        <span class="zsh-prompt">➜  <span class="zsh-dir">${currentDir}</span> <span class="zsh-git">git:(<span class="git-branch">main</span>)</span> <span class="zsh-cross">✗</span> </span>
        <span class="prompt-cmd">${escapeHTML(commandLine)}</span>
    `;
    displayContainer.appendChild(promptRow);

    const args = commandLine.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
        case 'help':
            printLine(`
Available commands:
  ls                      - Lists files in the current working directory
  cat [file]              - Prints content of text files (e.g. cat about_me.txt)
  pwd                     - Prints the absolute path of the current directory
  cd [dir]                - Changes the terminal working directory
  neofetch                - Displays system specs alongside Red Hat logo
  cowsay [text]           - Prints a talking ASCII cow
  uname -a                - Prints system hardware and Linux kernel info
  uptime                  - Displays the system uptime log
  history                 - Shows command history log
  touch [file]            - Creates a blank mock file
  rm [file]               - Deletes a local mock file
  echo [text]             - Outputs text arguments to the console
  clear                   - Clears the terminal screen
  whoami                  - Prints active user identity
  date                    - Prints local workstation timestamp
  git status              - Inspects git repo coverage status
  libreoffice / code / pdf- Shell shortcuts to launch desktop apps
            `);
            break;
            
        case 'ls':
            if (currentDir === '~') {
                printLine(`drwxr-xr-x  2  souranil  staff   256B  portfolio`);
            } else {
                let list = '';
                Object.keys(files).forEach(f => {
                    const size = files[f].length;
                    list += `-rw-r--r--  1  souranil  staff   ${size}B  ${f}\n`;
                });
                printLine(list.trim());
            }
            break;

        case 'pwd':
            if (currentDir === '~') {
                printLine('/home/souranil');
            } else {
                printLine('/home/souranil/portfolio');
            }
            break;

        case 'cd':
            const dir = args[1];
            if (!dir || dir === '~' || dir === '/home/souranil') {
                currentDir = '~';
            } else if (dir === 'portfolio' || dir === './portfolio') {
                if (currentDir === '~') {
                    currentDir = 'portfolio';
                } else {
                    printLine('cd: already inside portfolio', 'terminal-warning');
                }
            } else if (dir === '..') {
                currentDir = '~';
            } else {
                printLine(`cd: no such file or directory: ${dir}`, 'terminal-error');
            }
            
            // Sync current prompt directory text
            const dirLabel = document.querySelector('.zsh-dir');
            if (dirLabel) dirLabel.textContent = currentDir;
            break;

        case 'echo':
            printLine(args.slice(1).join(' '));
            break;

        case 'touch':
            const newFile = args[1];
            if (!newFile) {
                printLine('touch: missing file operand', 'terminal-error');
            } else {
                files[newFile] = 'Empty mock file created via console touch command.';
                printLine(`touch: File "${newFile}" created.`, 'terminal-info');
            }
            break;

        case 'rm':
            const targetFile = args[1];
            if (!targetFile) {
                printLine('rm: missing operand', 'terminal-error');
            } else if (files[targetFile] !== undefined) {
                delete files[targetFile];
                printLine(`rm: File "${targetFile}" successfully deleted.`, 'terminal-info');
            } else {
                printLine(`rm: cannot remove '${targetFile}': No such file or directory`, 'terminal-error');
            }
            break;

        case 'uname':
            if (args[1] === '-a' || args.includes('-a')) {
                printLine('Linux nxp-dv-station 5.14.0-427.13.1.el9_4.x86_64 #1 SMP PREEMPT_DYNAMIC Wed May 1 19:11:23 EDT 2026 x86_64 GNU/Linux');
            } else {
                printLine('Linux');
            }
            break;

        case 'uptime':
            printLine(' 02:59:12 up 4:32,  1 user,  load average: 0.05, 0.08, 0.12');
            break;

        case 'sudo':
            printLine('souranil is not in the sudoers file. This incident will be reported.', 'terminal-error');
            break;

        case 'cowsay':
            const msg = args.slice(1).join(' ') || 'Moo!';
            const cow = `
 _________________________________________
&lt; ${msg} &gt;
 -----------------------------------------
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||
            `;
            printLine(cow);
            break;

        case 'history':
            let histOut = '';
            cmdHistory.forEach((c, idx) => {
                histOut += `  ${idx + 1}  ${c}\n`;
            });
            printLine(histOut.trim());
            break;

        case 'neofetch':
            const neofetchOutput = `
<span style="color: #cc0000; font-weight: bold;">           \`.-/::-.\`</span>          <span style="color: #50fa7b; font-weight: bold;">souranil</span>@<span style="color: #50fa7b; font-weight: bold;">nxp-dv-station</span>
<span style="color: #cc0000; font-weight: bold;">        ./yhdmmmmmdhy/.</span>       -----------------------
<span style="color: #cc0000; font-weight: bold;">      -odmmmmmmmmmmmmmdo-</span>     <span style="color: #8be9fd; font-weight: bold;">OS:</span> Red Hat Enterprise Linux 9.4 x86_64
<span style="color: #cc0000; font-weight: bold;">    .sdmmmmmmmmmmmmmmmmmds.</span>   <span style="color: #8be9fd; font-weight: bold;">Host:</span> NXP DV-Workstation v2.0
<span style="color: #cc0000; font-weight: bold;">   /mmmmmmmmmmmmmmmmmmmmmm/</span>   <span style="color: #8be9fd; font-weight: bold;">Kernel:</span> 5.14.0-427.13.1.el9_4.x86_64
<span style="color: #cc0000; font-weight: bold;">  :mmmmmmmmNmmmmmmmmmmmmmm:</span>   <span style="color: #8be9fd; font-weight: bold;">Uptime:</span> 4 hours, 32 mins
<span style="color: #cc0000; font-weight: bold;"> -mmmmmmmmNNNmmmmmmmmmmmmmd-</span>  <span style="color: #8be9fd; font-weight: bold;">Packages:</span> 1842 (rpm), 12 (flatpak)
<span style="color: #cc0000; font-weight: bold;"> ymmmmmmmNNNNNmmmmmmmmmmmdmy</span>  <span style="color: #8be9fd; font-weight: bold;">Shell:</span> zsh 5.8.1
<span style="color: #cc0000; font-weight: bold;">.mmmmmmmNNNNNNNmmmmmmmmmmmmm.</span> <span style="color: #8be9fd; font-weight: bold;">Resolution:</span> 1470x835
<span style="color: #cc0000; font-weight: bold;"> ymmmmmmmNNNNNmmmmmmmmmmmdmy</span>  <span style="color: #8be9fd; font-weight: bold;">DE:</span> MATE 1.26.0 (Clearlooks-Phenix)
<span style="color: #cc0000; font-weight: bold;"> -mmmmmmmmNNNmmmmmmmmmmmmmd-</span>  <span style="color: #8be9fd; font-weight: bold;">WM:</span> Metacity
<span style="color: #cc0000; font-weight: bold;">  :mmmmmmmmNmmmmmmmmmmmmmm:</span>   <span style="color: #8be9fd; font-weight: bold;">Theme:</span> Clearlooks-Phenix
<span style="color: #cc0000; font-weight: bold;">   /mmmmmmmmmmmmmmmmmmmmmm/</span>   <span style="color: #8be9fd; font-weight: bold;">Terminal:</span> zsh_terminal
<span style="color: #cc0000; font-weight: bold;">    .sdmmmmmmmmmmmmmmmmmds.</span>   <span style="color: #8be9fd; font-weight: bold;">CPU:</span> Intel i7-13700H (20) @ 5.00GHz
<span style="color: #cc0000; font-weight: bold;">      -odmmmmmmmmmmmmmdo-</span>     <span style="color: #8be9fd; font-weight: bold;">GPU:</span> NVIDIA GeForce RTX 4060 Mobile
<span style="color: #cc0000; font-weight: bold;">        ./yhdmmmmmdhy/.</span>       <span style="color: #8be9fd; font-weight: bold;">Memory:</span> 5742MiB / 15720MiB (36%)
<span style="color: #cc0000; font-weight: bold;">           \`.-/::-.\`</span>
`;
            printLine(neofetchOutput);
            break;

        case 'cat':
            const target = args[1];
            if (!target) {
                printLine('cat: missing operand. Usage: cat [filename]', 'terminal-error');
            } else if (target === 'resume.tex') {
                const textarea = document.getElementById('overleaf-latex-input');
                const content = textarea ? textarea.value : '% LaTeX source code';
                printLine(escapeHTML(content));
            } else if (files[target] !== undefined) {
                if (target.startsWith('open_') || target === 'about_me.txt') {
                    printLine(files[target]);
                    if (target === 'open_projects.sh') openAppWindow('libreoffice');
                    else if (target === 'open_resume.sh') openAppWindow('pdfviewer');
                    else if (target === 'open_vscode.sh') openAppWindow('vscode');
                    else if (target === 'open_calculator.sh') openAppWindow('calculator');
                } else {
                    printLine(files[target]);
                }
            } else {
                printLine(`cat: ${target}: No such file or directory`, 'terminal-error');
            }
            break;
 
        case './open_projects.sh':
        case 'libreoffice':
            printLine('Launching LibreOffice Writer...', 'terminal-info');
            openAppWindow('libreoffice');
            break;
 
        case './open_resume.sh':
        case 'evince':
        case 'pdf':
            printLine('Launching Evince Document Viewer...', 'terminal-info');
            openAppWindow('pdfviewer');
            break;

        case './open_vscode.sh':
        case 'code':
        case 'vscode':
            printLine('Launching VS Code editor...', 'terminal-info');
            openAppWindow('vscode');
            break;

        case './open_calculator.sh':
        case 'calculator':
            printLine('Launching Desktop Calculator...', 'terminal-info');
            openAppWindow('calculator');
            break;

        case 'clear':
            displayContainer.innerHTML = '';
            break;

        case 'whoami':
            printLine(window.resumeData ? window.resumeData.name.toLowerCase().replace(/\s+/g, '') : 'souranil');
            break;

        case 'date':
            printLine(new Date().toString());
            break;

        case 'git':
            if (args[1] === 'status') {
                printLine(`
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   about_me.txt
	modified:   resume.tex

no changes added to commit (use "git add" and/or "git commit -a")
                `);
            } else {
                printLine('git: commands outside of status are disabled on this workstation.', 'terminal-warning');
            }
            break;

        default:
            printLine(`zsh: command not found: ${cmd}. Type 'help' for options.`, 'terminal-error');
            break;
    }

    // Scroll to bottom
    const terminalBody = displayContainer.parentElement;
    terminalBody.scrollTop = terminalBody.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
