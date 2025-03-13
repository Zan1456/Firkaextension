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

function shortenSchoolName(name, maxLength = 50) {
  if (!name) return '';
  if (name.length <= maxLength) return name;
  
  const parts = name.split(' - ');
  if (parts.length === 2) {
    const [code, fullName] = parts;
    if (fullName.length > maxLength - code.length - 3) {
      return `${code} - ${fullName.substring(0, maxLength - code.length - 6)}...`;
    }
  }
  return name.substring(0, maxLength - 3) + '...';
}

async function waitForElement(selector) {
  return new Promise(resolve => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

async function collectAbsencesData() {
  await waitForElement('#HianyzasGrid');
  await new Promise(resolve => setTimeout(resolve, 1000));

  const basicData = {
    schoolInfo: {
      name: getCookie('schoolName') || 'Iskola',
      id: getCookie('schoolCode') || ''
    },
    userData: {
      name: getCookie('userName') || 'Felhasználó',
      time: document.querySelector('.usermenu_timer')?.textContent?.trim() || '45:00'
    }
  };

  const absences = [];
  const rows = document.querySelectorAll('#HianyzasGrid .k-grid-content tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 9) {
      absences.push({
        date: cells[1]?.textContent?.trim() || '',
        lesson: cells[2]?.textContent?.trim() || '',
        subject: cells[3]?.textContent?.trim() || '',
        topic: cells[4]?.textContent?.trim() || '',
        type: cells[5]?.textContent?.trim() || '',
        justified: cells[6]?.textContent?.trim() === 'Igen',
        justificationStatus: cells[6]?.textContent?.trim() === 'Igen' ? 'justified' : 
                            cells[6]?.textContent?.trim() === 'Nem' ? 'unjustified' : 'pending',
        purposeful: cells[7]?.textContent?.trim() || '',
        justificationType: cells[8]?.textContent?.trim() || ''
      });
    }
  });

  const groupedAbsences = {};
  absences.forEach(absence => {
    if (!groupedAbsences[absence.date]) {
      groupedAbsences[absence.date] = [];
    }
    groupedAbsences[absence.date].push(absence);
  });

  return { basicData, absences, groupedAbsences };
}

