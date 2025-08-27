import { Component } from '@angular/core';
import { LanguageSwitcher } from '../../shared/language-switcher/language-switcher';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [LanguageSwitcher, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {}
