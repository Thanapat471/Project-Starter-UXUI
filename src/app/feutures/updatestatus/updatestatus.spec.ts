import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Updatestatus } from './updatestatus';

describe('Updatestatus', () => {
  let component: Updatestatus;
  let fixture: ComponentFixture<Updatestatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Updatestatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Updatestatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
