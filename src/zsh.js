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
    'libreoffice', 'evince', 'pdf', 'code', 'vscode', 'calculator', 'neofetch',
    'cat about_me.txt', 'cat projects.odt', 'cat experience.pdf', 'cat research_papers.md',
    'cat open_projects.sh', 'cat open_experience.sh', 'cat open_vscode.sh',
    './open_projects.sh', './open_experience.sh', './open_vscode.sh', './open_calculator.sh',
    'pwd', 'cd', 'uname -a', 'uptime', 'history', 'sudo', 'cowsay'
];

export function updateZshFiles(resumeData) {
    const skillsList = `  <span style="color: #ffb86c; font-weight: bold;">• Languages :</span> <span style="color: #f8f8f2;">${resumeData.skills.languages}</span>
  <span style="color: #ffb86c; font-weight: bold;">• Frameworks:</span> <span style="color: #f8f8f2;">${resumeData.skills.frameworks}</span>
  <span style="color: #ffb86c; font-weight: bold;">• Tools     :</span> <span style="color: #f8f8f2;">${resumeData.skills.tools}</span>`;
    
    files['about_me.txt'] = `
<span style="color: #50fa7b; font-weight: bold;">[SYSTEM CORE PROFILE]</span>
<span style="color: #6272a4;">====================================================================</span>
<span style="color: #8be9fd; font-weight: bold;">NAME</span>        : <span style="color: #f8f8f2; font-weight: bold;">${resumeData.name}</span>
<span style="color: #8be9fd; font-weight: bold;">ROLE</span>        : <span style="color: #f8f8f2;">${resumeData.title}</span>
<span style="color: #8be9fd; font-weight: bold;">CONTACT     :</span> <span style="color: #ff79c6;">${resumeData.contact}</span>
<span style="color: #6272a4;">====================================================================</span>

<span style="color: #50fa7b;">✔ System logic check:</span> <span style="color: #f8f8f2; font-weight: bold; background: #282a36; padding: 0 4px; border-radius: 2px;">ACTIVE</span>
<span style="color: #50fa7b;">✔ Functional parameters verified:</span> <span style="color: #f8f8f2; font-weight: bold; background: #282a36; padding: 0 4px; border-radius: 2px;">100%</span>

<span style="color: #bd93f9; font-weight: bold; text-decoration: underline;">CORE SKILLS:</span>
${skillsList}

<span style="color: #6272a4;">--------------------------------------------------------------------</span>
Type <span style="color: #50fa7b; font-weight: bold;">'help'</span> to view available console simulation commands.
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

// Programmatic command trigger (e.g. from workspaces manager)
export function runZshCommand(commandLine) {
    if (!displayContainer) {
        displayContainer = document.getElementById('zsh-display');
    }
    if (displayContainer) {
        executeCommand(commandLine);
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
            './open_projects.sh', './open_experience.sh', './open_vscode.sh', './open_calculator.sh',
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
        
        // Animating ASCII Banner (Spelled SOURANIL correctly)
        const asciiArt = `
 ____   ___  _   _ ____    _   _   _ ___ _     
/ ___| / _ \\\\| | | |  _ \\\\  / \\\\ | \\\\ | |_ _| |    
\\___ \\\\| | | | | | | |_) |/ _ \\\\|  \\\\| | | || |    
 ___) | |_| | |_| |  _ </ ___ \\\\ |\\\\  | | || |___ 
|____/ \\___/ \\___/|_| \\_/_/   \\_\\_|_| \\_|___|_____|
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
                
                // Print animating space shuttle rocket below text profile
                const rocketContainer = document.createElement('pre');
                rocketContainer.style.margin = '1rem 0';
                rocketContainer.style.color = '#8be9fd';
                rocketContainer.style.fontFamily = 'var(--font-mono)';
                rocketContainer.style.fontSize = '0.75rem';
                rocketContainer.style.lineHeight = '1.1';
                displayContainer.appendChild(rocketContainer);
                
                const rocketFrames = [
                    `*          /\\\\          +
          /  \\\\
   +     /____\\\\     .
        |      |
  .     |      |
        |      |    *
       /|      |\\\\
 *    / |======| \\\\
     /  |      |  \\\\    .
    |  /|      |\\\\  |
 +  | / |      | \\\\ |
    |/  |______|  \\\\|   +
        /      \\\\
       /        \\\\
       (  ) ( ) (  )
      (    )   )   )
       (  (   )   )`,
                    `    +      /\\\\        *
  .       /  \\\\    .
         /____\\\\
   *    |      |
        |      |   +
  .     |      |
       /|      |\\\\   .
      / |======| \\\\
 +   /  |      |  \\\\
    |  /|      |\\\\  |   *
    | / |      | \\\\ |
    |/  |______|  \\\\|
        /      \\\\  +
       /        \\\\
        )  (  )  (
       (    )  )  )
        )  (  (  (`,
                    ` .         /\\\\      +
   *      /  \\\\
         /____\\\\     .
  +     |      |
        |      |
        |      |    *
       /|      |\\\\
      / |======| \\\\   +
     /  |      |  \\\\
    |  /|      |\\\\  |
 *  | / |      | \\\\ |  .
    |/  |______|  \\\\|
        /      \\\\
       /        \\\\
       |  | |  |  |
       \\\\  / \\\\  /  /
        \\\\/   \\\\/  /`
                ];
                
                let frameIdx = 0;
                const intervalId = setInterval(() => {
                    if (!document.body.contains(rocketContainer)) {
                        clearInterval(intervalId);
                        return;
                    }
                    rocketContainer.textContent = rocketFrames[frameIdx];
                    frameIdx = (frameIdx + 1) % rocketFrames.length;
                }, 150);
            }
        }
        
        printLogoLine();
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
            } else if (files[target] !== undefined) {
                if (target.startsWith('open_') || target === 'about_me.txt') {
                    printLine(files[target]);
                    if (target === 'open_projects.sh') openAppWindow('libreoffice');
                    else if (target === 'open_experience.sh') openAppWindow('pdfviewer');
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
