import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfigService } from './core/services/config.service';
import { ErrorBannerComponent } from './features/shared/error-banner/error-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ErrorBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected configService = inject(ConfigService);
  protected showConfigError = true;
}
