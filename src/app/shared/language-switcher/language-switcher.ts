import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgFor } from '@angular/common';

const LANG_KEY = 'app_lang';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [NgFor],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css'
})
export class LanguageSwitcher {
  languages = [
    { code: 'en', label: 'English' },
    { code: 'th', label: 'ไทย' }
  ];
  currentLang: string;

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem(LANG_KEY);
    this.currentLang = savedLang || this.translate.currentLang || this.translate.defaultLang || 'en';
    this.translate.use(this.currentLang);

    this.translate.onLangChange.subscribe(e => {
      this.currentLang = e.lang;
      localStorage.setItem(LANG_KEY, e.lang);
    });
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem(LANG_KEY, lang);
    this.currentLang = lang;
  }
}
