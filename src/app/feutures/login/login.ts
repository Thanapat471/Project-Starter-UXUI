import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzCardModule } from 'ng-zorro-antd/card';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzCardModule,
    NzIconModule,
    NzTypographyModule,
    RouterModule
  ],
  providers: [NzMessageService],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly message = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly submitting = signal(false);
  readonly authError = signal<string | null>(null);
  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });
  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authError.set(null);
    this.submitting.set(true);
    const { email, password, remember } = this.loginForm.value;

    this.authService
      .login({ email: email!, password: password! })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: response => {
          this.authService.persistSession(response, !!remember);
          this.message.success('เข้าสู่ระบบสำเร็จ');
          const redirectUrl = this.route.snapshot.queryParamMap.get('redirect');
          if (redirectUrl) {
            this.router.navigateByUrl(redirectUrl);
          } else {
            this.router.navigate(['/features/dashboard']);
          }
        },
        error: error => {
          if (error.status === 0) {
            this.authError.set('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
          } else {
            this.authError.set('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
          }
        }
      });
  }
}
