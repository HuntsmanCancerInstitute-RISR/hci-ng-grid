import { Component, Input } from "@angular/core";

import { Column } from "./column";
import { GridConfigService } from "../services/grid-config.service";
import { GridDataService } from "../services/grid-data.service";
import { SortInfo } from "../utils/sort-info";

/**
 * fa-sort fa-sort-asc fa-sort-desc
 */
@Component({
  selector: "hci-column-header",
  template: `
    <div class="d-flex flex-nowrap" style="align-items: center;" (click)="doSort()">
      {{ column.name }}
      <i *ngIf="asc === 0" class="fa fa-sort sort-icon"></i>
      <i *ngIf="asc === 1" class="fa fa-sort-asc sort-icon"></i>
      <i *ngIf="asc === -1" class="fa fa-sort-desc sort-icon"></i>
    </div>
    <br *ngIf="column.filterType !== null" />
    <span *ngIf="column.filterType === 'input'">
      <input [ngModel]="column.filterValue"
             (ngModelChange)="doFilterChange($event)"
             style="width: 90%;" />
      <i class="fa fa-close"
         (click)="doFilterClear();">
      </i>
    </span>
    <span *ngIf="column.filterType === 'select'">
      <select [ngModel]="column.filterValue"
              (ngModelChange)="doFilterChange($event)"
              style="padding-left: 15px; padding-right: 15px; height: 30px; width: 90%;">
        <option *ngFor="let o of column.filterOptions" [ngValue]="o">{{ o }}</option>
      </select>
    </span>
  `,
  styles: [`
    .sort-icon {
      padding-left: 10px;
      margin-left: auto;
    }
  `],
})
export class ColumnHeaderComponent {

  @Input() k: number;
  @Input() column: Column;

  asc: number = 0;

  constructor(private gridConfigService: GridConfigService, private gridDataService: GridDataService) {}

  ngOnInit() {
    this.gridDataService.sortInfoObserved.subscribe((sortInfo: SortInfo) => {
      if (this.column.field === sortInfo.field) {
        if (sortInfo.asc) {
          this.asc = 1;
        } else {
          this.asc = -1;
        }
      } else {
        this.asc = 0;
      }
    });
  }

  doFilterChange(value: any) {
    this.column.filterValue = value;
    this.gridDataService.filter();
  }

  doFilterClear() {
    this.doFilterChange("");
  }

  doSort() {
    this.gridDataService.sort(this.column.field);
  }
}
