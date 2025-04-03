import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FriendConversationLoadingPlaceholderComponent } from './friend-conversation-loading-placeholder.component';

describe('FriendConversationLoadingPlaceholderComponent', () => {
  let component: FriendConversationLoadingPlaceholderComponent;
  let fixture: ComponentFixture<FriendConversationLoadingPlaceholderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FriendConversationLoadingPlaceholderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FriendConversationLoadingPlaceholderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
