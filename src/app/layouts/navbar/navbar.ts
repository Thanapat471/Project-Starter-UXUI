import { Component } from '@angular/core';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';

@Component({
  selector: 'app-navbar',
  imports: [LanguageSwitcher],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {

}
