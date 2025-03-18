import { FormControl, Validators } from "@angular/forms";
import { BehaviorSubject} from "rxjs";
import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
import { Renderer2 } from "@angular/core";

//interface for api response
interface AvailabilityResponse {
  status: HttpStatusCode | null,
  inputType: string //"email" or "username"
  available: boolean;
  message: string
}

export class RegisterInput{

  public static httpClient: HttpClient;

  name: string;
  formControl: FormControl;
  inputClass: string = ''
  inputMessage: string = ''
  valid: boolean = false;

  constructor({name, formControlValidators}: {name: string, formControlValidators: Validators}){
    this.name = name;
    this.formControl = new FormControl('', formControlValidators);

    //on each formControl value change set valid=false before checking
    this.formControl.valueChanges.subscribe(() => this.valid = false)
  }

  public getField(): Field{
    return {
      name: this.name,
      valid: this.valid,
      message: (this.valid? null : (this.name === "email"? "Please provide a valid email" : 'Minimum 3 characters in length'))
    }
  }

  public getAvailability(){

    this.valid = false;
        
    if(this.formControl.value.length === 0){
      this.inputClass = '';
      this.inputMessage = '';
      this.valid = false;
      return;
    }

    if(!this.formControl.valid){
      this.setValid(false, (this.name === 'email'? 'Please provide a valid email' : 'Minimum 3 characters in length'))
      return;
    }

    //do not check on server if input type is password
    if(this.name === 'password'){
        this.setValid(true);
         return;
    }

    const params = new HttpParams()
      .set('type', this.name)
      .set('data', this.formControl.value);
            
    //set classes
    this.inputClass = 'checking';

    //get availability
    RegisterInput.httpClient.get<AvailabilityResponse>('api/express/login/checkAvailability', {params})
    .subscribe(response => {

    const isResponseTypeEmail = response.inputType.toLowerCase() === 'email';

    if(isResponseTypeEmail === (this.name === 'email'))
      this.setValid(response.available, response.message?? '');
    else alert('RESPONSE TYPE AND INPUT TYPE NOT MATCH')

    });
  }

  private setValid(valid: boolean = true, message?: string){
    this.valid = valid;
    this.inputClass = (this.valid? 'valid' : 'not-valid')
    this.inputMessage = message?? '';
  }
}

export class ProfileImageInput {

  static renderer: Renderer2;
  static isPlatformBrowser: Function;
  static platformId: Object;

  image: BehaviorSubject<string | null>;
  isDraggingFile: boolean = false;
  profileImageRemovable: boolean = false;

  constructor() { 
    this.image = new BehaviorSubject<string | null>(null)
  }


  //process image to data
  processFile(file: File | undefined){
    const isBrowser = ProfileImageInput.isPlatformBrowser(ProfileImageInput.platformId);
    if(isBrowser && file){
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.image.next(reader.result as string);
      }
    }
  }

  //delegate click on profile image select
  inputClick(){
    ProfileImageInput.renderer.selectRootElement('#profile-image-input').click();
  }

  //handle drag and drop functionality
  onDragOver(event: DragEvent){
    const target = event.target as HTMLElement;
    event.preventDefault();
    this.isDraggingFile = true;
  }
  
  //handle on drag end
  onDragEnd(event: Event){
    event.preventDefault();
    this.isDraggingFile = false;
  }

  onFileDrop(event: DragEvent){
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if(file && (file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/jpeg'))
      this.processFile(file);
    this.isDraggingFile = false;
  }

  onFileSelect(event: any){
    const file = event.target.files[0];
    this.processFile(file);
  }

  mouseOver(){
    console.log('x')
    if(this.image.value)
      this.profileImageRemovable = true;
  }

  mouseLeave(){
    if(this.profileImageRemovable)
      this.profileImageRemovable = false;
  }

  removeClick(){
    if(this.profileImageRemovable && this.image.value){
      this.image.next(null);
      this.profileImageRemovable = false;
    }
  }
}

export interface RegisterFormService {
  profileImage: ProfileImageInput | null,
  username: RegisterInput | null,
  password: RegisterInput| null,
  email: RegisterInput | null
}

export interface Field {
  name: string,
  valid: boolean,
  message: string | null
}

export interface RegisterFormResponse {
  state: string //success, fail, waiting
  fields: Array<Field | undefined> | null
}