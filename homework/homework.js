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

async function collectHomeworkData() {
  await waitForElement('#TanulotHaziFeladatkGrid');
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

  const homeworkItems = [];
  const rows = document.querySelectorAll('#TanulotHaziFeladatkGrid .k-grid-content tr');
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 7) {
      homeworkItems.push({
        subject: cells[3]?.textContent?.trim() || '',
        teacher: cells[4]?.textContent?.trim() || '',
        description: cells[5]?.textContent?.trim() || '',
        createdDate: cells[6]?.textContent?.trim() || '',
        deadline: cells[7]?.textContent?.trim() || ''
      });
    }
  });

  
  const groupedHomework = {};
  homeworkItems.forEach(homework => {
    
    const deadlineDate = homework.deadline.split(' ').slice(0, 3).join(' ');
    if (!groupedHomework[deadlineDate]) {
      groupedHomework[deadlineDate] = [];
    }
    groupedHomework[deadlineDate].push(homework);
  });

  return { basicData, homeworkItems, groupedHomework };
}

function showLoadingScreen() {
  const loadingHTML = `
    <div class="loading-overlay">
      <div class="loading-container">
        <img src="${chrome.runtime.getURL('images/firka_logo.png')}" alt="Firka" class="loading-logo">
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

function isTomorrow(dateStr) {
  if (!dateStr) return false;
  
  
  const parts = dateStr.split('.');
  if (parts.length < 3) return false;
  
  const year = parseInt(parts[0].trim());
  const month = parseInt(parts[1].trim()) - 1; // JS months are 0-indexed
  const day = parseInt(parts[2].trim());
  
  const homeworkDate = new Date(year, month, day);
  
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  
  
  return homeworkDate >= tomorrow && homeworkDate < dayAfterTomorrow;
}

async function transformHomeworkPage() {
  showLoadingScreen();
  const { basicData, homeworkItems, groupedHomework } = await collectHomeworkData();

  
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
            <a href="/Hianyzas/Hianyzasok" data-page="absences" class="nav-item">
              <img src="${chrome.runtime.getURL('icons/absences-inactive.svg')}" alt="Mulasztások">
              Mulasztások
            </a>
            <a href="/Tanulo/TanuloHaziFeladat" data-page="other" class="nav-item active">
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
                <!--<span class="material-icons-round">subject</span>-->
                Tantárgy
              </label>
              <select id="subjectFilter">
                <option value="">Összes tantárgy</option>
                ${[...new Set(homeworkItems.map(item => item.subject))]
                  .sort()
                  .map(subject => `<option value="${subject}">${subject}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>
                <!--<span class="material-icons-round">person</span>-->
                Tanár
              </label>
              <select id="teacherFilter">
                <option value="">Összes tanár</option>
                ${[...new Set(homeworkItems.map(item => item.teacher))]
                  .sort()
                  .map(teacher => `<option value="${teacher}">${teacher}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="filter-group">
              <label>
                <!--<span class="material-icons-round">date_range</span>-->
                Határidő
              </label>
              <select id="deadlineFilter">
                <option value="">Összes határidő</option>
                <option value="tomorrow">Holnapi határidő</option>
                <option value="thisWeek">Ezen a héten</option>
                <option value="nextWeek">Jövő héten</option>
              </select>
            </div>
          </div>
        </div>

        <div class="homework-list" id="homeworkList">
          ${renderHomeworkList(groupedHomework)}
        </div>
      </main>
    </div>
  `;

  setupFilters(homeworkItems, groupedHomework);
  setupUserDropdown();
  setupLogoutTimer();
  hideLoadingScreen();
}

function renderHomeworkList(groupedHomework) {
  
  const sortedDates = Object.keys(groupedHomework).sort((a, b) => {
    const dateA = new Date(a.replace(/\./g, ''));
    const dateB = new Date(b.replace(/\./g, ''));
    return dateA - dateB;
  });

  if (sortedDates.length === 0) {
    return `
      <div class="empty-state">
        <p>Nincs megjeleníthető házi feladat.</p>
      </div>
    `;
  }

  return sortedDates.map(date => {
    const homeworkItems = groupedHomework[date];
    return `
      <div class="homework-date-group" data-date="${date}">
        <div class="date-header">
          <h3>${formatDateHeader(date)}</h3>
        </div>
        ${homeworkItems.map(homework => {
          const isTomorrowClass = isTomorrow(homework.deadline) ? 'due-tomorrow' : '';
          const urgentClass = isTomorrow(homework.deadline) ? 'urgent' : '';
          
          return `
            <div class="homework-item ${isTomorrowClass}" data-subject="${homework.subject}" data-teacher="${homework.teacher}">
              <div class="homework-header">
                <div class="homework-subject">${homework.subject}</div>
                <div class="homework-deadline ${urgentClass}">${formatDeadline(homework.deadline)}</div>
              </div>
              <div class="homework-content">${formatHomeworkDescription(homework.description)}</div>
              <div class="homework-footer">
                <div class="homework-teacher">${homework.teacher}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
}

function formatDateHeader(dateStr) {
  if (!dateStr) return '';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const parts = dateStr.split('.');
  if (parts.length < 3) return dateStr;
  
  const year = parseInt(parts[0].trim());
  const month = parseInt(parts[1].trim()) - 1;
  const day = parseInt(parts[2].trim());
  
  const date = new Date(year, month, day);
  
  
  if (date.toDateString() === today.toDateString()) {
    return 'Ma - ' + dateStr;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Holnap - ' + dateStr;
  }
  
  
  const weekdays = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
  return `${weekdays[date.getDay()]} - ${dateStr}`;
}

function formatDeadline(dateStr) {
  if (!dateStr) return '';
  
  
  if (isTomorrow(dateStr)) {
    return `Határidő: ${dateStr} (holnap!)`;
  }
  
  return `Határidő: ${dateStr}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr;
}

function formatHomeworkDescription(description) {
  if (!description) return '';
  
  
  description = description.replace(/(\d+\.)\s*(\w[^\n.]*)/g, '<strong>$1 $2</strong>');
  
  
  description = description.replace(/(Határidő:)\s*([^\n]+)/g, '<div class="homework-requirement"><span class="requirement-label">$1</span> $2</div>');
  description = description.replace(/(MS\s+[^\n.]+szerint\s+adható\s+be\.)/g, '<div class="homework-requirement"><span class="requirement-label">Beadás:</span> $1</div>');
  
  
  description = description.replace(/\n/g, '<br>');
  
  return description;
}

function setupFilters(homeworkItems, groupedHomework) {
  const subjectFilter = document.getElementById('subjectFilter');
  const teacherFilter = document.getElementById('teacherFilter');
  const deadlineFilter = document.getElementById('deadlineFilter');
  const applyFilterBtn = document.getElementById('applyFilterBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  
  
  const applyFilters = () => {
    const selectedSubject = subjectFilter.value;
    const selectedTeacher = teacherFilter.value;
    const selectedDeadline = deadlineFilter.value;
    
    
    const homeworkElements = document.querySelectorAll('.homework-item');
    const dateGroups = document.querySelectorAll('.homework-date-group');
    
    
    dateGroups.forEach(group => {
      group.style.display = 'none';
    });
    
    
    homeworkElements.forEach(item => {
      const subject = item.getAttribute('data-subject');
      const teacher = item.getAttribute('data-teacher');
      const dateGroup = item.closest('.homework-date-group');
      const dateStr = dateGroup.getAttribute('data-date');
      
      let showItem = true;
      
      
      if (selectedSubject && subject !== selectedSubject) {
        showItem = false;
      }
      
      
      if (selectedTeacher && teacher !== selectedTeacher) {
        showItem = false;
      }
      
      
      if (selectedDeadline) {
        const parts = dateStr.split('.');
        if (parts.length >= 3) {
          const year = parseInt(parts[0].trim());
          const month = parseInt(parts[1].trim()) - 1;
          const day = parseInt(parts[2].trim());
          const date = new Date(year, month, day);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          
          const startOfWeek = new Date(today);
          const dayOfWeek = today.getDay() || 7; // Convert Sunday from 0 to 7
          startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Monday
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
          
          
          const startOfNextWeek = new Date(endOfWeek);
          startOfNextWeek.setDate(endOfWeek.getDate() + 1);
          
          const endOfNextWeek = new Date(startOfNextWeek);
          endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
          
          if (selectedDeadline === 'tomorrow' && date.toDateString() !== tomorrow.toDateString()) {
            showItem = false;
          } else if (selectedDeadline === 'thisWeek' && (date < startOfWeek || date > endOfWeek)) {
            showItem = false;
          } else if (selectedDeadline === 'nextWeek' && (date < startOfNextWeek || date > endOfNextWeek)) {
            showItem = false;
          }
        }
      }
      
      
      item.style.display = showItem ? 'block' : 'none';
      
      
      if (showItem) {
        dateGroup.style.display = 'block';
      }
    });
    
    
    const visibleItems = document.querySelectorAll('.homework-item[style="display: block"]');
    const homeworkList = document.getElementById('homeworkList');
    
    
    let emptyState = homeworkList.querySelector('.empty-state');
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = '<p>Nincs a szűrési feltételeknek megfelelő házi feladat.</p>';
      homeworkList.appendChild(emptyState);
    }
    
    
    if (visibleItems.length === 0) {
      emptyState.style.display = 'block';
    } else {
      emptyState.style.display = 'none';
    }
  };
  
  
  const resetFilters = () => {
    subjectFilter.value = '';
    teacherFilter.value = '';
    deadlineFilter.value = '';
    
    
    document.querySelectorAll('.homework-item').forEach(item => {
      item.style.display = 'block';
    });
    
    document.querySelectorAll('.homework-date-group').forEach(group => {
      group.style.display = 'block';
    });
    
    
    const homeworkList = document.getElementById('homeworkList');
    const existingEmptyState = homeworkList.querySelector('.empty-state');
    if (existingEmptyState) {
      homeworkList.removeChild(existingEmptyState);
    }
  };
  
  
  subjectFilter.addEventListener('change', applyFilters);
  teacherFilter.addEventListener('change', applyFilters);
  deadlineFilter.addEventListener('change', applyFilters);
}

function setupUserDropdown() {
  const userBtn = document.querySelector('.user-dropdown-btn');
  const userDropdown = document.querySelector('.user-dropdown');
  
  userBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown?.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    userDropdown?.classList.remove('show');
  });
  
  
  document.getElementById('settingsBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = chrome.runtime.getURL('settings/index.html');
    window.open(url, '_blank', 'width=400,height=600');
  });
}

function setupLogoutTimer() {
  const timerElement = document.querySelector('.nav-logout-timer');
  if (!timerElement) return;
  
  const timeString = timerElement.textContent;
  const startTime = parseInt(timeString?.match(/\d+/)?.[0] || "45");
  let timeLeft = startTime * 60;
  
  const updateTimer = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      window.location.href = '/Home/Logout';
    }
    timeLeft--;
  };

  updateTimer();
  setInterval(updateTimer, 1000);
}


if (window.location.href.includes('/Tanulo/TanuloHaziFeladat')) {
  transformHomeworkPage().catch(error => {
    console.error('Error transforming homework page:', error);
  });
}