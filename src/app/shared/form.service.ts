import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RegisterFormResponse, RegisterFormService } from '../login/register/classes';

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

  //register form
  registerFormService = new BehaviorSubject<RegisterFormService | null>({
    profileImage: '',
    username: '',
    password: '',
    email: ''
  });

  registerFormResponse = new Subject<RegisterFormResponse | null>();

  constructor() { }
}

