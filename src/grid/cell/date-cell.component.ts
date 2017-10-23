import {ChangeDetectorRef, Component, ElementRef, Input, isDevMode, ViewChild, ViewEncapsulation} from "@angular/core";
import * as moment from "moment";

import { CellTemplate } from "./cell-template.component";

/**
 * The ng2-bootstrap datepicker does not yet offer a popup mode, so we will wrap the datepicker in a traditional
 * bootstrap dropdown.
 */
@Component({
  selector: "hci-grid-cell-date",
  template: `
    <input #input
           [ngModel]="formattedValue"
           (ngModelChange)="onModelChange($event)"
           (click)="onClick($event)"
           (keydown)="onInputKeyDown($event)"
           [placeholder]="dateFormat"
           [pattern]="pattern"
           class="hci-grid-cell-template hci-grid-cell-date"
           [ngClass]="{ 'focused': focused }" />
  `,
  styles: [ `
    .hci-grid-cell-date {
      border: none;
    }
  ` ],
  encapsulation: ViewEncapsulation.None,
})
export class DateCell extends CellTemplate {

  @Input() pattern: string = "[A-Z][a-z]{2}\s\d{1,2}[,]\s\d{4}";
  @Input() dateFormat: string = "MMM D, YYYY";

  @ViewChild("input") input: ElementRef;

  formattedValue: string = "";

  constructor(private changeDetectorRef: ChangeDetectorRef) {
    super();
  }

  onModelChange(value: any) {
    if (isDevMode()) {
      console.debug("DateCell.onModelChange: %o", value);
    }

    this.formattedValue = <string> value;
  }

  saveValue() {
    try {
      let ms: number = Date.parse(this.formattedValue);
      if (ms !== null && !isNaN(ms)) {
        console.log(ms);
        super.onModelChange(ms);
      }
    } catch (e) {
      //
    }
  }

  onInputKeyDown(event: KeyboardEvent) {
    if (isDevMode()) {
      console.debug("DateCell.onInputKeyDown: %i", event.keyCode);
    }

    if (event.keyCode === 37 && this.input.nativeElement.selectionStart === 0) {
      event.stopPropagation();
      //this.input.nativeElement.blur();
      this.keyEvent.emit(37);
    } else if (event.keyCode === 39 && this.input.nativeElement.selectionStart === this.input.nativeElement.value.length) {
      event.stopPropagation();
      //this.input.nativeElement.blur();
      this.keyEvent.emit(39);
    } else if (event.keyCode === 9 || event.keyCode === 38 || event.keyCode === 40) {
      event.stopPropagation();
      //this.input.nativeElement.blur();
      this.onKeyDown(event);
    } else if (event.keyCode === 13) {
      this.saveValue();
    }
  }

  onFocus() {
    super.onFocus();
    this.input.nativeElement.focus();
  }

  setValue(value: Object) {
    this.formattedValue = moment((new Date(value))).format(this.dateFormat);

    if (isDevMode()) {
      console.debug("DateCell.setValue: %o", this.formattedValue);
    }
  }
}
