import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import 'hammerjs';

import { MaterialModule, MdIconModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ImageUploadModule } from 'ng2-imageupload';

import { AppComponent } from './app.component';
import { DrawAreaComponent } from "./drawarea/drawarea.component";


@NgModule({
  declarations: [
    AppComponent,
    DrawAreaComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MaterialModule,
    MdIconModule,
    FormsModule,
    ReactiveFormsModule,
    ImageUploadModule 
  ],
  providers: [ ],
  bootstrap: [AppComponent]
})
export class AppModule { }
