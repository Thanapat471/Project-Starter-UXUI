import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe, ButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  orders = [
    { id: 1, product: 'Apple', quantity: 3 },
    { id: 2, product: 'Banana', quantity: 5 },
    { id: 3, product: 'Orange', quantity: 2 }
  ];
}
