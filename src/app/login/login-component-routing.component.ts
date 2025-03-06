import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { LoginComponent } from './login.component';
import { RegisterComponent } from './register/register.component';


export const signInRoutes: Routes = [
    {path: 'login', redirectTo: 'sign-in'},
    {path: 'sign-in', component: SignInComponent},
    {path: 'register', component: RegisterComponent}
];
