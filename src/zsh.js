// ZSH Interactive Terminal Command Simulator with Syntax Highlighting, Autocomplete, and Animating Banner

import { openAppWindow } from './desktop.js';

let displayContainer;
let inputField;
let suggestSpan;

// Live filesystem assets updated dynamically from LaTeX
const files = {
    'about_me.txt': '',
    'projects.odt': 'LibreOffice document projects.odt. Run "./open_projects.sh" or click the LibreOffice icon.',
    'experience.pdf': 'PDF Document experience.pdf. Run "./open_experience.sh" or click the PDF Viewer icon.',
    'research_papers.md': 'Markdown document research_papers.md. Run "./open_vscode.sh" or click the VS Code icon.',
    'open_projects.sh': 'Launcher script for LibreOffice projects.odt. Running...',
    'open_experience.sh': 'Launcher script for experience_resume.pdf. Running...',
    'open_vscode.sh': 'Launcher script for VS Code editor. Running...',
    'open_calculator.sh': 'Launcher script for Calculator app. Running...'
};

const COMMANDS = [
    'help', 'ls', 'clear', 'whoami', 'date', 'git status',
    'libreoffice', 'evince', 'pdf', 'code', 'vscode', 'calculator',
    'cat about_me.txt', 'cat projects.odt', 'cat experience.pdf', 'cat research_papers.md',
    'cat open_projects.sh', 'cat open_experience.sh', 'cat open_vscode.sh',
    './open_projects.sh', './open_experience.sh', './open_vscode.sh', './open_calculator.sh'
];

export function updateZshFiles(resumeData) {
    const skillsList = `  - Languages : ${resumeData.skills.languages}\n  - Frameworks: ${resumeData.skills.frameworks}\n  - Tools     : ${resumeData.skills.tools}`;
    
    files['about_me.txt'] = `
[SYSTEM CORE PROFILE]
====================================================================
NAME        : ${resumeData.name}
ROLE        : ${resumeData.title}
CONTACT     : ${resumeData.contact}
====================================================================

System logic check: ACTIVE
Functional parameters verified: 100%

Core Skills:
${skillsList}

--------------------------------------------------------------------
Type 'help' to view available commands.
`;
}

export function initZsh() {
    displayContainer = document.getElementById('zsh-display');
    inputField = document.getElementById('zsh-input');
    suggestSpan = document.getElementById('zsh-suggest');

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

    // Key handlers for executing commands and autocompleting
    inputField.addEventListener('keydown', (e) => {
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
            
            if (cmd.trim()) {
                executeCommand(cmd.trim());
            }
        }
    });
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
            'evince', 'pdf', 'code', 'vscode', 'calculator', 'cat',
            './open_projects.sh', './open_experience.sh', './open_vscode.sh', './open_calculator.sh'
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
        
        // Animating ASCII Banner
        const asciiArt = `
  ____   ___  _   _ ____   ____  _   _ ___ _     
 / ___| / _ \\| | | |  _ \\ / ___|| \\ | |_ _| |    
 \\___ \\| | | | | | | |_) | |  _ |  \\| | | || |    
  ___) | |_| | |_| |  _ <| |_| || |\\  | | || |___ 
 |____/ \\___/ \\___/|_| \\_\\\\____||_| \\_|___|_____|
        `;
        
        const bannerContainer = document.createElement('pre');
        bannerContainer.style.margin = '1rem 0';
        bannerContainer.style.color = 'var(--rhel-red)';
        bannerContainer.style.fontWeight = 'bold';
        bannerContainer.style.lineHeight = '1.2';
        displayContainer.appendChild(bannerContainer);
        
        const lines = asciiArt.split('\n');
        let currentLine = 0;
        
        // Print logo line-by-line
        function printLogoLine() {
            if (currentLine < lines.length) {
                bannerContainer.textContent += lines[currentLine] + '\n';
                currentLine++;
                const terminalBody = displayContainer.parentElement;
                terminalBody.scrollTop = terminalBody.scrollHeight;
                setTimeout(printLogoLine, 60);
            } else {
                // Animate colors after logo is drawn
                let hue = 0;
                setInterval(() => {
                    hue = (hue + 2) % 360;
                    bannerContainer.style.color = `hsl(${hue}, 90%, 55%)`;
                }, 40);
                
                // Show profile info
                const profileInfo = files['about_me.txt'] || `Loading system profile...`;
                printLine(profileInfo);
            }
        }
        
        printLogoLine();
    }, 400);
}

function executeCommand(commandLine) {
    // Print original prompt line
    const promptRow = document.createElement('div');
    promptRow.className = 'prompt-line';
    promptRow.innerHTML = `
        <span class="zsh-prompt">➜  <span class="zsh-dir">portfolio</span> <span class="zsh-git">git:(<span class="git-branch">main</span>)</span> <span class="zsh-cross">✗</span> </span>
        <span class="prompt-cmd">${escapeHTML(commandLine)}</span>
    `;
    displayContainer.appendChild(promptRow);

    const args = commandLine.split(' ');
    const cmd = args[0].toLowerCase();

    switch (cmd) {
        case 'help':
            printLine(`
Available commands:
  ls                      - Lists available files in directory
  cat [file]              - Prints content of text files (e.g. cat about_me.txt)
  clear                   - Clears the terminal screen
  whoami                  - Prints active user identity
  date                    - Prints local workstation timestamp
  git status              - Inspects git repo coverage status
  libreoffice             - Launches LibreOffice Projects application
  evince / pdf            - Launches PDF Resume experiences application
  code / vscode           - Launches VS Code papers application
  calculator              - Launches desktop Calculator application
  help                    - Prints this helper panel
            `);
            break;
            
        case 'ls':
            printLine(`
-rw-r--r--  1  souranil  staff   1.2K  about_me.txt
-rw-r--r--  1  souranil  staff   2.5K  projects.odt
-rw-r--r--  1  souranil  staff   3.1K  experience.pdf
-rw-r--r--  1  souranil  staff   1.8K  research_papers.md
-rwxr-xr-x  1  souranil  staff   150B  open_projects.sh
-rwxr-xr-x  1  souranil  staff   150B  open_experience.sh
-rwxr-xr-x  1  souranil  staff   150B  open_vscode.sh
-rwxr-xr-x  1  souranil  staff   150B  open_calculator.sh
            `);
            break;

        case 'cat':
            const targetFile = args[1];
            if (!targetFile) {
                printLine('cat: missing operand. Usage: cat [filename]', 'terminal-error');
            } else if (files[targetFile] !== undefined) {
                if (targetFile.startsWith('open_') || targetFile === 'about_me.txt') {
                    printLine(files[targetFile]);
                    // Trigger launch for script files
                    if (targetFile === 'open_projects.sh') openAppWindow('libreoffice');
                    else if (targetFile === 'open_experience.sh') openAppWindow('pdfviewer');
                    else if (targetFile === 'open_vscode.sh') openAppWindow('vscode');
                    else if (targetFile === 'open_calculator.sh') openAppWindow('calculator');
                } else {
                    printLine(files[targetFile]);
                }
            } else {
                printLine(`cat: ${targetFile}: No such file or directory`, 'terminal-error');
            }
            break;

        case './open_projects.sh':
        case 'libreoffice':
            printLine('Launching LibreOffice Writer...', 'terminal-info');
            openAppWindow('libreoffice');
            break;

        case './open_experience.sh':
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
