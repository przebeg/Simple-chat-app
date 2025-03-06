import { Routes } from '@angular/router';
import { OptionsBarComponent } from './options-bar/options-bar.component';
import { ProfileInfoComponent } from './profile-info/profile-info.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    {path: '', component: OptionsBarComponent},
    {path: 'profile', component: ProfileInfoComponent},
    {path: 'login', component: LoginComponent, loadChildren: () => import('./login/login-component-routing.component').then(m => m.signInRoutes)}
];
