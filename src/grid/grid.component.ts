/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ContentChildren, ElementRef, Input, OnChanges, QueryList, SimpleChange, ViewChild, ViewEncapsulation } from "@angular/core";

import { GridDataService } from "./services/grid-data.service";
import { GridEventService } from "./services/grid-event.service";
import { GridConfigService } from "./services/grid-config.service";
import { GridMessageService } from "./services/grid-message.service";
import { GridConfiguration } from "./utils/grid-configuration";
import { Point } from "./utils/point";
import { Range } from "./utils/range";
import { Row } from "./row/row";
import { RowGroup } from "./row/row-group";
import { Column } from "./column/column";
import { PageInfo } from "./utils/page-info";
import { ExternalInfo } from "./utils/external-info";
import { ExternalData } from "./utils/external-data";
import { ColumnDefComponent } from "./column/column-def.component";

/**
 * Thoughts...
 * data or click represented by three ints
 * i = rowGroup, j = subRow, k = col
 * if no grouping, then j always 0.
 *
 * group by a, b
 *   A   B
 *           x   y   z
 *           1   2   3
 *
 *   grouped data separated into subRow -1?  click on subrow collapses/expands?  not show grouped keys for rest of rows (0 and 1)?
 *
 */
@Component({
  selector: "hci-grid",
  providers: [
    GridDataService,
    GridEventService,
    GridConfigService,
    GridMessageService
  ],
  template: `
    <div (keydown)="onKeyDown($event);">
      <div [style.display]="busy ? 'inherit' : 'none'" class="hci-grid-busy">
        <div class="hci-grid-busy-div">
          <i class="fa fa-refresh fa-spin fa-3x fa-fw hci-grid-busy-icon"></i>
        </div>
      </div>
      <textarea #copypastearea style="position: absolute; left: -2000px;"></textarea>
      
      <!-- Title Bar -->
      <div *ngIf="title !== null" class="hci-grid-header">
        <span>{{ title }}</span>
      </div>
      
      <!-- Content -->
      <div style="display: inline-block; width: 100%; white-space: nowrap; overflow-x: auto; margin-bottom: -5px; border: black 1px solid;">
      
        <!-- Left (Fixed) Content -->
        <div style="vertical-align: top;"
             [style.display]="nFixedColumns > 0 ? 'inline-block' : 'none'"
             [style.width]="nFixedColumns > 0 ? (nFixedColumns * 10) + '%' : '0%'"
             [style.min-width]="fixedMinWidth + 'px'">
          <!-- Left Headers -->
          <div *ngIf="columnHeaders">
            <hci-column-header class="hci-grid-column-header hci-grid-row-height"
                               *ngFor="let column of columnDefinitions | isFixed:true; let j = index"
                               [column]="column"
                               [style.display]="column.visible ? 'inline-block' : 'none'"
                               [style.height]="column.filterType === null ? '30px' : '60px'"
                               [style.width]="column.width + '%'"
                               [style.min-width]="column.minWidth ? column.minWidth + 'px' : 'initial'"
                               [style.max-width]="column.maxWidth ? column.maxWidth + 'px' : 'initial'">
            </hci-column-header><br />
          </div>
          
          <!-- Left Data Rows -->
          <hci-row-group *ngFor="let row of gridData; let i = index" [i]="i" [fixed]="true"></hci-row-group>
        </div>
        
        <!-- Right (Main) Content -->
        <div style="display: inline-block; overflow-x: auto; overflow-y: hidden; white-space: nowrap; vertical-align: top;"
             class="rightDiv"
             [style.margin-left]="nFixedColumns > 0 ? '-4px' : '0px'"
             [style.width]="nFixedColumns > 0 ? (100 - (nFixedColumns * 10)) + '%' : '100%'">
          <!-- Right Headers -->
          <div *ngIf="columnHeaders">
            <hci-column-header *ngFor="let column of columnDefinitions | isFixed:false | isVisible; let j = index"
                               [column]="column"
                               class="hci-grid-column-header hci-grid-row-height"
                               [class.hci-grid-row-height]="column.filterType === null"
                               [class.hci-grid-row-height-filter]="column.filterType !== null"
                               [style.display]="column.visible ? 'inline-block' : 'none'"
                               [style.width]="column.width + '%'"
                               [style.min-width]="column.minWidth ? column.minWidth + 'px' : 'initial'"
                               [style.max-width]="column.maxWidth ? column.maxWidth + 'px' : 'initial'">
            </hci-column-header><br />
          </div>
          
          <!-- Right Data Rows -->
          <hci-row-group *ngFor="let row of gridData; let i = index" [i]="i" [fixed]="false"></hci-row-group>
        </div>
      </div>
      
      <!-- Footer -->
      <div *ngIf="pageSize > 0"
           style="width: 100%; height: 30px; border: black 1px solid; text-align: center; padding-top: 3px;">
        <span style="float: left; font-weight: bold;">Showing page {{ pageInfo.page + 1 }} of {{ pageInfo.numPages }}</span>
        <span style="text-align; middle;">
          <span (click)="doPageFirst();" style="padding-left: 15px; padding-right: 15px;"><i class="fa fa-fast-backward"></i></span>
          <span (click)="doPagePrevious();" style="padding-left: 15px; padding-right: 15px;"><i class="fa fa-backward"></i></span>
          <select [ngModel]="pageSize"
                  (ngModelChange)="doPageSize($event)"
                  style="padding-left: 15px; padding-right: 15px;">
            <option *ngFor="let o of pageSizes" [ngValue]="o">{{ o }}</option>
          </select>
          <span (click)="doPageNext();" style="padding-left: 15px; padding-right: 15px;"><i class="fa fa-forward"></i></span>
          <span (click)="doPageLast();" style="padding-left: 15px; padding-right: 15px;"><i class="fa fa-fast-forward"></i></span>
        </span>
      </div>
    </div>
  `,
  styles: [ `
    .hci-grid-header {
      background-color: transparent;
      color: black;
      padding: 10px;
      border-top-left-radius: 0px;
      border-top-right-radius: 0px;
      border: black 1px solid;
      font-weight: bold;
      font-size: large;
    }
    .hci-grid-column-header {
      display: inline-block;
      padding: 5px;
      border: black 1px solid;
      font-weight: bold;
      background-color: transparent;
      color: black;
      vertical-align: top;
    }
    .hci-grid-row-height {
      height: 30px;
    }
    .hci-grid-row-height-filter {
      height: 60px;
    }
    .hci-grid-busy {
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.2);
    }
    .hci-grid-busy-div {
      position: fixed;
      margin-left: 50%;
      margin-top: 5%;
    }
    .hci-grid-busy-icon {
      color: red;
    }
  ` ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridComponent implements OnChanges {

  @ViewChild("copypastearea") copypastearea: any;

  @Input() title: string = null;
  @Input() inputData: Object[] = null;

  // Grid Configuration
  @Input() cellSelect: boolean = false;
  @Input() columnDefinitions: Column[] = null;
  @Input() onAlert: Function;
  @Input() onExternalDataCall: Function;
  @Input() externalFiltering: boolean = false;
  @Input() externalPaging: boolean = false;
  @Input() externalSorting: boolean = false;
  @Input() fixedColumns: string[];
  @Input() keyNavigation: boolean = false;
  @Input() gridConfiguration: GridConfiguration;
  @Input() groupBy: string[];
  @Input() level: string = null;
  @Input() onRowDoubleClick: Function;
  @Input() rowSelect: boolean = false;
  @Input() pageSize: number = -1;
  @Input() pageSizes: number[] = [ 10, 25, 50 ];

  @ContentChildren(ColumnDefComponent) columnDefComponents: QueryList<ColumnDefComponent>;

  gridData: Array<RowGroup> = new Array<RowGroup>();
  nFixedColumns: number = 0;
  nColumns: number = 0;
  fixedMinWidth: number = 0;
  pageInfo: PageInfo = new PageInfo();
  initialized: boolean = false;
  columnHeaders: boolean = false;
  busy: boolean = false;

  constructor(private el: ElementRef, private changeDetectorRef: ChangeDetectorRef, private gridDataService: GridDataService, private gridEventService: GridEventService, private gridConfigService: GridConfigService, private gridMessageService: GridMessageService) {}

  /**
   * Setup listeners and pass inputs to services (particularly the config service).
   */
  ngAfterContentInit() {
    if (this.level) {
      this.gridMessageService.setLevel(this.level);
    }

    /* Listen to changes in the data.  Updated data when the data service indicates a change. */
    this.gridDataService.data.subscribe((data: Array<RowGroup>) => {
      this.gridData = data;
      this.busy = false;
      this.changeDetectorRef.markForCheck();
    });

    /* The grid component handles the footer which includes paging.  Listen to changes in the pageInfo and update. */
    this.gridDataService.pageInfoObserved.subscribe((pageInfo: PageInfo) => {
      this.pageInfo = pageInfo;
    });

    /* Listen to changes in Sort/Filter/Page.
    If there is an onExternalDataCall defined, send that info to that provided function. */
    if (this.onExternalDataCall) {
      this.gridDataService.externalInfoObserved.subscribe((externalInfo: ExternalInfo) => {
        this.busy = true;
        this.changeDetectorRef.markForCheck();
        this.onExternalDataCall(externalInfo).then((externalData: ExternalData) => {
          if (externalData.externalInfo === null) {
            this.gridDataService.pageInfo.setNumPages(1);
          } else {
            this.gridDataService.pageInfo = externalData.externalInfo.getPage();
          }
          this.gridDataService.setInputData(externalData.data);
          this.gridDataService.setInputDataInit();

          this.pageInfo = this.gridDataService.pageInfo;
          this.pageSize = this.gridDataService.pageInfo.getPageSize();
        });
      });
    }

    if (this.onAlert) {
      this.gridMessageService.messageObservable.subscribe((message: string) => {
        this.onAlert(message);
      });
    }

    /* If onRowDoubleClick is provided, then listen and send to function. */
    if (this.onRowDoubleClick) {
      this.gridDataService.doubleClickObserved.subscribe((row: Row) => {
        let keys: number[] = this.gridConfigService.gridConfiguration.getKeyColumns();
        if (keys.length === 0) {
          return;
        } else {
          this.onRowDoubleClick(row.cells[keys[0]].value);
        }
      });
    }

    this.initGridConfiguration();

    /* Get initial page Info */
    this.pageInfo = this.gridDataService.pageInfo;

    /* Can't use inputData and onExternalDataCall.  If onExternalDataCall provided, use that, otherwise use inputData. */
    if (this.onExternalDataCall) {
      this.busy = true;
      this.changeDetectorRef.markForCheck();
      this.onExternalDataCall(new ExternalInfo(null, null, this.pageInfo)).then((externalData: ExternalData) => {
        this.gridDataService.pageInfo = externalData.getExternalInfo().getPage();
        this.gridDataService.setInputData(externalData.getData());
        this.gridDataService.setInputDataInit();
        this.postInit();
      });
    } else if (this.inputData) {
      if (this.gridDataService.setInputData(this.inputData)) {
        this.gridConfigService.gridConfiguration.init();
        this.postInitGridConfiguration();
      }
      this.gridDataService.setInputDataInit();
      this.postInit();
    } else {
      this.postInit();
    }
  }

  postInit() {
    this.pageInfo = this.gridDataService.pageInfo;
    this.pageSize = this.gridDataService.pageInfo.getPageSize();

    this.initialized = true;
    this.gridEventService.setSelectedLocation(null, null);
  }

  ngOnChanges(changes: {[propName: string]: SimpleChange}) {
    if (this.initialized && changes["inputData"]) {
      this.gridDataService.setInputData(this.inputData);
      this.gridDataService.setInputDataInit();
    }
  }

  doPageFirst() {
    this.gridDataService.setPage(-2);
  }

  doPagePrevious() {
    this.gridDataService.setPage(-1);
  }

  doPageSize(value: number) {
    this.gridDataService.setPageSize(value);
  }

  doPageNext() {
    this.gridDataService.setPage(1);
  }

  doPageLast() {
    this.gridDataService.setPage(2);
  }

  initGridConfiguration() {
    if (this.gridConfiguration) {
      this.gridConfigService.gridConfiguration = this.gridConfiguration;
    }

    /* If columns are defined in the template, then use those and disregard those defined in typescript (if they also exist). */
    if (this.columnDefComponents && this.columnDefComponents.length > 0) {
      this.columnDefinitions = Column.getColumns(this.columnDefComponents);
    }
    if (this.columnDefinitions) {
      for (var k = 0; k < this.columnDefinitions.length; k++) {
        if (this.columnDefinitions[k].template === null) {
          this.columnDefinitions[k].template = "LabelCell";
        }
      }
      this.gridConfigService.gridConfiguration.columnDefinitions = this.columnDefinitions;
    }
    if (this.cellSelect) {
      this.gridConfigService.gridConfiguration.cellSelect = this.cellSelect;
    }
    if (this.keyNavigation) {
      this.gridConfigService.gridConfiguration.keyNavigation = this.keyNavigation;
    }
    if (this.fixedColumns) {
      this.gridConfigService.gridConfiguration.fixedColumns = this.fixedColumns;
    }
    if (this.groupBy) {
      this.gridConfigService.gridConfiguration.groupBy = this.groupBy;
    }
    if (this.externalFiltering) {
      this.gridConfigService.gridConfiguration.externalFiltering = this.externalFiltering;
    }
    if (this.externalSorting) {
      this.gridConfigService.gridConfiguration.externalSorting = this.externalSorting;
    }
    if (this.externalPaging) {
      this.gridConfigService.gridConfiguration.externalPaging = this.externalPaging;
    }
    if (this.rowSelect) {
      this.gridConfigService.gridConfiguration.rowSelect = this.rowSelect;
    }
    if (this.pageSize) {
      this.gridConfigService.gridConfiguration.pageSize = this.pageSize;
      this.gridDataService.pageInfo.setPageSize(this.pageSize);
    }

    this.gridConfigService.gridConfiguration.init();
    this.postInitGridConfiguration();
  }

  postInitGridConfiguration() {
    if (this.gridConfigService.gridConfiguration.columnDefinitions !== null) {
      this.columnHeaders = this.gridConfigService.gridConfiguration.columnHeaders;

      if (this.gridConfigService.gridConfiguration.fixedColumns != null) {
        this.nFixedColumns = this.gridConfigService.gridConfiguration.fixedColumns.length;
      }
      this.nColumns = this.gridConfigService.gridConfiguration.columnDefinitions.length;
      this.columnDefinitions = this.gridConfigService.gridConfiguration.columnDefinitions;
      this.gridEventService.setNColumns(this.nColumns);
      this.fixedMinWidth = 0;
      for (var i = 0; i < this.columnDefinitions.length; i++) {
        if (this.columnDefinitions[i].isFixed) {
          this.fixedMinWidth = this.fixedMinWidth + this.columnDefinitions[i].minWidth;
        }
      }
    }
  }

  /* Key Events */
  onKeyDown(event: KeyboardEvent) {
    this.gridMessageService.debug("GridComponent.onKeyDown");
    if (event.ctrlKey && event.keyCode === 67) {
      this.gridMessageService.debug("Copy Event");

      let range: Range = this.gridEventService.currentRange;
      if (range != null && !range.min.equals(range.max)) {
        let copy: string = "";

        for (var i = range.min.i; i <= range.max.i; i++) {
          for (var j = range.min.j; j <= range.max.j; j++) {
            for (var k = range.min.k; k <= range.max.k; k++) {
              copy += this.gridDataService.getRowGroup(i).get(j).get(k).value;
              if (k < range.max.k) {
                copy += "\t";
              }
            }
            if (i < range.max.i) {
              copy += "\n";
            } else if (i === range.max.i && j < range.max.j) {
              copy += "\n";
            }
          }
        }

        this.copypastearea.nativeElement.value = copy;
        this.copypastearea.nativeElement.select();
        event.stopPropagation();
      }
    } else if (event.ctrlKey && event.keyCode === 86) {
      this.copypastearea.nativeElement.select();
      let paste: string = this.copypastearea.nativeElement.value;

      this.gridMessageService.debug("Paste Event: " + paste);

      let range: Range = this.gridEventService.currentRange;
      if (range === null) {
        this.gridMessageService.warn("No cell selected to paste");
        return;
      } else if (paste === null || paste === "") {
        this.gridMessageService.warn("No data to paste");
        return;
      }

      let i = range.min.i;
      let j = range.min.j;
      let k = range.min.k;
      let cols: string[] = null;

      if (paste.endsWith("\n")) {
        paste = paste.substr(0, paste.length - 1);
      }

      let allowPaste: boolean = true;
      let rows: string[] = paste.split("\n");
      for (var ii = 0; ii < rows.length; ii++) {
        cols = rows[ii].split("\t");
        for (var kk = 0; kk < cols.length; kk++) {
          if (this.gridDataService.getRowGroup(i) == null) {
            allowPaste = false;
            break;
          } else if (this.gridDataService.getRowGroup(i).get(j) == null) {
            allowPaste = false;
            break;
          } else if (this.gridDataService.getRowGroup(i).get(j).get(k) == null) {
            allowPaste = false;
            break;
          }
          k = k + 1;
        }
        if (!allowPaste) {
          break;
        } else if (this.gridDataService.getRowGroup(i).get(j + 1) != null) {
          j = j + 1;
        } else {
          i = i + 1;
          j = 0;
        }
        k = range.min.k;
        if (this.gridDataService.getRowGroup(i) == null && ii !== rows.length - 1) {
          allowPaste = false;
          break;
        }
      }

      i = range.min.i;
      j = range.min.j;
      k = range.min.k;

      if (allowPaste) {
        for (var ii = 0; ii < rows.length; ii++) {
          cols = rows[ii].split("\t");
          for (var kk = 0; kk < cols.length; kk++) {
            this.gridDataService.getRowGroup(i).get(j).get(k).value = cols[kk];
            k = k + 1;
          }

          if (this.gridDataService.getRowGroup(i).get(j + 1) != null) {
            j = j + 1;
          } else {
            i = i + 1;
            j = 0;
          }
          k = range.min.k;
        }

        this.gridDataService.cellDataUpdate(new Range(range.min, new Point(i, j, k + cols.length - 1)));
      } else {
        this.gridMessageService.warn("Paste went out of range");
      }
    }
  }

}
