import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OptionsBarComponent } from './options-bar/options-bar.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, OptionsBarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'przem-chat-app';
}
