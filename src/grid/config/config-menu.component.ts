import {ChangeDetectorRef, Component, Input, isDevMode, OnDestroy, OnInit} from "@angular/core";

import {Subscription} from "rxjs";

import {GridComponent} from "../grid.component";
import {GridGlobalService} from "../services/grid-global.service";
import {Dictionary} from "../model/dictionary.interface";

@Component({
  selector: "hci-grid-config-menu",
  providers: [
    GridGlobalService
  ],
  template: `
    <div class="window" (click)="stop($event)" (mouseup)="stop($event)" (mousedown)="stop($event)">
      <div class="header">
        <div class="bubble" (click)="setState(1)" [class.selected]="state === 1">General</div>
        <div class="bubble" (click)="setState(2)" [class.selected]="state === 2">Columns</div>
      </div>
      <ng-container *ngIf="state === 1">
        <div class="panel">
          <div class="cfg-row" style="display: flex; flex-wrap: nowrap;">
            <div class="label">Title</div>
            <div class="input">
              <input type="text" [ngModel]="config.title" (ngModelChange)="update('title', $event)">
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Theme</div>
            <div class="input">
              <a [matMenuTriggerFor]="themeDropdown">
                {{getDisplay(themeChoices, config.theme)}}
              </a>
              <mat-menu #themeDropdown="matMenu" class="pad">
                <ng-container *ngFor="let theme of themeChoices">
                  <li (click)="update('theme', theme.value); themeDropdown.close();">
                    {{theme.display}}
                  </li>
                </ng-container>
              </mat-menu>
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Column Headers</div>
            <div class="input checkbox" [class.checked]="config.columnHeaders" (click)="update('columnHeaders', !config.columnHeaders)">
              <span *ngIf="config.columnHeaders"><i class="fas fa-check-circle fa-lg"></i></span>
              <span *ngIf="!config.columnHeaders"><i class="fas fa-times-circle fa-lg"></i></span>
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Fixed Columns</div>
            <div class="input">
              <hci-grid-multi-choice [model]="config.fixedColumns"
                                     [value]="'field'"
                                     [display]="'name'"
                                     [choices]="config.columns"
                                     (modelChange)="updateArray('fixedColumns', $event)"></hci-grid-multi-choice>
            </div>
          </div>
          <div class="cfg-row" style="display: flex; flex-wrap: nowrap;">
            <div class="label">Page Size</div>
            <div class="input">
              <input type="number" [ngModel]="config.pageSize" (ngModelChange)="update('pageSize', $event)" pattern="[0-9]+">
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Page Sizes</div>
            <div class="input">
              <hci-grid-multi-choice [model]="config.pageSizes" (modelChange)="updateArray('pageSizes', $event)" [sort]="number"></hci-grid-multi-choice>
            </div>
          </div>
          <div class="cfg-row" style="display: flex; flex-wrap: nowrap;">
            <div class="label">Visible Rows</div>
            <div class="input">
              <input type="number" [ngModel]="config.nVisibleRows" (ngModelChange)="update('nVisibleRows', $event)">
            </div>
          </div>
        </div>
      </ng-container>
      <ng-container *ngIf="state === 2">
        <div class="sub-header">
          <div *ngFor="let column of config.columns; let i = index"
               class="bubble"
               [class.selected]="column.name === selectedColumn.name"
               [style.backgroundColor]="column.visible ? 'lightgreen' : 'lightcoral'"
               (click)="setSelectedColumn(column)">
            {{column.name}}
          </div>
        </div>
        <div class="panel">
          <div class="cfg-row">
            <div class="label">Position</div>
            <div class="input">
              <span (click)="updateSortOrder(selectedColumn.field, -2)" class="pr-2"><i class="fas fa-fast-backward"></i></span>
              <span (click)="updateSortOrder(selectedColumn.field, -1)" class="pr-2"><i class="fas fa-play" data-fa-transform="rotate-180"></i></span>
              <span (click)="updateSortOrder(selectedColumn.field, 1)" class="pr-2"><i class="fas fa-play"></i></span>
              <span (click)="updateSortOrder(selectedColumn.field, 2)" class="pr-2"><i class="fas fa-fast-forward"></i></span>
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Visible</div>
            <div class="input checkbox" [class.checked]="selectedColumn.visible" (click)="updateColumn('visible', !selectedColumn.visible)">
              <span *ngIf="selectedColumn.visible"><i class="fas fa-check-circle fa-lg"></i></span>
              <span *ngIf="!selectedColumn.visible"><i class="fas fa-times-circle fa-lg"></i></span>
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Width (px)</div>
            <div class="input">
              <input type="number" [ngModel]="selectedColumn.width" (ngModelChange)="updateColumn('width', $event)">
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Width (%)</div>
            <div class="input">
              <input type="number" [ngModel]="selectedColumn.widthPercent" (ngModelChange)="updateColumn('widthPercent', $event)">
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Min Width (px)</div>
            <div class="input">
              <input type="number" [ngModel]="selectedColumn.minWidth" (ngModelChange)="updateColumn('minWidth', $event)">
            </div>
          </div>
          <div class="cfg-row">
            <div class="label">Max Width (px)</div>
            <div class="input">
              <input type="number" [ngModel]="selectedColumn.maxWidth" (ngModelChange)="updateColumn('maxWidth', $event)">
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    
      .window {
        min-width: 40vw;
        max-width: 40vw;
        background-color: white;
        border: black 1px solid;
        border-bottom-left-radius: 15px;
        border-bottom-right-radius: 15px;
      }
      
      .panel {
        margin-top: 5px;
        margin-bottom: 15px;
      }
      
      .header {
        border-bottom: black 1px solid;
        display: inline-flex;
        width: 100%;
        padding: 5px;
      }

      .sub-header {
        border-bottom: black 1px solid;
        display: flex;
        padding: 5px;
        overflow-x: auto;
      }

      .header .bubble, .sub-header .bubble {
        margin-right: 10px;
        background-color: lightblue;
        border: gray 1px solid;
        padding: 3px 6px;
        border-radius: 10px;
        white-space: nowrap;
      }

      .header .bubble.selected, .sub-header .bubble.selected {
        border: red 2px solid;
      }

      .pr-2 {
        padding-right: 0.5rem;
      }
      
      .cfg-row {
        display: flex;
        padding: 5px;
        align-items: center;
      }

      .cfg-row .label {
        flex: 1 1 50%;
      }

      .cfg-row .input {
        flex: 1 1 50%;
      }

      .cfg-row:nth-child(even) {
        background: #f0f0f0;
      }
      
      .input.checkbox {
        color: red;
      }
      
      .input.checkbox.checked {
        color: green;
      }
      
      .pad {
        padding: 0.5rem 0.5rem;
      }
  `]
})
export class ConfigMenuComponent implements OnInit, OnDestroy {

