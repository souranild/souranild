/**
 * boot.js — Red Hat GRUB → systemd boot → Login card
 * Shown on first visit (sessionStorage flag so it shows each session,
 * but use localStorage if you only want it once ever).
 *
 * Phases:
 *   1. GRUB menu with 5-second countdown (or Enter to skip immediately)
 *   2. Scrolling systemd-style boot log
 *   3. Login card with profile photo, bio, and "Enter Workstation" button
 *   4. Overlay fades out → desktop revealed
 */

// ─── Systemd boot log lines ────────────────────────────────────────────
// format: [status, message, time_ms]
// status: 'ok' | 'info' | 'fail'
const BOOT_LINES = [
    ['info', 'Starting Red Hat Enterprise Linux 9.4...', 10],
    ['ok',   'Reached target Basic System.', 80],
    ['ok',   'Started Restore /run/initramfs on shutdown.', 60],
    ['ok',   'Started dracut pre-trigger hook.', 55],
    ['ok',   'Reached target Initrd Default Target.', 70],
    ['info', 'Starting NXP DV-Workstation kernel modules...', 90],
    ['ok',   'Loaded kernel module: cadence_xcelium.ko', 120],
    ['ok',   'Loaded kernel module: nxp_ethernet.ko', 85],
    ['ok',   'Loaded kernel module: jtag_debug.ko', 95],
    ['ok',   'Started systemd-udevd - Kernel Device Manager.', 60],
    ['ok',   'Started Journal Service.', 45],
    ['ok',   'Mounted /proc/sys/fs/binfmt_misc.', 55],
    ['ok',   'Started Flush Journal to Persistent Storage.', 70],
    ['ok',   'Reached target Local File Systems.', 80],
    ['info', 'Starting Network Interface Initialization...', 110],
    ['ok',   'Started Network Manager.', 130],
    ['ok',   'Reached target Network.', 55],
    ['ok',   'Started OpenSSH server daemon.', 90],
    ['ok',   'Started CUPS Scheduler.', 60],
    ['info', 'Initializing Cadence Verification Engine...', 150],
    ['ok',   'Cadence Xcelium 23.09 simulation core ready.', 180],
    ['ok',   'Verisium Debug server bound to :4444.', 95],
    ['ok',   'SystemVerilog UVM 1.2 runtime loaded.', 110],
    ['info', 'Loading portfolio workspace...', 120],
    ['ok',   'Mounted /home/souranil/portfolio (ext4).', 80],
    ['ok',   'Desktop environment MATE 1.26.0 started.', 140],
    ['ok',   'Reached target Graphical Interface.', 60],
    ['ok',   'System initialized. Welcome, souranil.', 100],
];

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Synthesised RHEL startup chime — played when the user enters the workstation.
 * Uses Web Audio API only, no audio file needed.
 * Warm ascending 4-note sequence: C4 → E4 → G4 → C5
 */
function playStartupChime() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // notes: [frequency Hz, start offset s, duration s, gain peak]
        const notes = [
            [261.63, 0.00, 0.55, 0.18],   // C4
            [329.63, 0.18, 0.55, 0.18],   // E4
            [392.00, 0.36, 0.60, 0.20],   // G4
            [523.25, 0.54, 1.10, 0.22],   // C5  (holds longest)
        ];

        notes.forEach(([freq, start, dur, peak]) => {
            // Main tone — sine wave
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

            gain.gain.setValueAtTime(0, ctx.currentTime + start);
            gain.gain.linearRampToValueAtTime(peak, ctx.currentTime + start + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur + 0.05);

            // Subtle harmonic shimmer — triangle an octave up, very quiet
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime + start);
            gain2.gain.setValueAtTime(0, ctx.currentTime + start);
            gain2.gain.linearRampToValueAtTime(peak * 0.06, ctx.currentTime + start + 0.04);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur * 0.7);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + start);
            osc2.stop(ctx.currentTime + start + dur);
        });

        // Close context after chime finishes to free resources
        setTimeout(() => ctx.close(), 2200);
    } catch (e) {
        // Web Audio not available — silently ignore
    }
}

function dismissBoot() {
    const overlay = document.getElementById('boot-overlay');
    if (!overlay) return;
    // Play chime first, then fade the overlay
    playStartupChime();
    overlay.classList.add('boot-dismissed');
    // Remove from DOM after fade, then refocus the terminal input
    setTimeout(() => {
        overlay.remove();
        const termInput = document.getElementById('zsh-input');
        if (termInput) termInput.focus();
    }, 700);
}

