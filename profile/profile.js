(() => {
    function getCookie(name) {
      const cookieName = `${name}=`;
      const decodedCookie = decodeURIComponent(document.cookie);
      const cookieArray = decodedCookie.split(';');
      
      for(let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1);
        }
        if (cookie.indexOf(cookieName) === 0) {
          return cookie.substring(cookieName.length, cookie.length);
        }
      }
      return null;
    }
  
    function shortenSchoolName(name) {
      if (!name) return '';
      const maxLength = 30;
      if (name.length <= maxLength) return name;
      
      const parts = name.split(' - ');
      if (parts.length === 2) {
        const [code, fullName] = parts;
        return `${code} - ${fullName.substring(0, maxLength - code.length - 5)}...`;
      }
      return name.substring(0, maxLength - 3) + '...';
    }
  
    function createSecurityTab() {
      return `
        <div class="security-content">
          <div class="setup-steps">
            <div class="step-card">
              <h3>1. lépés: Hitelesítési alkalmazás telepítése</h3>
              <p>A kétfaktoros hitelesítés használatához telepítsen egy időalapú, egyszer használatos jelszó (TOTP) alkalmazást:</p>
              
              <div class="app-grid">
                <div class="app-section">
                  <h4>Android</h4>
                  <div class="app-links">
                    <a href="https://play.google.com/store/apps/details?id=hu.innobile.niszauth" target="_blank" class="app-link">
                      <span class="material-icons-round">download</span>
                      NISZ Hitelesítő
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.azure.authenticator" target="_blank" class="app-link">
                      <span class="material-icons-round">download</span>
                      Microsoft Authenticator
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" class="app-link">
                      <span class="material-icons-round">download</span>
                      Google Authenticator
                    </a>
                  </div>
                </div>
                
                <div class="app-section">
                  <h4>iPhone</h4>
                  <div class="app-links">
                    <a href="https://apps.apple.com/hu/app/nisz-hiteles%C3%ADt%C5%91/id1603444961" target="_blank" class="app-link">
                      <span class="material-icons-round">download</span>
                      NISZ Hitelesítő
                    </a>
                    <a href="https://apps.apple.com/hu/app/microsoft-authenticator/id983156458" target="_blank" class="app-link">
                      <span class="material-icons-round">download</span>
                      Microsoft Authenticator
                    </a>
                    <a href="https://apps.apple.com/hu/app/google-authenticator/id388497605" target="_blank" class="app-link">
                      <span class="material-icons-round">download</span>
                      Google Authenticator
                    </a>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="step-card">
              <h3>2. lépés: Kétfaktoros azonosítás beállítása</h3>
              <div class="setup-form">
                <div class="form-group">
                  <button type="button" class="btn-save" id="enable2FA">Kétfaktoros azonosítás bekapcsolása</button>
                </div>
                
                <div id="qrSetup" style="display: none;">
                  <div class="qr-container">
                    <img id="qrCode" alt="QR kód" style="display: none;">
                    <div class="setup-key">
                      <label class="form-label">Biztonsági kulcs:</label>
                      <div class="key-display">
                        <code id="secretKey"></code>
                        <button type="button" class="btn-copy" id="copyKey">
                          <span class="material-icons-round">content_copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
  
                  <div class="form-group">
                    <label class="form-label" for="verificationCode">Ellenőrző kód</label>
                    <input type="text" class="form-control" id="verificationCode" maxlength="6" placeholder="123456">
                    <small class="form-text">Adja meg a hitelesítő alkalmazásban megjelenő 6 számjegyű kódot.</small>
                  </div>
  
                  <div class="form-group">
                    <button type="button" class="btn-save" id="verify2FA">Ellenőrzés és aktiválás</button>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="step-card" id="backupCodes" style="display: none;">
              <h3>3. lépés: Biztonsági kódok mentése</h3>
              <p>Az alábbi biztonsági kódokat használhatja bejelentkezéshez, ha nem fér hozzá a hitelesítő alkalmazásához. Minden kód csak egyszer használható.</p>
              
              <div class="backup-codes">
                <pre id="backupCodesList"></pre>
                <button type="button" class="btn-save" id="downloadCodes">
                  <span class="material-icons-round">download</span>
                  Kódok letöltése
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  
  function createContactTab() {
      return `
        <div class="contact-form">
          <div class="form-group">
            <label class="form-label" for="email">E-mail cím</label>
            <input type="email" class="form-control" id="email" required>
            <small class="form-text">Az e-mail cím megadása a jelszó emlékeztető miatt szükséges.</small>
          </div>
          <div class="form-group">
            <label class="form-label" for="phone">Telefonszám</label>
            <input type="tel" class="form-control" id="phone" placeholder="+36 xx xxx xxxx">
            <small class="form-text">A telefonszám megadása nem kötelező.</small>
          </div>
          <div class="form-group">
            <button type="button" class="btn-save" id="saveContacts">Mentés</button>
          </div>
        </div>
      `;
    }
  
    function createPasswordTab() {
      return `
        <div class="password-form">
          <div class="form-group">
            <label class="form-label" for="currentPassword">Jelenlegi jelszó</label>
            <input type="password" class="form-control" id="currentPassword" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="newPassword">Új jelszó</label>
            <input type="password" class="form-control" id="newPassword" required minlength="8">
            <small class="form-text">A jelszónak legalább 8 karakter hosszúnak kell lennie.</small>
          </div>
          <div class="form-group">
            <label class="form-label" for="confirmPassword">Új jelszó megerősítése</label>
            <input type="password" class="form-control" id="confirmPassword" required>
          </div>
          <div class="form-group">
            <button type="button" class="btn-save" id="savePassword">Jelszó módosítása</button>
          </div>
        </div>
      `;
    }
  
    function createSettingsTab() {
      return `
        <div class="settings-form">
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="hideTips"> 
              Tippek elrejtése
            </label>
            <small class="form-text">A tippek megjelenítésének ki/be kapcsolása.</small>
          </div>
          <div class="form-group">
            <button type="button" class="btn-save" id="saveSettings">Mentés</button>
          </div>
        </div>
      `;
    }
  
    function setupContactForm() {
      const form = document.querySelector('.contact-form');
      if (!form) return;
  
      const emailInput = form.querySelector('#email');
      const phoneInput = form.querySelector('#phone');
      const saveButton = form.querySelector('#saveContacts');
  
      
      emailInput.value = getCookie('userEmail') || '';
      phoneInput.value = getCookie('userPhone') || '';
  
      saveButton?.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
  
        if (!email) {
          alert('Az e-mail cím megadása kötelező!');
          return;
        }
  
        if (email && !isValidEmail(email)) {
          alert('Kérjük, adjon meg egy érvényes e-mail címet!');
          return;
        }
  
        if (phone && !isValidPhone(phone)) {
          alert('Kérjük, adjon meg egy érvényes telefonszámot!');
          return;
        }
  
        try {
          const response = await fetch('/Adminisztracio/Profil/SaveElerhetosegek', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
            },
            body: JSON.stringify({ email, phone })
          });
  
          if (response.ok) {
            alert('Elérhetőségek sikeresen mentve!');
          } else {
            throw new Error('Hiba történt a mentés során.');
          }
        } catch (error) {
          console.error('Error saving contacts:', error);
          alert('Hiba történt a mentés során. Kérjük, próbálja újra később.');
        }
      });
    }
  
    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  
    function isValidPhone(phone) {
      return /^\+?[0-9\s-]{9,}$/.test(phone);
    }
  
    function setupEventListeners() {
      
      document.querySelectorAll('.tab-header').forEach(header => {
        header.addEventListener('click', () => {
          document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          
          header.classList.add('active');
          const targetId = header.dataset.tab;
          document.getElementById(`${targetId}-content`).classList.add('active');
        });
      });
  
      
      const userBtn = document.querySelector('.user-dropdown-btn');
      const userDropdown = document.querySelector('.user-dropdown');
      
      userBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown?.classList.toggle('show');
      });
  
      document.addEventListener('click', () => {
        userDropdown?.classList.remove('show');
      });
  
      
      document.getElementById('saveSettings')?.addEventListener('click', async () => {
        const hideTips = document.getElementById('hideTips').checked;
        
        try {
          const response = await fetch('/Adminisztracio/Profil/SaveTippekBeallitasa', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
            },
            body: JSON.stringify({ hideTips })
          });
  
          if (response.ok) {
            alert('Beállítások sikeresen mentve! A változtatások érvényesítéséhez jelentkezzen be újra.');
          } else {
            throw new Error('Hiba történt a mentés során.');
          }
        } catch (error) {
          console.error('Error saving settings:', error);
          alert('Hiba történt a mentés során. Kérjük, próbálja újra később.');
        }
      });
  
      
      document.getElementById('savePassword')?.addEventListener('click', async () => {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
  
        if (!currentPassword || !newPassword || !confirmPassword) {
          alert('Kérjük, töltse ki az összes mezőt!');
          return;
        }
  
        if (newPassword !== confirmPassword) {
          alert('Az új jelszavak nem egyeznek!');
          return;
        }
  
        if (newPassword.length < 8) {
          alert('Az új jelszónak legalább 8 karakter hosszúnak kell lennie!');
          return;
        }
  
        try {
          const response = await fetch('/Adminisztracio/Profil/SaveJelszoModositas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]').value
            },
            body: JSON.stringify({
              currentPassword,
              newPassword,
              confirmPassword
            })
          });
  
          if (response.ok) {
            alert('Jelszó sikeresen módosítva!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
          } else {
            throw new Error('Hiba történt a jelszó módosítása során.');
          }
        } catch (error) {
          console.error('Error changing password:', error);
          alert('Hiba történt a jelszó módosítása során. Kérjük, próbálja újra később.');
        }
      });
  
      
      const timerEl = document.getElementById('logoutTimer');
      if (timerEl) {
        const startTime = parseInt(timerEl.textContent?.match(/\d+/)?.[0] || "45");
        let timeLeft = startTime * 60;
        
        const updateTimer = () => {
          const minutes = Math.floor(timeLeft / 60);
          const seconds = timeLeft % 60;
          timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          
          if (timeLeft <= 0) {
            window.location.href = '/Home/Logout';
          } else {
            timeLeft--;
          }
        };
  
        updateTimer();
        setInterval(updateTimer, 1000);
      }
    }
  
    function createProfileHTML(data) {
      const schoolNameFull = `${data.schoolInfo.id} - ${data.schoolInfo.name}`;
      const shortenedSchoolName = shortenSchoolName(schoolNameFull);
  
      return `
        <div class="kreta-container">
          <header class="kreta-header">
            <div class="school-info">
              <p class="logo-text">
                <img src=${chrome.runtime.getURL('images/firka_logo.png')} alt="Firka" class="logo">
                Firka
              </p>
              <div class="school-details" title="${schoolNameFull}">
                ${shortenedSchoolName}
              </div>
            </div>
            
            <nav class="kreta-nav">
              <div class="nav-links">
                <a href="/Intezmeny/Faliujsag">
                  <span class="material-icons-round">calendar_today</span>
                  Kezdőlap
                </a>
                <a href="/TanuloErtekeles/Osztalyzatok">
                  <span class="material-icons-round">bookmark_border</span>
                  Jegyek
                </a>
                <a href="/Orarend/InformaciokOrarend">
                  <span class="material-icons-round">home</span>
                  Órarend
                </a>
                <a href="/Hianyzas/Hianyzasok">
                  <span class="material-icons-round">schedule</span>
                  Hiányok
                </a>
              </div>
            </nav>
  
            <div class="user-profile">
              <button class="user-dropdown-btn">
                <div class="user-info">
                  <span class="user-name">${data.userData.name}</span>
                  <span class="user-time" id="logoutTimer">${data.userData.time}</span>
                </div>
              </button>
              <div class="user-dropdown">
                <a href="/Adminisztracio/Profil" class="dropdown-item">
                  <span class="material-icons-round">person</span>
                  Profil
                </a>
                <a href="#" class="dropdown-item" id="settingsBtn">
                  <span class="material-icons-round">settings</span>
                  Beállítások
                </a>
                <a href="/Home/Logout" class="dropdown-item">
                  <span class="material-icons-round">logout</span>
                  Kijelentkezés
                </a>
              </div>
            </div>
          </header>
  
          <main class="kreta-main">
            <div class="card">
              <h2>Profil beállítások</h2>
              <div class="profile-tabs">
                <div class="tab-headers">
                  <button class="tab-header active" data-tab="settings">Beállítások</button>
                  <button class="tab-header" data-tab="password">Jelszó módosítása</button>
                  <button class="tab-header" data-tab="security">Biztonsági beállítások</button>
                  <button class="tab-header" data-tab="contacts">Elérhetőségek</button>
                </div>
  
                <div id="settings-content" class="tab-content active">
                  ${createSettingsTab()}
                </div>
  
                <div id="password-content" class="tab-content">
                  ${createPasswordTab()}
                </div>
  
                <div id="security-content" class="tab-content">
                  ${createSecurityTab()}
                </div>
  
                <div id="contacts-content" class="tab-content">
                  ${createContactTab()}
                </div>
              </div>
            </div>
          </main>
        </div>
      `;
    }
  
    async function init() {
      if (window.location.pathname.includes('/Adminisztracio/Profil')) {
        
        const links = [
          { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
          { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
          { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap' },
          { rel: 'stylesheet', href: 'https://fonts.googleapis.com/icon?family=Material+Icons+Round' }
        ];
  
        links.forEach(link => {
          const linkElement = document.createElement('link');
          Object.entries(link).forEach(([key, value]) => {
            linkElement[key] = value;
          });
          document.head.appendChild(linkElement);
        });
  
        const userData = {
          schoolInfo: {
            name: getCookie('schoolName') || 'Iskola',
            id: getCookie('schoolCode') || ''
          },
          userData: {
            name: getCookie('userName') || 'Felhasználó',
            time: document.querySelector('.usermenu_timer')?.textContent?.trim() || '45:00',
            email: getCookie('userEmail') || ''
          }
        };
  
        document.body.innerHTML = createProfileHTML(userData);
        setupEventListeners();
        setupContactForm();
      }
    }
  
    init();
})();