import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgFor } from '@angular/common';

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
    this.currentLang = this.translate.currentLang || this.translate.defaultLang || 'en';
    this.translate.onLangChange.subscribe(e => {
      this.currentLang = e.lang;
    });
  }

  switchLanguage(lang: string) {
    this.translate.use(lang);
    this.currentLang = lang;
  }
}
