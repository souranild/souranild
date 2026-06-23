/**
 * theme.js — Theme switcher for the portfolio OS
 * Supported themes: rhel | kali | ubuntu | win7 | win10
 */

const THEMES = ['rhel', 'kali', 'ubuntu', 'win7', 'win10', 'win11', 'macos'];
const STORAGE_KEY = 'portfolio-theme';

export function initThemeSwitcher() {
    const btn     = document.getElementById('theme-btn');
    const popover = document.getElementById('theme-popover');
    if (!btn || !popover) return;

    // Restore saved theme
    let saved = 'rhel';
    try {
        saved = localStorage.getItem(STORAGE_KEY) || 'rhel';
    } catch (e) {
        console.warn('localStorage read blocked:', e);
    }
    applyTheme(saved);

    // Toggle popover
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = popover.classList.contains('open');
        popover.classList.toggle('open', !isOpen);
        popover.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!document.getElementById('theme-switcher-wrap')?.contains(e.target)) {
            popover.classList.remove('open');
            popover.setAttribute('aria-hidden', 'true');
        }
    });

    // Theme card clicks
    THEMES.forEach(id => {
        const card = document.getElementById(`theme-${id}`);
        if (card) {
            card.addEventListener('click', () => {
                applyTheme(id);
                try {
                    localStorage.setItem(STORAGE_KEY, id);
                } catch (e) {
                    console.warn('localStorage write blocked:', e);
                }
                // Brief delay then close popover
                setTimeout(() => {
                    popover.classList.remove('open');
                    popover.setAttribute('aria-hidden', 'true');
                }, 220);
            });
        }
    });
}

export function applyTheme(id) {
    document.body.setAttribute('data-theme', id);

    // Update active card highlight and checkmarks
    THEMES.forEach(t => {
        const card  = document.getElementById(`theme-${t}`);
        const check = document.getElementById(`check-${t}`);
        if (card)  card.classList.toggle('active', t === id);
        if (check) check.textContent = t === id ? '✓' : '';
    });
}
