// Custom Language Selector
document.addEventListener('DOMContentLoaded', () => {
  createLanguageSelector();
});

function createLanguageSelector() {
  const existingSelectors = document.querySelectorAll('.language-selector');
  
  existingSelectors.forEach(selector => {
    // Remove the old select element
    const oldSelect = selector.querySelector('select');
    if (oldSelect) {
      oldSelect.remove();
    }

    // Create custom dropdown button
    const button = document.createElement('button');
    button.className = 'lang-btn';
    button.id = 'langBtn';
    button.innerHTML = getLanguageDisplay(currentLanguage);
    button.addEventListener('click', toggleLanguageDropdown);

    // Create dropdown menu
    const dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';
    dropdown.id = 'langDropdown';
    dropdown.innerHTML = `
      <button class="lang-option" onclick="switchLanguage('en')" data-lang="en">
        <span class="lang-code en">EN</span>
        <span class="lang-name">English</span>
      </button>
      <button class="lang-option" onclick="switchLanguage('fr')" data-lang="fr">
        <span class="lang-code fr">FR</span>
        <span class="lang-name">Français</span>
      </button>
      <button class="lang-option" onclick="switchLanguage('ar')" data-lang="ar">
        <span class="lang-code ar">AR</span>
        <span class="lang-name">العربية</span>
      </button>
    `;

    selector.appendChild(button);
    selector.appendChild(dropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!selector.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  });
}

function getLanguageDisplay(lang) {
  const codes = {
    en: 'EN',
    fr: 'FR',
    ar: 'AR'
  };
  const names = {
    en: 'English',
    fr: 'Français',
    ar: 'العربية'
  };
  return `<span class="lang-code ${lang}">${codes[lang]}</span> <span class="lang-text">${names[lang]}</span>`;
}

function toggleLanguageDropdown() {
  const dropdown = document.getElementById('langDropdown');
  dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function switchLanguage(lang) {
  setLanguage(lang);
  const button = document.getElementById('langBtn');
  button.innerHTML = getLanguageDisplay(lang);
  document.getElementById('langDropdown').style.display = 'none';
}
