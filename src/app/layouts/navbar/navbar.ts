import { Component } from '@angular/core';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';
import { ThemeSwitcher } from '../../shared/theme-switcher/theme-switcher';

@Component({
  selector: 'app-navbar',
  imports: [LanguageSwitcher,ThemeSwitcher],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

}
