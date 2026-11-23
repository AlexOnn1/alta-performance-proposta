import { Component, ElementRef, afterNextRender, inject, Injector, signal, viewChild } from '@angular/core';
import { IconComponent } from './icon';
import { ReactHostComponent } from './react-host';
import {
  addressOptions, emptyOrder, filledRooms, formatAddress, formatDate, orderSummary,
  roomIcon, selectedServices, validate, type Order, type Step,
} from '../../.compiled/shared/order.js';

type View = 'customer' | 'team';

@Component({
  selector: 'app-root',
  imports: [IconComponent, ReactHostComponent],
  templateUrl: './app.html',
})
export class AppComponent {
  readonly order = signal<Order>(emptyOrder());
  readonly sheet = signal<Order | null>(null);
  readonly view = signal<View>('customer');
  readonly step = signal<Step>(0);
  readonly copyStatus = signal('');
  readonly manualCopy = signal('');
  readonly viewTitle = viewChild.required<ElementRef<HTMLElement>>('viewTitle');
  private readonly injector = inject(Injector);
  private copyAttempt = 0;

  readonly addresses = addressOptions;
  readonly rooms = filledRooms;
  readonly address = formatAddress;
  readonly date = formatDate;
  readonly services = selectedServices;
  readonly roomIcon = roomIcon;

  showView(view: View) {
    if (view === this.view()) return;
    this.view.set(view);
    this.clearCopy();
    afterNextRender(() => {
      window.scrollTo(0, 0);
      this.viewTitle().nativeElement.focus({ preventScroll: true });
    }, { injector: this.injector });
  }

  confirm(order: Order) {
    const { details, inventory } = validate(order);
    if (Object.keys(details).length || Object.keys(inventory).length) return;
    this.order.set(order);
    this.sheet.set(order);
    this.showView('team');
  }

  returnToOrder() {
    if (this.step() === 2) this.step.set(1);
    this.showView('customer');
  }

  async copySummary(order: Order) {
    const text = orderSummary(order);
    this.clearCopy();
    const attempt = this.copyAttempt;
    try {
      await navigator.clipboard.writeText(text);
      if (attempt === this.copyAttempt) this.copyStatus.set('Resumo copiado.');
    } catch {
      if (attempt === this.copyAttempt) {
        this.manualCopy.set(text);
        this.copyStatus.set('Selecione e copie o texto abaixo.');
      }
    }
  }

  private clearCopy() {
    this.copyAttempt += 1;
    this.copyStatus.set('');
    this.manualCopy.set('');
  }
}
