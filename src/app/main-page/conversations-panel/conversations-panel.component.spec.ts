import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConversationsPanelComponent } from './conversations-panel.component';

describe('ConversationsPanelComponent', () => {
  let component: ConversationsPanelComponent;
  let fixture: ComponentFixture<ConversationsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConversationsPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConversationsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
