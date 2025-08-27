import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms'; // เพิ่มตรงนี้
import { FloatLabelModule } from 'primeng/floatlabel';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe, ButtonModule, CheckboxModule, FormsModule, FloatLabelModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  orders = [
    { id: 1, product: 'Apple', quantity: 3 },
    { id: 2, product: 'Banana', quantity: 5 },
    { id: 3, product: 'Orange', quantity: 2 }
  ];

  pizza: any[] = []; // เพิ่ม property นี้
  value: string = ''; // เพิ่ม property นี้สำหรับ ngModel ใน input

}
