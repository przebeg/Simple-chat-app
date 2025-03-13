import { FormControl } from "@angular/forms";
import { BehaviorSubject } from "rxjs";

export interface RegisterInput {
    name: string,
    formControl: FormControl<string | null>,
    inputClass: BehaviorSubject<string>,
    inputMessage: BehaviorSubject<string>,
}

export interface Fields {
    name: string,
    valid: boolean,
    message: string
}

export interface SubmitResponse {
    state: string //success, fail, waiting
    fields: Array<Fields>
}