import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  //sign-in
  private loginFormSubject = new BehaviorSubject<object>({
    usernameOrEmail: '',
    password: ''
  });
  loginForm = this.loginFormSubject.asObservable();
  loginFormChange(loginFormData: object){
    this.loginFormSubject.next(loginFormData);
  }

  //register
  private registerFormSubject = new BehaviorSubject<object>({
    profilePicture: '',
    username: '',
    password: '',
    email: ''
  })
  registerProfilePicture = this.registerFormSubject.asObservable();
  registerFormChange(registerForm: object){
    this.registerFormSubject.next(registerForm);
  }

  constructor() { }
}
