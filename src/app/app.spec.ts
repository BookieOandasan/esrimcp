import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ConfigService } from './core/services/config.service';
import { signal } from '@angular/core';

describe('App', () => {
  beforeEach(async () => {
    const configStub = {
      config: signal(null),
      configError: signal('No config in test'),
    };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ConfigService, useValue: configStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show error banner when config error is present', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const banner = fixture.nativeElement.querySelector('[role="alert"]');
    expect(banner).toBeTruthy();
  });
});
