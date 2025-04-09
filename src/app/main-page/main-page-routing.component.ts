import { Routes } from '@angular/router';
import { MainPageComponent } from './main-page.component';
import { FriendsPanelComponent } from './friends-panel/friends-panel.component';
import { SearchPanelComponent } from './search-panel/search-panel.component';


export const mainPageSidePanelRouter: Routes = [
    {path: '', redirectTo: 'friends', pathMatch: 'full'},
    {path: 'friends', component: FriendsPanelComponent},
    {path: 'search', component: SearchPanelComponent}
];
