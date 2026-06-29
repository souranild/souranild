/**
 * theme.js — OS Theme application and Power Off control
 * Supported themes: rhel | kali | ubuntu | win7 | win10
 */

const THEMES = ['rhel', 'kali', 'ubuntu', 'win7', 'win10', 'win11', 'macos'];
const STORAGE_KEY = 'portfolio-theme';

export function initPowerOff() {
    const btn = document.getElementById('power-btn');
    if (!btn) return;

    // Restore saved theme on initial load
    let saved = 'rhel';
    try {
        saved = localStorage.getItem(STORAGE_KEY) || 'rhel';
    } catch (e) {
        console.warn('localStorage read blocked:', e);
    }
    applyTheme(saved);

    // Power off logic
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Create a blackout overlay for shutdown animation
        const blackout = document.createElement('div');
        blackout.style.position = 'fixed';
        blackout.style.inset = '0';
        blackout.style.backgroundColor = '#000';
        blackout.style.zIndex = '999999';
        blackout.style.opacity = '0';
        blackout.style.transition = 'opacity 0.6s ease';
        document.body.appendChild(blackout);
        
        // Trigger reflow to ensure transition runs
        void blackout.offsetWidth;
        blackout.style.opacity = '1';

        // Clear boot-seen so the GNU screen shows again, then reload
        setTimeout(() => {
            try {
                sessionStorage.removeItem('boot-seen');
            } catch (e) {
                console.warn('sessionStorage write blocked:', e);
            }
            window.location.reload();
        }, 700);
    });
}

export function applyTheme(id) {
    document.body.setAttribute('data-theme', id);
}
