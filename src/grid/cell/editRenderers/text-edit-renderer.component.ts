import {Component, ElementRef, ViewChild} from "@angular/core";

import * as moment from "moment";

import {Point} from "../../utils/point";
import {CellEditRenderer} from "./cell-edit-renderer";

@Component({
  selector: "hci-grid-text-edit",
  template: `
    <input #input
           autofocus
           [ngModel]="value"
           (ngModelChange)="onModelChange($event)"
           (click)="onClick($event)"
           (keydown)="onKeyDown($event)"
           class="hci-grid-text-edit" />
  `,
  styles: [ `
      
    .hci-grid-text-edit, .hci-grid-text-edit:focus {
      overflow-x: hidden;
      border: none;
      outline: none;
      width: -webkit-fill-available;
      height: -webkit-fill-available;
    }
  `]
})
export class TextEditRenderer extends CellEditRenderer {

  @ViewChild("input", {static: true}) input: ElementRef;

  invalid: boolean = false;
  required: boolean;
  minlength: number;
  maxlength: number;
  pattern: RegExp;

  init() {
    this.input.nativeElement.focus();

    if (this.data && this.data.value) {
      if (this.gridEventService.getLastDx() === -1) {
        this.input.nativeElement.selectionStart = (<string>this.data.value).length;
      } else {
        this.input.nativeElement.selectionStart = 0;
      }
    }
  }

  setConfig(config: any) {
    super.setConfig(config);

    if (config.required !== undefined) {
      this.required = config.required;
    }
    if (config.minlength) {
      this.minlength = config.minlength;
    }
    if (config.maxlength) {
      this.maxlength = config.maxlength;
    }
    if (config.pattern) {
      this.pattern = config.pattern;
    }
  }

  onModelChange(value: any) {
    this.renderer.removeClass(this.input.nativeElement, "ng-valid");
    this.renderer.removeClass(this.input.nativeElement, "ng-invalid");

    this.invalid = false;

    if (this.required !== undefined && this.required && !value) {
      this.invalid = true;
    } else if (this.minlength && !value) {
      this.invalid = true;
    } else if (this.minlength && value.length < this.minlength) {
      this.invalid = true;
    } else if (this.maxlength && value && value.length > this.maxlength) {
      this.invalid = true;
    } else if (this.pattern && !value) {
      this.invalid = true;
    } else if (this.pattern && value && value.match(this.pattern) === null) {
      this.invalid = true;
    } else if (this.column.dataType.indexOf("date") === 0 && this.column.format) {
      try {
        let date: string = moment(<string>value, this.column.format).toISOString();

        if (date === "Invalid date" || date.indexOf("NaN") >= 0 || value.length !== this.column.format.length) {
          this.invalid = true;
        }
      } catch (error) {
        this.invalid = true;
      }
    }

    if (this.invalid) {
      this.renderer.addClass(this.input.nativeElement, "ng-invalid");
    } else {
      this.value = value;
      this.renderer.addClass(this.input.nativeElement, "ng-valid");
    }
  }

  updateLocation() {
    super.updateLocation();
    this.renderer.setStyle(this.elementRef.nativeElement, "border", "red 1px solid");
    this.renderer.setStyle(this.elementRef.nativeElement, "background-color", "white");
  }

  onKeyDown(event: KeyboardEvent) {
    if ((event.keyCode === 37 && this.input.nativeElement.selectionStart === 0)
        || (event.keyCode === 39 && this.input.nativeElement.selectionStart === this.input.nativeElement.value.length)
        || event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 9) {
      this.saveData();
    } else if (event.keyCode === 13) {
      event.stopPropagation();
      this.gridEventService.setSelectedLocation(new Point(-1, -1), undefined);
      this.saveData();
    } else if (event.keyCode === 27) {
      event.preventDefault();
      event.stopPropagation();
      this.gridEventService.getUnselectSubject().next(undefined);
    } else {
      event.stopPropagation();
    }
  }
}
