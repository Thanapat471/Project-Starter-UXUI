import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // เพิ่มตรงนี้

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule], // เพิ่มตรงนี้
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.css'
})
export class ThemeSwitcher {
  themes = [
    { label: 'Aura Light', file: 'aura-light.css' },
    { label: 'Aura Dark', file: 'aura-dark.css' },
    { label: 'Lara Light Indigo', file: 'lara-light-indigo.css' },
    { label: 'Lara Dark Indigo', file: 'lara-dark-indigo.css' }
  ];
  currentTheme = this.themes[0].file;
  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTheme(themeFile: string) {
    this.setPrimeNGTheme(themeFile);
    this.currentTheme = themeFile;
    localStorage.setItem('primeng_theme', themeFile);
    this.dropdownOpen = false;
  }

  setPrimeNGTheme(themeFile: string) {
    const themeLink = document.getElementById('primeng-theme-css') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = `assets/themes/${themeFile}`;
    }
  }

  constructor() {
    const saved = localStorage.getItem('primeng_theme');
    if (saved) {
      this.setPrimeNGTheme(saved);
      this.currentTheme = saved;
    } else {
      this.setPrimeNGTheme(this.currentTheme);
    }
  }
}
