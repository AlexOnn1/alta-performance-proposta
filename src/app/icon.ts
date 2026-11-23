import { Component, input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: '<svg class="icon" aria-hidden="true"><use [attr.href]="\'icons.svg#\' + name()"></use></svg>',
})
export class IconComponent {
  readonly name = input.required<string>();
}
