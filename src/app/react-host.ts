import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, input, output, viewChild } from '@angular/core';
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MoveForm, type MoveFormProps } from '../../.compiled/react/move-form.js';
import type { Order, Step } from '../../.compiled/shared/order.js';

@Component({
  selector: 'app-react-host',
  template: '<div #mount></div>',
})
export class ReactHostComponent implements AfterViewInit, OnChanges, OnDestroy {
  readonly order = input.required<Order>();
  readonly step = input.required<Step>();
  readonly orderChange = output<Order>();
  readonly stepChange = output<Step>();
  readonly confirmed = output<Order>();
  private readonly mount = viewChild.required<ElementRef<HTMLDivElement>>('mount');
  private root?: Root;

  ngAfterViewInit() {
    this.root = createRoot(this.mount().nativeElement);
    this.render();
  }

  ngOnChanges() {
    this.render();
  }

  ngOnDestroy() {
    this.root?.unmount();
  }

  private render() {
    if (!this.root) return;
    const props: MoveFormProps = {
      order: this.order(),
      step: this.step(),
      onChange: (order) => this.orderChange.emit(order),
      onStepChange: (step) => this.stepChange.emit(step),
      onConfirm: (order) => this.confirmed.emit(order),
    };
    this.root.render(createElement(MoveForm, props));
  }
}