function showLoadingScreen() {
  const loadingHTML = `
    <div class="loading-overlay">
      <div class="loading-container">
        <img src="https://i.imgur.com/JE3LzRc.gif" alt="Firka" class="loading-logo"><!--logó csere-->
        <div class="loading-text">Betöltés alatt...</div>
        <p class="loading-text2">Kis türelmet</p>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideLoadingScreen() {
  const loadingOverlay = document.querySelector('.loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.opacity = '0';
    loadingOverlay.style.transition = 'opacity 0.3s ease';
    setTimeout(() => loadingOverlay.remove(), 300);
  }
}

async function transformAbsencesPage() {
  showLoadingScreen();
  const { basicData, absences, groupedAbsences } = await collectAbsencesData();

  
  const schoolNameFull = `${basicData.schoolInfo.id} - ${basicData.schoolInfo.name}`;
  const shortenedSchoolName = shortenSchoolName(schoolNameFull);

  document.body.innerHTML = `
    <div class="kreta-container">
      <header class="kreta-header">
        <div class="school-info">
          <p class="logo-text">
            <img src="${chrome.runtime.getURL('images/firka_logo.png')}" alt="Firka" class="logo">
            Firka
          </p>
          <div class="school-details" title="${schoolNameFull}">
            ${shortenedSchoolName}
          </div>
        </div>
        
        <nav class="kreta-nav">
          <div class="nav-links">
            <a href="/Intezmeny/Faliujsag" data-page="dashboard" class="nav-item">
              <img src="${chrome.runtime.getURL('icons/dashboard-inactive.svg')}" alt="Kezdőlap">
              Kezdőlap
            </a>
            <a href="/TanuloErtekeles/Osztalyzatok" data-page="grades" class="nav-item">
              <img src="${chrome.runtime.getURL('icons/grades-inactive.svg')}" alt="Jegyek">
              Jegyek
            </a>
            <a href="/Orarend/InformaciokOrarend" data-page="timetable" class="nav-item">
              <img src="${chrome.runtime.getURL('icons/timetable-inactive.svg')}" alt="Órarend">
              Órarend
            </a>
            <a href="/Hianyzas/Hianyzasok" data-page="absences" class="nav-item active">
              <img src="${chrome.runtime.getURL('icons/absences-active.svg')}" alt="Mulasztások">
              Mulasztások
            </a>
            <a href="/Tanulo/TanuloHaziFeladat" data-page="other" class="nav-item">
              <img src="${chrome.runtime.getURL('icons/others.svg')}" alt="Egyéb">
              Egyéb
            </a>
          </div>
        </nav>

        <div class="user-profile">
          <button class="user-dropdown-btn">
            <div class="user-info">
              <span class="user-name">${basicData.userData.name}</span>
              <span class="nav-logout-timer" id="logoutTimer">${basicData.userData.time}</span>
            </div>
          </button>
          <div class="user-dropdown">
            <a href="/Adminisztracio/Profil" data-page="profile" class="dropdown-item">
              <img src="${chrome.runtime.getURL('icons/profile.svg')}" alt="Profil">
              Profil
            </a>
            <a href="#" class="dropdown-item" id="settingsBtn">
              <img src="${chrome.runtime.getURL('icons/settings.svg')}" alt="Beállítások">
              Beállítások
            </a>
            <a href="/Home/Logout" data-page="logout" class="dropdown-item">
              <img src="${chrome.runtime.getURL('icons/logout.svg')}" alt="Kijelentkezés">
              Kijelentkezés
            </a>
          </div>
        </div>
      </header>

      <main class="kreta-main">
        <div class="filter-card">
          <div class="filter-header">
            <h2>Szűrés</h2>
          </div>
          <div class="filter-content">
            <div class="filter-group">
              <label>
                <span class="material-icons-round">date_range</span>
                Dátum
              </label>
              <input type="date" id="dateFilter" class="filter-input" disabled>
            </div>
            <div class="filter-group">
              <label>
                <span class="material-icons-round">school</span>
                Tantárgy
              </label>
              <select id="subjectFilter" class="filter-input">
                <option value="">Minden tantárgy</option>
                ${[...new Set(absences.map(a => a.subject))].sort().map(subject =>
                  `<option value="${subject}">${subject}</option>`
                ).join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>
                <span class="material-icons-round">check_circle</span>
                Igazolás
              </label>
              <select id="justificationFilter" class="filter-input">
                <option value="">Mindegy</option>
                <option value="justified">Igazolt</option>
                <option value="unjustified">Igazolatlan</option>
                <option value="pending">Igazolásra vár</option>
              </select>
            </div>
          </div>
        </div>

        <div class="absences-container">
          ${Object.entries(groupedAbsences).map(([date, dayAbsences]) => `
            <div class="absence-group" data-date="${date}">
              <div class="absence-date">
                <span class="material-icons-round">event</span>
                ${date}
                <span class="absence-count">${dayAbsences.length} óra</span>
              </div>
              <div class="absence-list">
                ${dayAbsences.map(absence => `
                  <div class="absence-item" 
                       data-subject="${absence.subject}"
                       data-justified="${absence.justified}">
                    <div class="absence-time">
                      <span class="material-icons-round">schedule</span>
                      ${absence.lesson}. óra
                    </div>
                    <div class="absence-details">
                      <div class="absence-subject">${absence.subject}</div>
                      <div class="absence-topic">${absence.topic}</div>
                    </div>
                    <div class="absence-status ${absence.justificationStatus}">
                      ${absence.justificationStatus === 'justified' ? 
                        `Igazolt <span class="material-icons-round">check_circle</span>` : 
                        absence.justificationStatus === 'unjustified' ?
                        `Igazolatlan <span class="material-icons-round">cancel</span>` :
                        `Igazolásra vár <span class="material-icons-round">pending</span>`}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </main>
    </div>
  `;

  
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

  setupEventListeners();
  setupFilters();
  
  hideLoadingScreen();
}

function setupEventListeners(data) {
  const userBtn = document.querySelector('.user-dropdown-btn');
  const userDropdown = document.querySelector('.user-dropdown');
  
  userBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    userDropdown?.classList.remove('show');
  });

  const timerEl = document.getElementById('logoutTimer');
  if (timerEl) {
    const startTime = parseInt(timerEl.textContent?.match(/\d+/)?.[0] || "30");
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

  
  document.getElementById('settingsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = chrome.runtime.getURL('settings/index.html');
    window.open(url, '_blank', 'width=400,height=600');
  });
}

function setupFilters() {
  try {
    const filters = {
      dateFilter: document.getElementById('dateFilter'),
      subject: document.getElementById('subjectFilter'),
      justified: document.getElementById('justificationFilter')
    };

    
    if (!filters.dateFilter || !filters.subject || !filters.justified) {
      console.warn('Some filter elements were not found in the DOM');
      return;
    }

    
    if (filters.dateFilter) {
      filters.dateFilter.disabled = true;
    }

    const filterAbsences = () => {
      try {
        
        const dateFilterValue = filters.dateFilter.value;
        const subject = filters.subject.value;
        const justified = filters.justified.value;
        
        
        const selectedDate = dateFilterValue ? new Date(dateFilterValue) : null;

        document.querySelectorAll('.absence-group').forEach(group => {
          const dateStr = group.dataset.date;
          const dateParts = dateStr.split('.');
          
          
          if (dateParts.length < 3) {
            console.error(`Invalid date format: ${dateStr}`);
            return;
          }
          
          
          const parsedDay = parseInt(dateParts[0].trim(), 10);
          const parsedMonth = parseInt(dateParts[1].trim(), 10) - 1;
          const parsedYear = parseInt(dateParts[2].trim(), 10);
          
          
          if (isNaN(parsedDay) || isNaN(parsedMonth) || isNaN(parsedYear)) {
            console.error(`Invalid date components: ${dateStr}`);
            return;
          }
          
          
          const groupDate = new Date(parsedYear, parsedMonth, parsedDay);
          
          let showGroup = true;

          
          // if (selectedDate && dateFilterValue) {
          //   // Compare year, month, and day to ignore time
          //   showGroup = groupDate.getFullYear() === selectedDate.getFullYear() && 
          //              groupDate.getMonth() === selectedDate.getMonth() && 
          //              groupDate.getDate() === selectedDate.getDate();
          //   
          //   console.log(`Comparing dates: ${groupDate.toDateString()} vs ${selectedDate.toDateString()}, match: ${showGroup}`);
          // }

          const absenceItems = group.querySelectorAll('.absence-item');
          let visibleItems = 0;

          absenceItems.forEach(item => {
            let showItem = true;
            if (subject && item.dataset.subject !== subject) showItem = false;
            
            if (justified) {
              const statusElement = item.querySelector('.absence-status');
              const hasStatus = statusElement.classList.contains(justified);
              if (!hasStatus) showItem = false;
            }

            item.style.display = showItem ? '' : 'none';
            if (showItem) visibleItems++;
          });

          group.style.display = (showGroup && visibleItems > 0) ? '' : 'none';
        });
      } catch (err) {
        
        console.error('Error during filtering absences:', err);
      }
    };
    
    
    // if (!filters.dateFilter.value) {
    //   const today = new Date();
    //   filters.dateFilter.value = today.toISOString().split('T')[0]; // Set date to today by default
    // }
    
    
    Object.values(filters).forEach(filter => {
      try {
        if (filter && filter !== filters.dateFilter) { // Don't add event listener to dateFilter
          filter.addEventListener('change', filterAbsences);
        }
      } catch (err) {
        if (err.message && err.message.includes('Extension context invalidated')) {
          console.warn('Extension context invalidated during event listener setup');
        } else {
          console.error('Error setting up filter event listener:', err);
        }
      }
    });
    
    
    filterAbsences();
  } catch (err) {
    
    if (err.message && err.message.includes('Extension context invalidated')) {
      console.warn('Extension context invalidated during filter setup');
    } else {
      console.error('Error setting up filters:', err);
    }
  }
}


if (window.location.href.includes('/Hianyzas/Hianyzasok')) {
  transformAbsencesPage().catch(error => {
    console.error('Hiba történt az oldal átalakítása során:', error);
  });
}