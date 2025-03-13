(() => {
    
    function setCookie(name, value, days = 365) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value}; ${expires}; path=/; domain=.e-kreta.hu`;
    }

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

    
    function setTheme(theme) {
        try {
            
            const actualTheme = theme === 'default' ? 'light-blue' : theme;
            
            document.documentElement.setAttribute('data-theme', actualTheme);
            setCookie('themePreference', actualTheme);
            localStorage.setItem('themePreference', actualTheme);
            
            
            chrome.runtime.sendMessage({
                action: 'themeChanged',
                theme: actualTheme
            }).catch(() => {
                
                console.log('Extension context not available for theme sync');
            });
            
            console.log('Theme set to:', actualTheme);
        } catch (error) {
            console.error('Error setting theme:', error);
        }
    }

    
    function initializeTheme() {
        
        const cookieTheme = getCookie('themePreference');
        const localStorageTheme = localStorage.getItem('themePreference');
        
        
        const theme = cookieTheme || localStorageTheme || 'light-blue';
        
        
        setTheme(theme);
        
        
        if (cookieTheme !== localStorageTheme) {
            if (cookieTheme) {
                localStorage.setItem('themePreference', cookieTheme);
            } else if (localStorageTheme) {
                setCookie('themePreference', localStorageTheme);
            }
        }
    }

    
    if (document.readyState === 'loading') {
        
        document.addEventListener('DOMContentLoaded', () => {
            initializeTheme();
        });
        
        
        initializeTheme();
    } else {
        
        initializeTheme();
    }

    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'changeTheme') {
            setTheme(message.theme);
            sendResponse({ success: true });
        }
        
        if (message.action === 'getTheme') {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light-blue';
            sendResponse({ theme: currentTheme });
        }

        return true;
    });

    
    const observer = new MutationObserver((mutations) => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const savedTheme = getCookie('themePreference') || localStorage.getItem('themePreference');
        
        if ((!currentTheme && savedTheme) || (currentTheme !== savedTheme && savedTheme)) {
            setTheme(savedTheme);
        }
    });

    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['data-theme']
            });
        });
    } else {
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }
})();