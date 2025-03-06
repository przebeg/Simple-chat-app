import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  private subject = new BehaviorSubject<string>('');
  subjectValue = this.subject.asObservable();

  updateValue(value: string){
    this.subject.next(value);
  }

  constructor() { }
}
