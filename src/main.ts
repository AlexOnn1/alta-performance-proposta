import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { inject } from '@vercel/analytics';
import { AppComponent } from './app/app';

inject();

bootstrapApplication(AppComponent, { providers: [provideZonelessChangeDetection()] }).catch(console.error);