function showPhase(id) {
    document.querySelectorAll('.boot-phase').forEach(el => {
        el.style.display = 'none';
    });
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
}

// ─── Phase 1: GRUB countdown ─────────────────────────────────────────────
function runGrub() {
    showPhase('boot-grub');
    const timerEl = document.getElementById('grub-timer');
    let count = 2;
    if (timerEl) timerEl.textContent = count;
    let proceeded = false;

    const proceed = () => {
        if (proceeded) return;
        proceeded = true;
        clearInterval(interval);
        overlay.removeEventListener('keydown', keyHandler);
        runBootLog();
    };

    const interval = setInterval(() => {
        count--;
        if (timerEl) timerEl.textContent = count;
        if (count <= 0) proceed();
    }, 1000);

    const keyHandler = (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            proceed();
        }
    };

    // Attach to the overlay element so it works without page-level focus issues
    const overlay = document.getElementById('boot-overlay');
    if (overlay) {
        overlay.addEventListener('keydown', keyHandler);
        // Clicking anywhere on the GRUB screen proceeds
        overlay.addEventListener('click', proceed, { once: true });
        // Make sure it can receive keydown events
        overlay.focus();
    }
}

// ─── Phase 2: systemd log ────────────────────────────────────────────────
function runBootLog() {
    showPhase('boot-log');
    const container = document.getElementById('boot-log-lines');
    if (!container) { runLoginCard(); return; }

    let idx = 0;
    let accumulated = 0;

    function printNext() {
        if (idx >= BOOT_LINES.length) {
            // Brief pause then go to login card
            setTimeout(runLoginCard, 400);
            return;
        }
        const [status, msg, delay] = BOOT_LINES[idx++];
        accumulated += delay;

        const line = document.createElement('div');
        line.className = 'blog-line';

        let badge = '';
        if (status === 'ok')   badge = '<span class="blog-ok">  [  OK  ]</span>';
        if (status === 'fail') badge = '<span class="blog-fail">[ FAILED ]</span>';
        if (status === 'info') badge = '<span class="blog-info">  [ INFO ]</span>';

        // Fake elapsed time (in ms)
        const fakeMs = (accumulated / 1000).toFixed(3);

        line.innerHTML = `${badge}<span class="blog-text">${msg}</span><span class="blog-time">${fakeMs}s</span>`;
        container.appendChild(line);

        // Scroll to bottom
        const logEl = document.getElementById('boot-log');
        if (logEl) logEl.scrollTop = logEl.scrollHeight;

        setTimeout(printNext, Math.max(delay * 0.45, 18));
    }

    printNext();
}

// ─── Phase 3: Login card ─────────────────────────────────────────────────
function runLoginCard() {
    showPhase('boot-login');

    // Trigger the card animation (re-apply so it always animates in)
    const card = document.querySelector('.login-card');
    if (card) {
        card.style.animation = 'none';
        void card.offsetWidth; // force reflow
        card.style.animation = '';
    }

    const enterBtn = document.getElementById('boot-enter-btn');
    const skipBtn  = document.getElementById('boot-skip');
    let finished = false;

    const finish = () => {
        if (finished) return;
        finished = true;
        overlay.removeEventListener('keydown', keyHandler);
        dismissBoot();
    };

    if (enterBtn) enterBtn.addEventListener('click', finish, { once: true });
    if (skipBtn)  skipBtn.addEventListener('click', finish, { once: true });

    // Enter key on login screen
    const keyHandler = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(); }
    };

    const overlay = document.getElementById('boot-overlay');
    if (overlay) {
        overlay.addEventListener('keydown', keyHandler);
        overlay.focus();
    }
}

// ─── Entry point ────────────────────────────────────────────────────────
export function initBootScreen() {
    const overlay = document.getElementById('boot-overlay');
    if (!overlay) return;

    // Show every session. Switch to localStorage to show only once ever.
    const seen = sessionStorage.getItem('boot-seen');
    if (seen) {
        overlay.remove();
        return;
    }
    sessionStorage.setItem('boot-seen', '1');

    // Make overlay focusable and immediately steal focus away from the
    // zsh autofocus input so Enter/Space keypresses are captured here.
    overlay.setAttribute('tabindex', '0');
    overlay.style.outline = 'none';

    // Blur whatever has focus (e.g. the autofocus zsh input)
    if (document.activeElement) document.activeElement.blur();

    // Small delay so the page has rendered, then focus overlay + run GRUB
    setTimeout(() => {
        overlay.focus();
        runGrub();
    }, 80);
}
