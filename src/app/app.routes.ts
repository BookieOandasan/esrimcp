import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/map/map.routes').then((m) => m.MAP_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
