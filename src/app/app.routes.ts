import { Routes } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    {path: '', component: MainPageComponent, loadChildren: () => import('./main-page/main-page-routing.component').then(m => m.mainPageSidePanelRouter)},
    {path: 'login', component: LoginComponent, loadChildren: () => import('./login/login-component-routing.component').then(m => m.signInRoutes)}
];
