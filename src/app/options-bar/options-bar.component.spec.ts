import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsBarComponent } from './options-bar.component';

describe('OptionsBarComponent', () => {
  let component: OptionsBarComponent;
  let fixture: ComponentFixture<OptionsBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OptionsBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
