import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgFor, NgStyle, NgIf } from '@angular/common';

const LANG_KEY = 'app_lang';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [NgFor, NgStyle, NgIf],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher {
  languages = [
    { code: 'en', label: 'English' },
    { code: 'th', label: 'ไทย' }
  ];
  currentLang: string;
  dropdownOpen = false;

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem(LANG_KEY);
    this.currentLang = savedLang || this.translate.currentLang || this.translate.defaultLang || 'en';
    this.translate.use(this.currentLang);

    this.translate.onLangChange.subscribe(e => {
      this.currentLang = e.lang;
      localStorage.setItem(LANG_KEY, e.lang);
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectLanguage(lang: string) {
    this.switchLanguage(lang);
    this.dropdownOpen = false;
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem(LANG_KEY, lang);
    this.currentLang = lang;
  }

  getCurrentLangLabel(): string {
    const lang = this.languages.find(l => l.code === this.currentLang);
    return lang ? lang.label : '';
  }
}
