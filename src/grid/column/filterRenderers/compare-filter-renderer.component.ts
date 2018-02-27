import {Component, Input} from "@angular/core";

import * as moment from "moment";

import {Column} from "../column";
import {FilterRenderer} from "./filter-renderer";
import {FilterInfo} from "../../utils/filter-info";

/**
 * Offers comparison with a few different data types such as numbers and dates.
 *
 * @since 1.0.0
 */
@Component({
  selector: "hci-grid-compare-filter",
  template: `
    <div class="d-flex flex-nowrap"
         style="width: 300px; padding: .5rem 0;"
         [style.background-color]="valid ? 'inherit' : '#ffccaa;'">
      <div class="parent">
        <select [ngModel]="operator" (ngModelChange)="operatorChange($event)" (click)="stop($event)" class="operator inputs">
          <option *ngFor="let o of options" [ngValue]="o.value" [selected]="o.value === operator.value">
            {{ o.display }}
          </option>
        </select>
        
        <ng-container *ngIf="column.dataType === 'date'">
          <div class="form-group">
            <div class="input-group flex-nowrap" (click)="stop($event)">
              <input ngbDatepicker #d1="ngbDatepicker"
                     [ngModel]="lowValue"
                     (ngModelChange)="valueChange($event)"
                     [minDate]="{year: 1900, month: 1, day: 1}"
                     placeholder="yyyy-mm-dd"
                     class="form-control value inputs" />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" (click)="d1.toggle()" type="button">
                  <i class="fas fa-calendar-alt"></i>
                </button>
              </div>
            </div>
            <div *ngIf="operator === 'B' || operator === 'O'"
                 class="input-group flex-nowrap"
                 (click)="stop($event)">
              <input ngbDatepicker #d2="ngbDatepicker"
                     [ngModel]="highValue"
                     (ngModelChange)="highValueChange($event)"
                     [minDate]="{year: 1900, month: 1, day: 1}"
                     placeholder="yyyy-mm-dd"
                     class="form-control value inputs" />
              <div class="input-group-append">
                <button class="btn btn-outline-secondary" (click)="d2.toggle()" type="button">
                  <i class="fas fa-calendar-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </ng-container>
        <ng-container *ngIf="column.dataType !== 'date'">
          <input [ngModel]="filterInfo.value"
                 (ngModelChange)="valueChange($event)"
                 (click)="stop($event)"
                 class="value inputs" />
          <input *ngIf="operator === 'B' || operator === 'O'"
                 [ngModel]="filterInfo.highValue"
                 (ngModelChange)="highValueChange($event)"
                 (click)="stop($event)"
                 class="value inputs" />
        </ng-container>
      </div>
      <div class="close flex-nowrap">
        <span *ngIf="changed" (click)="filter()" class="fade-in-out" style="color: green;">
          <span class="fas fa-check"></span>
        </span>
        <span (click)="valueClear()" style="color: red;">
          <span class="fas fa-times"></span>
        </span>
      </div>
    </div>
  `,
  styles: [`
  
    .input-group-append {
      height: 38px;
    }
      
    .inputs {
      margin-bottom: 10px;
    }
      
    .parent {
      flex: 1 1 80%;
      align-items: center;
      padding-left: 5px;
      flex-wrap: wrap;
      display: flex;
    }
      
    .close {
      flex: 0 0 20%;
      padding-left: 5px;
      padding-right: 5px;
      text-align: right;
    }
    
    .operator {
      background-color: #007bff;
      color: white;
      border-radius: 5px;
      width: 100%;
      font-weight: 500;
    }
      
    .value {
      border-radius: 5px;
      width: 100%;
      font-weight: 500;
    }
    
    .fade-in-out {
      opacity: 1.0;
      animation: fade 2.0s linear infinite;
    }

    @keyframes fade {
      0%, 100% { opacity: 1.0 }
      50% { opacity: 0.0 }
    }
  `]
})
export class CompareFilterRenderer extends FilterRenderer {

  @Input() column: Column;

  changed: boolean = false;
  valid: boolean = false;
  filterInfo: FilterInfo;

  lowValue: any;
  highValue: any;

  operator: string = "E";

  options = [
    { value: "LE", display: "Less Than or Equal" },
    { value: "LT", display: "Less Than" },
    { value: "E", display: "Equal" },
    { value: "GE", display: "Greater Than or Equal" },
    { value: "GT", display: "Greater Than" },
    { value: "B", display: "Between" },
    { value: "O", display: "Outside" }
  ];

  filter() {
    this.column.clearFilters();
    this.column.addFilter(this.filterInfo);
    this.gridService.filter();
    this.changed = false;
  }

  stop(event: MouseEvent) {
    event.stopPropagation();
  }

  setConfig(config: any) {
    super.setConfig(config);
    this.reset();
  }

  operatorChange(operator: string) {
    this.operator = operator;
    this.filterInfo.operator = operator;
    this.changed = true;
  }

  reset() {
    if (this.column.dataType === "number") {
      this.filterInfo = new FilterInfo(this.column.field, this.column.dataType, "0", "0", "E");
    } else if (this.column.dataType === "date") {
      this.filterInfo = new FilterInfo(this.column.field, this.column.dataType, moment().toISOString(), moment().toISOString(), "E");
    }  else {
      this.filterInfo = new FilterInfo(this.column.field, this.column.dataType, "", "", "E");
    }

    this.lowValue = this.format(this.filterInfo.value);
    this.highValue = this.format(this.filterInfo.highValue);
  }

  format(value: any): any {
    if (value === null) {
      return value;
    } else if (this.column.dataType === "date") {
      let d: string[] = value.split("-");
      return {year: +d[0], month: +d[1], day: +d[2]};
    } else {
      return value;
    }
  }

  parse(value: any): any {
    if (this.column.dataType === "date") {
      return value.year + "-" + ((value.month < 10) ? "0" : "") + value.month + "-" + ((value.day < 10) ? "0" : "") + value.day + "T12:00-06:00";
    } else {
      return value;
    }
  }

  valueChange(value: any) {
    if (!this.filterInfo) {
      this.setConfig({});
    }

    this.filterInfo.value = this.parse(value);
    this.changed = true;
  }

  highValueChange(value: any) {
    if (!this.filterInfo) {
      this.setConfig({});
    }

    this.filterInfo.highValue = this.parse(value);
    this.changed = true;
  }

  valueClear() {
    this.reset();
    this.column.clearFilters();
    this.gridService.filter();
  }

}