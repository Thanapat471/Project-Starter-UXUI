import { Component } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';
import { ThemeSwitcher } from '../../shared/theme-switcher/theme-switcher';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ToolbarModule, LanguageSwitcher, ThemeSwitcher],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {}
