import { USER, updateUserData } from '../user.js';
import { createFontSelect } from './appearance/fonts.js';
import { createThemeSelect } from './appearance/theme.js';
import { loadTab } from '../tabs.js';
import { currentTabId } from '../state.js';

const defaultURL = './src/assets/dashboard-logo.png';

export function createAppearanceMenu() {
    const containerEl = document.createElement('div');
    containerEl.classList.add('appearance-settings-el');

    const themeTitle = document.createElement('h3');
    themeTitle.textContent = 'Theme:';

    const themeSelect = createThemeSelect();

    const fontTitle = document.createElement('h3');
    fontTitle.textContent = 'Font:';

    const fontSelect = createFontSelect();

    const dashboardLogoTitle = document.createElement('h3');
    dashboardLogoTitle.textContent = 'Dashboard Image';

    const dashboardLogoDescription = document.createElement('p');
    dashboardLogoDescription.textContent =
        'Paste in a url and hit enter, or type "default" for our default image:';

    const logoInput = document.createElement('input');
    logoInput.classList.add('settings-input');
    let savedValue = USER.settings.appearance.dashboardLogo;
    if (savedValue === defaultURL) savedValue = 'default';
    logoInput.value = savedValue;

    logoInput.addEventListener('keydown', (e) => {
        if (!e.key === 'Enter') return;

        if (logoInput.value === 'defaultURL') {
            USER.settings.appearance.dashboardLogo = defaultURL;
        } else {
            USER.settings.appearance.dashboardLogo = logoInput.value;
        }
        updateUserData();
        loadTab(currentTabId);
    });

    containerEl.append(
        themeTitle,
        themeSelect,
        fontTitle,
        fontSelect,
        dashboardLogoTitle,
        dashboardLogoDescription,
        logoInput
    );
    return containerEl;
}

export function updateAppearance() {
    const font = USER.settings.appearance.font;
    const theme = USER.settings.appearance.theme;
    document.body.classList = '';
    document.body.classList.add(theme, font);
}