  @Input() grid: GridComponent;

  state: number = 1;

  config: any;
  selectedColumn: any;

  configSubscription: Subscription;

  themeChoices: Dictionary[];

  constructor(private gridGlobalService: GridGlobalService, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnInit() {
    this.themeChoices = this.gridGlobalService.themeChoices;

    this.configSubscription = this.grid.getGridService().getConfigSubject().subscribe((config: any) => {
      this.config = config;
    });
  }

  ngOnDestroy() {
    if (this.configSubscription) {
      this.configSubscription.unsubscribe();
    }
  }

  getDisplay(choices: Dictionary[], value: string) {
    for (let choice of choices) {
      if (choice.value === value) {
        return choice.display;
      }
    }
    return "N/A";
  }

  setState(state: number) {
    this.state = state;
    this.selectedColumn = this.config.columns[0];
  }

  updateSortOrder(field: string, position: number) {
    this.grid.getGridService().updateSortOrder(field, position);
  }

  updateArray(key: string, value: any[]) {
    if (isDevMode()) {
      console.debug("ConfigMenuComponent.updateArray: " + key);
      console.debug(value);
    }

    let config = {};
    config[key] = value;
    this.grid.getGridService().updateConfig(config);
    this.grid.doRender();
  }

  update(key: string, value: any) {
    if (isDevMode()) {
      console.debug("ConfigMenuComponent.update: " + key);
      console.debug(value);
    }

    let config = {};
    config[key] = value;
    this.grid.getGridService().updateConfig(config);
  }

  setSelectedColumn(column: any) {
    this.selectedColumn = column;
    this.changeDetectorRef.detectChanges();
  }

  updateColumn(key: string, value: any) {
    let i: number = 0;
    for (i = 0; i < this.config.columns.length; i++) {
      if (this.config.columns[i].field === this.selectedColumn.field) {
        this.config.columns[i][key] = value;
      }
    }

    this.grid.getGridService().updateConfig(this.config, true);
  }

  stop(event: Event) {
    event.stopPropagation();
  }
}
