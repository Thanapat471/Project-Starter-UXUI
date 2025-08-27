import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.css'
})
export class ThemeSwitcher {
  themes = [
    {
      class: 'theme-blue',
      label: 'Blue',
      primary: '#2563eb',
      secondary: '#60a5fa',
      bg: '#f8fafc',
      text: '#1e293b'
    },
    {
      class: 'theme-green',
      label: 'Green',
      primary: '#22c55e',
      secondary: '#bbf7d0',
      bg: '#f0fdf4',
      text: '#166534'
    },
    {
      class: 'theme-brown',
      label: 'Brown',
      primary: '#a16207',
      secondary: '#fbbf24',
      bg: '#f5f3ea',
      text: '#7c4700'
    },
    {
      class: 'theme-pink',
      label: 'Pink',
      primary: '#ec4899',
      secondary: '#f472b6',
      bg: '#fdf2f8',
      text: '#831843'
    }
  ];
  currentTheme = 'theme-blue';
  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectTheme(themeClass: string) {
    document.body.classList.remove(this.currentTheme);
    document.body.classList.add(themeClass);
    this.currentTheme = themeClass;
    localStorage.setItem('theme_color', themeClass);
    this.dropdownOpen = false;
  }

  constructor() {
    const saved = localStorage.getItem('theme_color');
    if (saved) {
      document.body.classList.remove(this.currentTheme);
      document.body.classList.add(saved);
      this.currentTheme = saved;
    }
  }
}
