import { Routes } from '@angular/router';
import { FriendsPanelComponent } from './friends-panel/friends-panel.component';
import { SearchPanelComponent } from './search-panel/search-panel.component';
import { ConversationsPanelComponent } from './conversations-panel/conversations-panel.component';


export const mainPageSidePanelRouter: Routes = [
    {path: '', redirectTo: 'conversations', pathMatch: 'full'},
    {path: 'conversations', component: ConversationsPanelComponent},
    {path: 'conversations/:@', component: ConversationsPanelComponent},
    {path: 'friends', component: FriendsPanelComponent},
    {path: 'friends/:@', component: FriendsPanelComponent},
    {path: 'search', component: SearchPanelComponent},
    {path: 'search/:@', component: SearchPanelComponent}
];
