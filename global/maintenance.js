function loadMaintenanceCSS() {
    const maintenanceCSS = document.createElement('link');
    maintenanceCSS.rel = 'stylesheet';
    maintenanceCSS.href = chrome.runtime.getURL('global/maintenance.css');
    document.head.appendChild(maintenanceCSS);
}

function checkMaintenancePage() {
    const maintenanceContent = document.querySelector('.login_content');
    if (maintenanceContent && maintenanceContent.textContent.includes('frissítés alatt')) {
        const body = document.body;
        const mainLogo = chrome.runtime.getURL('images/firka_logo_128.png');
        
        
        const existingStyles = document.querySelectorAll('link[rel="stylesheet"], style');
        existingStyles.forEach(style => style.remove());
        
        
        body.innerHTML = '';
        body.classList.add('maintenance-mode');
        body.classList.add('theme-enabled');
        
        
        loadMaintenanceCSS();
        
        
        const container = document.createElement('div');
        container.className = 'maintenance-container';
        
        const logo = document.createElement('img');
        logo.src = mainLogo;
        logo.alt = 'Firka Logo';
        logo.className = 'maintenance-logo';
        
        const title = document.createElement('h1');
        title.className = 'maintenance-title';
        title.textContent = 'Karbantartás';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'maintenance-message';
        
        const paragraph1 = document.createElement('p');
        paragraph1.textContent = 'A KRÉTA rendszer jelenleg frissítés alatt van, hamarosan újra elérhetővé válik.';
        
        const paragraph2 = document.createElement('p');
        paragraph2.textContent = 'Köszönjük türelmüket és megértésüket!';
        
        const footer = document.createElement('div');
        footer.className = 'maintenance-footer';
        footer.textContent = 'KRÉTA Csapat';
        
        
        messageDiv.appendChild(paragraph1);
        messageDiv.appendChild(paragraph2);
        
        container.appendChild(logo);
        container.appendChild(title);
        container.appendChild(messageDiv);
        container.appendChild(footer);
        
        body.appendChild(container);
    }
}

document.addEventListener('DOMContentLoaded', checkMaintenancePage);