import {Injectable, isDevMode, OnDestroy} from "@angular/core";
import {HttpClient} from "@angular/common/http";

import {BehaviorSubject, Observable, of, Subject, Subscription} from "rxjs";
import {finalize} from "rxjs/operators";
import {untilDestroyed} from "ngx-take-until-destroy";


import {HciDataDto, HciFilterDto, HciGridDto, HciGroupingDto, HciPagingDto, HciSortDto} from "hci-ng-grid-dto";

import {GridGlobalService} from "./grid-global.service";
import {Cell} from "../cell/cell";
import {Row} from "../row/row";
import {Column} from "../column/column";
import {Range} from "../utils/range";
import {Point} from "../utils/point";
import {RowChange} from "../utils/row-change";
import {RowGroup} from "../row/row-group";
import {group} from "@angular/animations";
import {RowGroupView} from "../cell/viewRenderers/row-group-view";

/**
 * The service for handling configuration and data binding/parsing.
 */
@Injectable()
export class GridService implements OnDestroy {

  static defaultConfig: any = {
    theme: "spreadsheet",
    columnHeaders: true,
    groupBy: [],
    groupByCollapsed: true,
    externalGrouping: false,
    externalFiltering: false,
    externalSorting: false,
    externalPaging: false,
    pageSize: -1,
    pageSizes: [10, 25, 50],
    nVisibleRows: -1,
    busyTemplate: undefined
  };

  config: any = {};
  configSubject: BehaviorSubject<any> = new BehaviorSubject<any>(GridService.defaultConfig);

  linkedGroups: string[];

  id: string;
  columnHeaders: boolean;
  columns: Column[];
  fixedColumns: string[];
  groupBy: string[];
  groupByCollapsed: boolean = true;
  externalGrouping: boolean = false;
  externalFiltering: boolean = false;
  externalSorting: boolean = false;
  externalPaging: boolean = false;
  pageSizes: number[] = [10, 25, 50];
  nVisibleRows: number = -1;
  newRowPostCall: (newRow: any) => Observable<any>;

  onExternalDataCall: (externalInfo: HciGridDto) => Observable<HciDataDto>;

  originalData: Object[];
  originalDataCounts: number[];
  preparedData: Row[];
  groupedData: Row[];

  viewData: Row[] = [];
  viewDataSubject: BehaviorSubject<Row[]> = new BehaviorSubject<Row[]>([]);

  selectedRowGroup: RowGroup;
  rowGroups: Map<string, RowGroup> = new Map<string, RowGroup>();

  grouping: HciGroupingDto = new HciGroupingDto();
  filters: HciFilterDto[] = [];
  sorts: HciSortDto[] = [];
  sortsSubject = new BehaviorSubject<HciSortDto[]>(this.sorts);

  paging: HciPagingDto = new HciPagingDto();
  pagingSubject = new Subject<HciPagingDto>();

  externalInfoObserved = new Subject<HciGridDto>();
  doubleClickObserved = new Subject<Object>();
  cellDataUpdateObserved = new Subject<Range>();

  gridElement: HTMLElement;

  private selectedRowColumn: number = 0;

  private columnMap: Map<string, Column[]> = new Map<string, Column[]>();
  private columnMapSubject: BehaviorSubject<Map<string, Column[]>> = new BehaviorSubject<Map<string, Column[]>>(undefined);

  private filterMap: Map<string, HciFilterDto[]> = new Map<string, HciFilterDto[]>();
  private filterMapSubject: BehaviorSubject<Map<string, HciFilterDto[]>> = new BehaviorSubject<Map<string, HciFilterDto[]>>(this.filterMap);
  private configured: boolean = false;
  private nUtilityColumns: number = 0;
  private nFixedColumns: number = 0;
  private nNonFixedColumns: number = 0;
  private nVisibleColumns: number = 0;
  private height: number;
  private groupColumns: number[] = [];

  private busySubject: Subject<boolean> = new Subject<boolean>();
  private eventSubject: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private filterEventSubject: BehaviorSubject<HciFilterDto[]> = new BehaviorSubject<HciFilterDto[]>([]);
  private rowChangedSubject: Subject<RowChange> = new Subject<RowChange>();

  private lastEvent: any;

  private dataChangeSubject: Subject<any> = new Subject<any>();
  private valueSubject: Subject<Point> = new Subject<Point>();

  private dirtyCells: Point[] = [];
  private dirtyCellsSubject: Subject<Point[]> = new Subject<Point[]>();

  private selectedRows: any[] = [];
  private selectedRowsSubject: Subject<any[]> = new Subject<any[]>();

  private nConfigWait: number = 0;
  private configWaitSubjects: Subject<boolean>[] = [];
  private configWaitSubscriptions: Subscription[] = [];

  private configSet: boolean = false;

  private newRow: Row;
  private newRowSubject: Subject<Row> = new Subject<Row>();
  private newRowMessageSubject: Subject<string> = new Subject<string>();
  private newRowPostCallSuccess: (newRow: any, gridService?: GridService) => void;
  private newRowPostCallError: (error: any, gridService?: GridService) => void;
  private newRowPostCallFinally: (gridService?: GridService) => void;

  constructor(private gridGlobalService: GridGlobalService, private http: HttpClient) {
    this.gridGlobalService.register(this);
  }
  
  ngOnDestroy() {}

  /**
   * Expects an object with the above configuration options as fields.  This is built on top of the default values,
   * then the global config options, then these passed in specific configuration options.
   *
   * @param config
   */
  public updateConfig(config: any, forceColumnsChanged?: boolean): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": GridService.updateConfig");
    }
    if (!this.configured) {
      this.config = Object.assign({}, GridService.defaultConfig, this.gridGlobalService.getGlobalConfig(), config);
      this.configured = true;
    } else {
      Object.assign(this.config, config);
    }

    let columnsChanged: boolean = false;
    if (forceColumnsChanged !== undefined && forceColumnsChanged) {
      columnsChanged = forceColumnsChanged;
    }

    if (config.id) {
      this.id = config.id;
    }
    if (config.linkedGroups) {
      this.linkedGroups = config.linkedGroups;
      for (let linkedGroup of this.linkedGroups) {
        this.gridGlobalService.registerGroup(linkedGroup, this);
      }
    }
    if (config.onExternalDataCall) {
      this.onExternalDataCall = config.onExternalDataCall;
    }

    // Column Related Configuration
    if (config.columns !== undefined) {
      if (this.columns !== config.columns) {
        columnsChanged = true;
      }
      // Bring in column defaults to config
      for (var i = 0; i < config.columns.length; i++) {
        config.columns[i] = Object.assign({}, Column.defaultConfig, config.columns[i]);
      }
      this.columns = Column.deserializeArray(config.columns);
    }
    if (config.columnHeaders !== undefined) {
      if (this.columnHeaders !== config.columnHeaders) {
        columnsChanged = true;
      }
      this.columnHeaders = config.columnHeaders;
    }
    if (config.fixedColumns) {
      if (!this.fixedColumns) {
        columnsChanged = true;
      } else if (this.fixedColumns.length !== config.fixedColumns.length) {
        columnsChanged = true;
      } else {
        for (var i = 0; i < this.fixedColumns.length; i++) {
          if (this.fixedColumns[i] !== config.fixedColumns[i]) {
            columnsChanged = true;
          }
        }
      }
      this.fixedColumns = Object.assign([], config.fixedColumns);
    }
    if (config.groupBy !== undefined) {
      if (this.groupBy !== config.groupBy) {
        columnsChanged = true;
      }
      this.groupBy = config.groupBy;
      this.grouping.setFields(this.groupBy);
    }
    if (config.groupByCollapsed !== undefined) {
      if (this.groupByCollapsed !== config.groupByCollapsed) {
        columnsChanged = true;
      }
      this.groupByCollapsed = config.groupByCollapsed;
    }

    // Data Display and Fetching Configuration
    if (config.externalGrouping !== undefined) {
      this.externalGrouping = config.externalGrouping;
    }
    if (config.externalFiltering !== undefined) {
      this.externalFiltering = config.externalFiltering;
    }
    if (config.externalSorting !== undefined) {
      this.externalSorting = config.externalSorting;
    }
    if (config.externalPaging !== undefined) {
      this.externalPaging = config.externalPaging;
    }
    if (config.pageSize !== undefined) {
      this.paging.pageSize = config.pageSize;
    }
    if (config.pageSizes !== undefined) {
      this.pageSizes = config.pageSizes;
    }
    if (config.nVisibleRows !== undefined) {
      this.nVisibleRows = config.nVisibleRows;
    }
    if (config.height !== undefined) {
      this.height = config.height;
    }
    if (config.newRowPostCall !== undefined) {
      this.newRowPostCall = config.newRowPostCall;
    }
    if (config.newRowPostCallSuccess !== undefined) {
      this.newRowPostCallSuccess = config.newRowPostCallSuccess;
    } else {
      this.newRowPostCallSuccess = this.createDefaultNewRowPostCallSuccess();
    }
    if (config.newRowPostCallError !== undefined) {
      this.newRowPostCallError = config.newRowPostCallError;
    } else {
      this.newRowPostCallError = this.createDefaultNewRowPostCallError();
    }
    if (config.newRowPostCallFinally !== undefined) {
      this.newRowPostCallFinally = config.newRowPostCallFinally;
    } else {
      this.newRowPostCallFinally = this.createDefaultNewRowPostCallFinally();
    }

    // If you do external grouping then everything else must be external.
    if (this.externalGrouping) {
      this.externalPaging = true;
    }
    // If you do external paging, then everything else must be external.
    if (this.externalPaging) {
      this.externalGrouping = true;
      this.externalFiltering = true;
      this.externalSorting = true;
    }

    this.initializeSorts();

    this.setNVisibleRows();

    this.configSet = true;

    // Notify listeners if anything related to column configuration changed.
    if (columnsChanged) {
      this.initializeColumns();
    } else {
      this.configSubject.next(this.config);
    }
  }

  initializeSorts(pushSubject: boolean = true, asc: boolean = true): void {
    this.sorts = [];

    if (this.isGrouping()) {
      for (let groupBy of this.groupBy) {
        this.sorts.push(new HciSortDto(groupBy, asc));
      }
    }
    if (pushSubject) {
      this.sortsSubject.next(this.sorts);
    }
  }

  /**
   * Modifies the number of visible rows based upon other factors.  For example, if nVisibleRows is -1 and there is no
   * paging, it will stay -1, so all data will appear at once.  If nVisibleRows is -1 and there is paging, then the
   * nVisibleRows will be set to the page size.
   */
  public setNVisibleRows(): void {
    if (this.config.nVisibleRows === -1 && this.paging.pageSize > 0) {
      this.nVisibleRows = this.paging.pageSize;
    } else if (this.config.nVisibleRows === -1 && this.paging.pageSize === -1) {
      this.nVisibleRows = -1;
    }
  }

  /**
   * If the column configuration changes, e.g. by user editing the config, then re-sort the columns.
   *
   * @param {string} field
   * @param {number} position
   */
  public updateSortOrder(field: string, position: number): void {
    let n: number = -1;
    for (let i = 0; i < this.columns.length; i++) {
      if (this.columns[i].field === field) {
        n = i;
        break;
      }
    }
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": GridService.updateSortOrder: " + field + ", " + position + ", " + n);
    }

    if (n === -1) {
      console.warn("hci-grid: " + this.id + ": GridService.updateSortOrder: Column not found.");
    } else if (position === -2) {
      this.columns[n].sortOrder = 0;
      for (let i = n - 1; i >= 0; i--) {
        this.columns[i].sortOrder = this.columns[i].sortOrder + 1;
      }
    } else if (position === -1 && n > 0) {
      this.columns[n].sortOrder = this.columns[n].sortOrder - 1;
      this.columns[n - 1].sortOrder = this.columns[n - 1].sortOrder + 1;
    } else if (position === 1 && n < this.columns.length - 1) {
      this.columns[n].sortOrder = this.columns[n].sortOrder + 1;
      this.columns[n + 1].sortOrder = this.columns[n + 1].sortOrder - 1;
    } else if (position === 2) {
      this.columns[n].sortOrder = this.columns.length - 1;
      for (let i = n + 1; i < this.columns.length; i++) {
        this.columns[i].sortOrder = this.columns[i].sortOrder - 1;
      }
    }

    this.updateConfig({}, true);
  }

  /**
   * If there is a configuration step that needs to wait for a request, that gets pushed here as a callback function.
   * It must expect a subject that once the response comes back, does a next false to that subject.  If this wait involves
   * columns, there will be a lot of subjects and the idea is to wait for all of them before going to the next step.
   *
   * @param {(subject: Subject<boolean>) => any} callback
   */
  pushConfigWait(callback: (subject: Subject<boolean>) => any) {
    this.nConfigWait++;
    let subject: Subject<boolean> = new Subject<boolean>();
    this.configWaitSubjects.push(subject);

    callback(subject);
  }

  /**
   * This should be called after all configWaitSubjects are in place.  This function subscribes to them and when those
   * subscriptions come back with false, will subtract the number of active waiting subjects.  When it hits zero, we
   * unsubscribe all the subscriptions, reset the subject/subscription arrays and call the onComplete callback.  This
   * allows any function here to use this wait system and specify its next call in the callback.
   *
   * @param {() => any} onComplete
   */
  subscribeConfigWait(onComplete: () => any) {
    if (this.configWaitSubjects.length > 0) {
      for (let subject of this.configWaitSubjects) {
        this.configWaitSubscriptions.push(
          subject.subscribe((waiting: boolean) => {
            if (!waiting) {
              this.nConfigWait--;

              if (this.nConfigWait === 0) {
                for (let subscription of this.configWaitSubscriptions) {
                  if (subscription) {
                    subscription.unsubscribe();
                  }
                }

                this.configWaitSubjects = [];
                this.configWaitSubscriptions = [];

                onComplete();
              }
            }
          })
        );
      }
    } else {
      onComplete();
    }
  }

  public initializeColumns(): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": GridService.initializeColumns()");
    }

    this.initializeColumnsKeysAndChoices();
  }

  /**
   * Based upon the nature of the columns, sorts them.  For example, utility columns as a negative, then fixed columns
   * starting at zero then others.
   */
  public initializeColumnsKeysAndChoices(): void {
    this.createColumnMap();

    // If no columns are defined, return the map with the empty key values.
    if (!this.columns) {
      this.columnMapSubject.next(this.columnMap);
      return;
    }

    // Prior to arranging columns in initializeColumnsGroupSortMap, if the key is not set, use the first column.
    let keyDefined: boolean = false;
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columns[i].isKey) {
        keyDefined = true;
      }
    }
    if (!keyDefined && this.columns.length > 0) {
      this.columns[0].isKey = true;
    }

    for (let column of this.columns) {
      if (column.choiceUrl) {
        // Push a callback to request an array of choices from the choiceUrl.
        this.pushConfigWait((subject: Subject<boolean>) => {
          this.http.get(column.choiceUrl).subscribe((choices: any) => {
            if (choices && choices !== null) {
              column.setChoices(choices);
            } else {
              console.warn("hci-ng-grid: No choice data from: " + column.choiceUrl);
              column.setChoices([]);
            }
            subject.next(false);
          },
          (error) => {
            console.error(error);
            column.setChoices([]);
          });
        });
      }
    }

    // Trigger the next initialize step upon done waiting if there is anything to wait on.
    this.subscribeConfigWait(() => {
      this.initializeColumnsGroupSortMap();
    });
  }

  /**
   * Usually called when config changes, re-init the columns.  We re-sort based upon the preferred sort order then
   * calculate things like visible columns and group by, then re-sort based on the rendering order.
   */
  public initializeColumnsGroupSortMap(): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": GridService.initializeColumnsGroupSortMap");
    }

    this.columns.sort((a: Column, b: Column) => {
      if (a.sortOrder && b.sortOrder) {
        if (a.sortOrder < b.sortOrder) {
          return -1;
        } else if (a.sortOrder > b.sortOrder) {
          return 1;
        } else {
          return 0;
        }
      } else if (a.sortOrder) {
        return -1;
      } else if (b.sortOrder) {
        return 1;
      } else {
        return 0;
      }
    });

    for (var j = 0; j < this.columns.length; j++) {
      // Reset isLast
      this.columns[j].isLast = false;
    }

    this.nUtilityColumns = 0;
    let nGroupBy: number = 0;
    if (this.groupBy) {
      nGroupBy = this.groupBy.length;
    }

    let groupByDisplay: string = undefined;

    this.nVisibleColumns = 0;

    for (var j = 0; j < this.columns.length; j++) {
      if (this.fixedColumns) {
        // Reset isFixed to false
        this.columns[j].isFixed = false;

        for (var k = 0; k < this.fixedColumns.length; k++) {
          if (this.columns[j].field === this.fixedColumns[k]) {
            this.columns[j].isFixed = true;
          }
        }
      }
      if (this.groupBy) {
        for (var k = 0; k < this.groupBy.length; k++) {
          if (this.columns[j].field === this.groupBy[k]) {
            groupByDisplay = (groupByDisplay) ? groupByDisplay + ", " + this.columns[j].name : this.columns[j].name;
            this.columns[j].isGroup = true;
            this.columns[j].visible = false;
            break;
          }
        }
      }

      if (this.columns[j].visible) {
        this.nVisibleColumns = this.nVisibleColumns + 1;
      } else {
        this.columns[j].selectable = false;
      }

      // Set the order of columns based on how they should appear.  Non visible columns are at the back.
      if (this.columns[j].isUtility) {
        this.columns[j].renderOrder = this.columns[j].sortOrder;
      } else if (this.columns[j].isFixed) {
        this.columns[j].renderOrder = 10000 + this.columns[j].sortOrder;
      } else if (this.columns[j].visible) {
        this.columns[j].renderOrder = 20000 + this.columns[j].sortOrder;
      } else {
        this.columns[j].renderOrder = 30000 + this.columns[j].sortOrder;
      }
    }

    if (nGroupBy > 0) {
      let column: Column = new Column({renderOrder: 1999, field: "GROUP_BY", name: groupByDisplay, selectable: false, viewRenderer: RowGroupView});
      this.columns.push(column);
      this.nVisibleColumns = this.nVisibleColumns + 1;
    }

    // Re-sort columns based on render order.
    this.columns.sort((a: Column, b: Column) => {
      if (a.renderOrder < b.renderOrder) {
        return -1;
      } else if (a.renderOrder > b.renderOrder) {
        return 1;
      } else {
        return 0;
      }
    });

    // Push the columns to the different maps.
    for (var j = 0; j < this.columns.length; j++) {
      this.columnMap.get("ALL").push(this.columns[j]);

      this.columns[j].id = j;
      if (this.columns[j].visible) {
        this.columnMap.get("VISIBLE").push(this.columns[j]);

        if (this.columns[j].isUtility) {
          this.columnMap.get("UTILITY").push(this.columns[j]);
        }
        if (this.columns[j].isUtility || this.columns[j].isFixed) {
          this.columnMap.get("LEFT_VISIBLE").push(this.columns[j]);
        } else {
          this.columnMap.get("MAIN_VISIBLE").push(this.columns[j]);
        }
      } else {
        this.columnMap.get("NON_VISIBLE").push(this.columns[j]);
      }
    }

    if (this.columnMap.get("VISIBLE").length > 0) {
      this.columnMap.get("VISIBLE")[this.columnMap.get("VISIBLE").length - 1].isLast = true;

      if (this.columnMap.get("LEFT_VISIBLE").length > 0 && this.columnMap.get("MAIN_VISIBLE").length === 0) {
        this.columnMap.get("LEFT_VISIBLE")[this.columnMap.get("LEFT_VISIBLE").length - 1].isLast = true;
      } else {
        this.columnMap.get("MAIN_VISIBLE")[this.columnMap.get("MAIN_VISIBLE").length - 1].isLast = true;
      }
    }

    if (isDevMode()) {
      for (var j = 0; j < this.columns.length; j++) {
        console.debug("field: " + this.columns[j].field + ", sortOrder: " + this.columns[j].sortOrder + ", renderOrder: " + this.columns[j].renderOrder
            + ", visible: " + this.columns[j].visible + ", selectable: " + this.columns[j].selectable + ", isFixed: " + this.columns[j].isFixed);
      }
    }

    this.initializeColumnsFinalize();
  }

  initializeColumnsFinalize() {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": GridService.initializeColumnsFinalize()");
    }

    this.nFixedColumns = 0;
    this.nNonFixedColumns = 0;
    for (var j = 0; j < this.columns.length; j++) {
      if (this.columns[j].visible) {
        if (this.columns[j].isFixed) {
          this.nFixedColumns = this.nFixedColumns + 1;
        } else {
          this.nNonFixedColumns = this.nNonFixedColumns + 1;
        }
      }
    }

    this.config.columns = this.columns;

    this.columnMapSubject.next(this.columnMap);

    this.configSubject.next(this.config);
  }

  /**
   * Rather than store columns in a single array based on a number for rendering, create maps so different types of columns
   * can be easily referenced.
   *
   * @returns {Map<string, Column[]>}
   */
  public createColumnMap(): void {
    this.columnMap = new Map<string, Column[]>();
    this.columnMap.set("ALL", []);
    this.columnMap.set("UTILITY", []);
    this.columnMap.set("VISIBLE", []);
    this.columnMap.set("LEFT_VISIBLE", []);
    this.columnMap.set("MAIN_VISIBLE", []);
    this.columnMap.set("NON_VISIBLE", []);
  }

  public getConfigSubject(): BehaviorSubject<any> {
    return this.configSubject;
  }

  public getColumnHeaders(): boolean {
    return this.columnHeaders;
  }

  public getNVisibleRows(): number {
    return this.nVisibleRows;
  }

  public getNFixedColumns(): number {
    return this.nFixedColumns;
  }

  public getNNonFixedColumns(): number {
    return this.nNonFixedColumns;
  }

  public getColumns(): Column[] {
    return this.columns;
  }

  public getViewDataSubject(): BehaviorSubject<Row[]> {
    return this.viewDataSubject;
  }

  /**
   * Assemble an array of column indexes which are labeled as forming a key for a row of data.
   *
   * @returns {Array<number>}
   */
  public getKeyColumns(): Array<number> {
    let keys: number[] = [];
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columns[i].isKey) {
        keys.push(i);
      }
    }
    return keys;
  }

  public getColumn(j: number): Column {
    return this.columns[j];
  }

  public isColumnSelectable(j: number): boolean {
    return this.columns[j].selectable;
  }

  public getNVisibleColumns(): number {
    return this.nVisibleColumns;
  }

  public getColumnMapSubject(): BehaviorSubject<Map<string, Column[]>> {
    return this.columnMapSubject;
  }

  public setGridElement(gridElement: HTMLElement): void {
    this.gridElement = gridElement;
  }

  /**
   * Deletes the selected rows based on the key of the selected row.  This is really for bound viewDataSubject only.  If deleting
   * from an external viewDataSubject source, the call should be made to that service to delete the rows, then the grid should just
   * be refreshed.
   */
  public deleteSelectedRows(): void {
    this.originalData = this.originalData.filter((row: Object) => {
      for (var j = 0; j < this.columns.length; j++) {
        if (this.columns[j].isKey && this.selectedRows.indexOf(this.getField(row, this.columns[j].field)) !== -1) {
          return false;
        }
      }
      return true;
    });
    this.initData();

    if (this.viewData.length === 0) {
      this.setPage(-2);
    }

    this.selectedRows = [];
    this.selectedRowsSubject.next(this.selectedRows);
  }

  public reorderColumn(oldJ: number, newJ: number): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": reorderColumn: " + oldJ + " to " + newJ);
    }

    let visibleColumns: Column[] = this.columnMap.get("VISIBLE");

    if (newJ < oldJ) {
      visibleColumns[oldJ].sortOrder = visibleColumns[newJ].sortOrder;

      for (let i = oldJ - 1; i >= newJ; i--) {
        visibleColumns[i].sortOrder = visibleColumns[i].sortOrder + 1;
      }

      this.initializeColumns();
    } else if (newJ > oldJ) {
      visibleColumns[oldJ].sortOrder = visibleColumns[newJ].sortOrder;

      for (let i = oldJ + 1; i <= newJ; i++) {
        visibleColumns[i].sortOrder = visibleColumns[i].sortOrder - 1;
      }

      this.initializeColumns();
    }
  }

  public clearSelectedRows(): void {
    for (let row of this.selectedRows) {
      try {
        this.getRowByKey(row).get(this.selectedRowColumn).value = false;
      } catch (error) {
        console.error(error);
      }
    }

    this.selectedRows = [];
    this.selectedRowsSubject.next(this.selectedRows);
  }

  /**
   * Given the key on row i, negate the value at i, j.  This is expected to be a column with a boolean value
   * that governs the selected property.
   *
   * @param {number} i The row.
   * @param {number} j The column.
   * @returns {boolean} Returns the negated value.
   */
  public negateSelectedRow(i: number, j: number, multiSelect: boolean): boolean {
    this.selectedRowColumn = j;

    let key: any = this.getKey(i, j);
    // If the value doesn't exist, assume it would have been previously false, so set to true.
    let value: boolean = true;
    if (this.getRow(i).get(j).value) {
      value = !this.getRow(i).get(j).value;
    }

    this.getRow(i).get(j).value = value;

    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": negateSelectedRow: " + i + " " + j + " " + value);
    }

    if (value) {
      if (!multiSelect) {
        this.clearSelectedRows();
        this.selectedRows.push(key);
      } else if (this.selectedRows.indexOf(key) === -1) {
        this.selectedRows.push(key);
      }
    } else {
      if (!multiSelect) {
        this.clearSelectedRows();
      } else if (this.selectedRows.indexOf(key) !== -1) {
        this.selectedRows.splice(this.selectedRows.indexOf(key), 1);
      }
    }
    this.selectedRowsSubject.next(this.selectedRows);

    return value;
  }

  public setSelectedRow(i: number, j: number): void {
    let key: any = this.getKey(i, j);
    this.getRow(i).get(j).value = true;

    if (this.selectedRows.indexOf(key) === -1) {
      this.selectedRows.push(key);
    }
    this.selectedRowsSubject.next(this.selectedRows);
  }

  public setUnselectedRow(i: number, j: number): void {
    let key: any = this.getKey(i, j);
    this.getRow(i).get(j).value = false;

    if (this.selectedRows.indexOf(key) !== -1) {
      this.selectedRows.splice(this.selectedRows.indexOf(key), 1);
    }
    this.selectedRowsSubject.next(this.selectedRows);
  }

  public getSelectedRows(): any[] {
    return this.selectedRows;
  }

  public getSelectedRowsSubject(): Subject<any[]> {
    return this.selectedRowsSubject;
  }

  public cellDataUpdate(range: Range): void {
    this.cellDataUpdateObserved.next(range);
  }

  public doubleClickRow(i: number): void {
    this.doubleClickObserved.next(this.viewData[i]);
  }

  public getKey(i: number, j?: number): any {
    return this.viewData[i].key;
  }

  public getRowByKey(key: any): Row {
    for (let row of this.viewData) {
      if (row.key === key) {
        return row;
      }
    }

    return undefined;
  }

  /**
   * Upon filtering, we check for external filtering and if external, post new HciGridDto to observable.
   * We will assume that there may be a mix of internal and external filtering/sorting/paging.  If external
   * filtering, we will send an HciGridDto object, but if the sort/page is internal, set those values to
   * null in the HciGridDto.  So the external call will filter but we will still rely internally on sorting
   * and paging.
   *
   * Filtering Steps
   * Re-init viewDataSubject.
   * Set page to 0;
   * Filter
   * Sort
   * Paginate
   */
  public filter(): void {
    this.eventSubject.next({
      type: "filter",
      status: "start",
      nData: -1
    });

    if (this.externalFiltering) {
      this.filters = [];
      this.filterMap.forEach((filters: HciFilterDto[]) => {
        this.filters = this.filters.concat(filters);
      });
      if (isDevMode()) {
        console.debug("GridService.filter: externalFiltering: n: " + this.filters.length);
      }

      this.paging.setPage(0);

      if (this.selectedRowGroup) {
        this.doExternalDataCallGroupBy();
      } else {
        this.doExternalDataCall();
      }
    } else {
      this.paging.setPage(0);
      this.initDataWithOptions(true, !this.externalGrouping, !this.externalFiltering, !this.externalSorting, !this.externalPaging);
    }
  }

  public getColumnIndexByField(field: string): number {
    for (var j = 0; j < this.columns.length; j++) {
      if (this.columns[j].field === field) {
        return j;
      }
    }
    return -1;
  }

  public filterPreparedData(): void {
    if (isDevMode()) {
      console.debug("filterPreparedData");
    }

    let filteredData: Row[] = [];

    if (this.preparedData) {
      for (var i = 0; i < this.preparedData.length; i++) {
        let inc: boolean = true;

        for (var j = 0; j < this.columns.length; j++) {
          let filters: HciFilterDto[] = this.filterMap.get(this.columns[j].field);
          if (!filters) {
            continue;
          }
          filters = filters.filter((filter: HciFilterDto) => {
            return filter.valid;
          });

          if (filters.length > 0 && this.preparedData[i].get(j).value === null) {
            inc = false;
            break;
          } else if (filters.length === 0) {
            continue;
          } else if (!this.columns[j].filterFunction(this.preparedData[i].get(j).value, filters, this.columns[j])) {
            inc = false;
            break;
          }
        }
        if (inc) {
          filteredData.push(this.preparedData[i]);
        }
      }
    }
    this.preparedData = filteredData;
  }

  public getCell(i: number, j: number): Cell {
    try {
      return this.viewData[i].get(j);
    } catch (e) {
      return null;
    }
  }

  public getField(row: Object, field: String): Object {
    if (!field) {
      if (isDevMode()) {
        console.debug("hci-grid: " + this.id + ": getField: field is undefined.");
      }
      return null;
    }

    var fields = field.split(".");

    var obj = row[fields[0]];
    for (var i = 1; i < fields.length; i++) {
      obj = obj[fields[i]];
    }
    return obj;
  }

  public getRow(i: number): Row {
    if (i > this.viewData.length - 1) {
      return undefined;
    } else {
      return this.viewData[i];
    }
  }

  public getRowFromKey(key: any): Row {
    for (let row of this.viewData) {
      if (row.key === key) {
        return row;
      }
    }

    return undefined;
  }

  public getRowIndexFromKey(key: any): number {
    for (let i = 0; i < this.viewData.length; i++) {
      if (this.viewData[i].key === key) {
        return i;
      }
    }

    return undefined;
  }

  public clearDirtyCell(i: number, j: number): void {
    this.getRow(i).get(j).dirty = false;

    for (let ii = 0; ii < this.dirtyCells.length; ii++) {
      if (this.dirtyCells[ii].i === i && this.dirtyCells[ii].j === j) {
        this.dirtyCells.splice(ii, 1);
        break;
      }
    }
    this.dirtyCellsSubject.next(this.dirtyCells);
  }

  public handleValueChange(i: number, j: number, key: number, newValue: any, oldValue: any): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": handleValueChange: " + i + " " + j + " " + newValue + " " + oldValue);
    }

    if (i === -1) {
      this.setInputDataValue(i, this.columns[j].field, newValue);
      this.valueSubject.next(new Point(i, j));
    } else {
      this.setInputDataValue(i, this.columns[j].field, newValue);
      this.valueSubject.next(new Point(i, j));

      this.getRow(i).get(j).dirty = true;
      this.dirtyCells.push(new Point(i, j));
      this.dirtyCellsSubject.next(this.dirtyCells);

      this.dataChangeSubject.next({
        key: this.getRow(i).key,
        i: i,
        j: j,
        field: this.columns[j].field,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  }

  /**
   * TODO: If groupBy, don't just push rows, but check for pre-existing keys and add those rows to existing rowData.
   *
   * @param originalData
   */
  public initDataWithOptions(doPrepare: boolean, doGroup: boolean, doFilter: boolean, doSort: boolean, doPage: boolean): void {
    if (!this.originalData) {
      return;
    }

    if (isDevMode()) {
      console.info("hci-grid: " + this.id + ": initDataWithOptions: " + doPrepare + ", " + doGroup + ", " + doFilter + ", " + doSort + ", " + doPage);
    }

    if (!this.isColumnMapDefined()) {
      if (isDevMode()) {
        console.info("hci-grid: " + this.id + ": initDataWithOptions: Columns not yet set, skipping initData.");
      }
      return;
    }

    if (doPrepare) {
      this.prepareData();
    }
    if (doFilter) {
      this.filterPreparedData();
    }
    if (doSort) {
      this.sortPreparedData();
    }
    this.calculateRowGroups();
    if (doGroup) {
      this.groupPreparedData();
    } else {
      this.groupedData = this.preparedData;
    }
    this.resetUtilityColumns();

    let START: number = 0;
    let END: number = this.groupedData.length;

    if (this.selectedRowGroup && !this.externalPaging) {
      this.selectedRowGroup.paging.setDataSize(this.groupedData.length);
    } else if (!this.externalPaging) {
      this.paging.setDataSize(this.groupedData.length);
    }

    if (doPage && this.selectedRowGroup) {
      START = this.selectedRowGroup.paging.getPage() * this.selectedRowGroup.paging.getPageSize();
      END = Math.min(START + this.selectedRowGroup.paging.getPageSize(), this.selectedRowGroup.paging.getDataSize());
      this.selectedRowGroup.paging.setNumPages(Math.ceil(this.selectedRowGroup.paging.getDataSize() / this.selectedRowGroup.paging.getPageSize()));
      this.pagingSubject.next(this.selectedRowGroup.paging);
    } else if (doPage && this.paging.getPageSize() > 0) {
      START = this.paging.getPage() * this.paging.getPageSize();
      END = Math.min(START + this.paging.getPageSize(), this.paging.getDataSize());
      this.paging.setNumPages(Math.ceil(this.paging.getDataSize() / this.paging.getPageSize()));
      this.pagingSubject.next(this.paging);
    } else if (this.externalPaging) {
      this.paging.setNumPages(Math.ceil(this.paging.getDataSize() / this.paging.getPageSize()));
      this.pagingSubject.next(this.paging);
    } else if (!this.externalPaging) {
      this.paging.setNumPages(1);
      this.pagingSubject.next(this.paging);
    }

    this.viewData = [];
    for (var i = START; i < END; i++) {
      this.viewData.push(this.groupedData[i]);
    }

    this.viewDataSubject.next(this.viewData);

    let event: any = this.eventSubject.getValue();
    if (this.eventSubject.getValue().type === "filter") {
      event.status = "complete";
      event.nData = (doFilter) ? this.groupedData.length : this.paging.getDataSize();
      this.eventSubject.next(event);
    } else if (this.eventSubject.getValue().type === "sort") {
      event.status = "complete";
      this.eventSubject.next(event);
    }
  }

  public resetUtilityColumns(): void {
    this.clearSelectedRows();

    for (var i = 0; i < this.preparedData.length; i++) {
      for (var j = 0; j < this.columns.length; j++) {
        if (this.columns[j].isUtility) {
          if (this.columns[j].defaultValue !== undefined) {
            this.preparedData[i].get(j).value = this.columns[j].defaultValue;
          }
        }
      }
    }
  }

  public getEventSubject(): BehaviorSubject<any> {
    return this.eventSubject;
  }

  public prepareData(): void {
    if (!this.columns) {
      if (isDevMode()) {
        console.info("prepareData: No Columns, returning.");
      }
      return;
    }
    if (isDevMode()) {
      console.info("prepareData: nData: " + this.originalData.length + ", nCols: " + this.columns.length);
    }
    this.preparedData = [];

    this.rowGroups.clear();

    this.groupColumns = [];
    for (var i = 0; i < this.columns.length; i++) {
      if (this.columns[i].isGroup) {
        this.groupColumns.push(i);
      }
    }

    for (var i = 0; i < this.originalData.length; i++) {
      let row: Row = new Row();
      row.rowNum = i;
      for (var j = 0; j < this.columns.length; j++) {
        if (this.columns[j].isKey) {
          row.key = this.getField(this.originalData[i], this.columns[j].field);
        }
        if (this.columns[j].field === "GROUP_BY") {
          row.add(new Cell({value: "", key: i}));
        } else if (this.columns[j].isUtility) {
          row.add(new Cell({value: false}));
        } else {
          let value: any = this.getField(this.originalData[i], this.columns[j].field);
          row.add(new Cell({value: value, key: i}));

          if (this.columns[j].choiceAuto) {
            this.columns[j].addChoice(value, value);
          }
        }
      }

      this.preparedData.push(row);
    }
  }

  public setSelectedRowGroup(rowGroup: RowGroup): void {
    this.selectedRowGroup = rowGroup;

    if (this.selectedRowGroup) {
      this.selectedRowGroup.setPaging(new HciPagingDto(0, this.paging.getPageSize()));
    }
  }

  public expandCollapseRowGroup(groupKey: string): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": expandCollapseRowGroup: " + this.externalGrouping + " " + this.paging.getPageSize());
    }

    let rowGroup: RowGroup = this.rowGroups.get(groupKey);
    rowGroup.expanded = !rowGroup.expanded;

    if (this.externalGrouping) {
      if (this.selectedRowGroup && rowGroup.groupKey !== this.selectedRowGroup.groupKey) {
        this.selectedRowGroup.expanded = false;
        this.selectedRowGroup = undefined;

        rowGroup.expanded = true;
      } else if (this.selectedRowGroup) {
        rowGroup.expanded = false;
        this.setSelectedRowGroup(undefined);
      }
    }

    if (this.externalGrouping) {
      if (rowGroup.expanded) {
        this.setSelectedRowGroup(rowGroup);
        this.doExternalDataCallGroupBy(new HciGridDto(this.filters, this.sorts, rowGroup.paging, this.grouping));
      } else {
        this.doExternalDataCall();
      }
    } else if (this.paging.getPageSize() <= 0) {
      this.initDataWithOptions(false, true, false, false, false);
    } else {
      this.setSelectedRowGroup((rowGroup.expanded) ? rowGroup : undefined);
      this.initDataWithOptions(false, true, false, false, true);
    }
  }

  clearRowGroupCounts(): void {
    this.rowGroups.forEach((rowGroup: RowGroup) => {
      rowGroup.count = 0;
    });
  }

  public calculateRowGroups(): void {
    if (!this.isGrouping()) {
      return;
    }

    this.clearRowGroupCounts();
    for (let i = 0; i < this.preparedData.length; i++) {
      if (this.isGrouping()) {
        let groupKey: string = this.preparedData[i].createGroupKey(this.groupColumns);

        if (!this.rowGroups.has(groupKey)) {
          let rowGroup: RowGroup = new RowGroup(groupKey, (this.originalDataCounts) ? this.originalDataCounts[i] : 1);
          for (let groupField of this.grouping.getFields()) {
            rowGroup[groupField] = this.getField(this.originalData[i], groupField);
          }

          if (this.selectedRowGroup && groupKey === this.selectedRowGroup.groupKey) {
            rowGroup.expanded = true;
          }

          this.rowGroups.set(groupKey, rowGroup);
        } else if (!this.originalDataCounts) {
          this.rowGroups.get(groupKey).incrementCount();
        }
      }
    }
  }

  public groupPreparedData(): void {
    if (!this.isGrouping()) {
      this.groupedData = this.preparedData;
      return;
    }

    this.groupedData = [];
    let groupKeySet: Set<string> = new Set<string>();

    for (let i = 0; i < this.preparedData.length; i++) {
      if (this.selectedRowGroup && this.selectedRowGroup.groupKey !== this.preparedData[i].groupKey) {
        continue;
      } else if (!groupKeySet.has(this.preparedData[i].groupKey) || this.rowGroups.get(this.preparedData[i].groupKey).expanded) {
        this.groupedData.push(this.preparedData[i]);
      }
      groupKeySet.add(this.preparedData[i].groupKey);
    }
  }

  /**
   * TODO: Fix auto create columns.
   *
   * @param originalData
   * @returns {boolean}
   */
  public setOriginalData(originalData: Object[], originalDataCounts?: number[]): void {
    this.originalData = originalData;
    this.originalDataCounts = originalDataCounts;

    this.initData();
  }

  public doExternalDataCall(externalInfo?: HciGridDto): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": doExternalDataCall");
    }

    if (!this.onExternalDataCall) {
      return;
    }

    this.busySubject.next(true);

    if (!externalInfo) {
      externalInfo = new HciGridDto(this.filters, this.sorts, this.paging, this.grouping);
    }

    if (this.isGrouping()) {
      externalInfo.getGrouping().setGroupQuery(true);
    }

    this.onExternalDataCall(externalInfo).pipe(untilDestroyed(this)).subscribe((externalData: HciDataDto) => {
      if (!externalData.gridDto) {
        this.paging.setNumPages(1);
      } else {
        this.paging = externalData.getGridDto().getPaging();
      }
      this.setOriginalData(externalData.data, externalData.dataCounts);

      this.pagingSubject.next(this.paging);
      this.busySubject.next(false);
    });
  }

  public doExternalDataCallGroupBy(gridDto?: HciGridDto): void {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": doExternalDataCallGroupBy");
    }

    this.busySubject.next(true);

    let newGridDto: HciGridDto;
    if (!gridDto) {
      newGridDto = new HciGridDto(this.filters.slice(0), this.sorts.slice(0), this.paging, this.grouping);
    } else {
      newGridDto = new HciGridDto(gridDto.getFilters().slice(0), gridDto.getSorts().slice(0), gridDto.getPaging(), gridDto.getGrouping());
    }

    newGridDto.getGrouping().setGroupQuery(false);
    newGridDto.setPaging(this.selectedRowGroup.paging);
    for (let groupField of newGridDto.getGrouping().getFields()) {
      newGridDto.getFilters().push(new HciFilterDto(groupField, "string", this.selectedRowGroup[groupField], undefined, "E", true));
    }

    this.onExternalDataCall(newGridDto).pipe(untilDestroyed(this)).subscribe((externalData: HciDataDto) => {
      if (!externalData.gridDto) {
        this.selectedRowGroup.paging.setNumPages(1);
      } else {
        this.selectedRowGroup.paging = externalData.getGridDto().getPaging();
      }
      this.setOriginalData(externalData.data);

      this.pagingSubject.next(this.selectedRowGroup.paging);
      this.busySubject.next(false);
    });
  }

  public initData(): void {
    this.initDataWithOptions(true, !this.externalGrouping, !this.externalFiltering, !this.externalSorting, !this.externalPaging);
  }

  public isColumnMapDefined(): boolean {
    return this.columnMapSubject.getValue() && this.columnMapSubject.getValue().get("ALL") && this.columnMapSubject.getValue().get("ALL").length > 0;
  }

  /**
   * When a cell value updates, we have a i,j,k position and value.  Now this works for updating our internal
   * grid viewDataSubject which is flattened, but our input viewDataSubject could have a complex viewDataSubject structure.  An list of Person
   * may have a field like demographics.firstName which is in its own demographic object within person.
   *
   * @param rowIndex
   * @param field
   * @param value
   */
  public setInputDataValue(rowNum: number, field: string, value: any): void {
    var fields = field.split(".");

    let obj: Object;
    if (rowNum !== undefined && rowNum >= 0) {
      obj = this.originalData[rowNum];
    } else if (this.newRow) {
      obj = this.newRow.data;
    } else {
      return;
    }

    for (var i = 0; i < fields.length - 1; i++) {
      obj = obj[fields[i]];
    }
    obj[fields[fields.length - 1]] = value;
  }

  /**
   * Used to change the page the grid is on.
   *
   * @param {number} mode -2 for first, 2 for last, -1 for previous, 1 for next.
   */
  public setPage(mode: number): void {
    if (this.selectedRowGroup) {
      let page: number = this.selectedRowGroup.paging.getPage();
      if (mode === -2) {
        this.selectedRowGroup.paging.setPage(0);
      } else if (mode === -1 && this.selectedRowGroup.paging.page > 0) {
        this.selectedRowGroup.paging.setPage(this.selectedRowGroup.paging.getPage() - 1);
      } else if (mode === 1 && this.paging.getPage() < this.selectedRowGroup.paging.getNumPages() - 1) {
        this.selectedRowGroup.paging.setPage(this.selectedRowGroup.paging.getPage() + 1);
      } else if (mode === 2) {
        this.selectedRowGroup.paging.setPage(this.selectedRowGroup.paging.getNumPages() - 1);
      }

      if (page !== this.selectedRowGroup.paging.getPage()) {
        if (this.externalPaging) {
          this.doExternalDataCallGroupBy();
        } else {
          this.initDataWithOptions(false, !this.externalGrouping, !this.externalFiltering, !this.externalSorting, true);
        }
      }

      this.pagingSubject.next(this.selectedRowGroup.paging);
    } else {
      let page: number = this.paging.getPage();

      if (mode === -2) {
        this.paging.setPage(0);
      } else if (mode === -1 && this.paging.page > 0) {
        this.paging.setPage(this.paging.getPage() - 1);
      } else if (mode === 1 && this.paging.getPage() < this.paging.getNumPages() - 1) {
        this.paging.setPage(this.paging.getPage() + 1);
      } else if (mode === 2) {
        this.paging.setPage(this.paging.getNumPages() - 1);
      }

      if (page !== this.paging.getPage()) {
        if (this.externalPaging) {
          this.doExternalDataCall(new HciGridDto((this.externalFiltering) ? this.filters : null, (this.externalSorting) ? this.sorts : null, this.paging));
        } else {
          this.initDataWithOptions(false, !this.externalGrouping, !this.externalFiltering, !this.externalSorting, true);
        }
      }

      this.pagingSubject.next(this.paging);
    }
  }

  public setPageSize(pageSize: number) {
    if (isDevMode()) {
      console.debug("setPageSize: " + pageSize);
    }

    this.paging.setPageSize(pageSize);
    this.paging.setPage(0);

    this.setNVisibleRows();

    if (this.externalPaging) {
      if (this.selectedRowGroup) {
        this.doExternalDataCallGroupBy();
      } else {
        this.doExternalDataCall();
      }
    } else {
      this.initDataWithOptions(false, !this.externalGrouping, !this.externalFiltering, !this.externalSorting, this.paging.getPageSize() > 0);
    }
  }

  /**
   * Sorting Steps
   * Sort
   * Paginate (stay on current page)
   *
   * @param column
   */
  public sort() {
    this.eventSubject.next({
      type: "sort",
      status: "start",
      sorts: this.sorts
    });

    if (this.externalSorting) {
      if (this.selectedRowGroup) {
        this.doExternalDataCallGroupBy();
      } else {
        this.doExternalDataCall();
      }
    } else {
      this.initDataWithOptions(false, !this.externalGrouping, !this.externalFiltering, true, !this.externalPaging);
    }
  }

  public sortPreparedData() {
    if (this.preparedData && this.columns) {
      let sortColumns: Column[] = [];
      for (let sort of this.sorts) {
        for (var i = 0; i < this.columns.length; i++) {
          if (this.columns[i].field === sort.field) {
            sortColumns.push(this.columns[i]);
            break;
          }
        }
      }

      this.preparedData = this.preparedData.sort((o1: Row, o2: Row) => {
        let v: number = 0;
        for (let i = 0; i < sortColumns.length; i++) {
          let a: any;
          let b: any;
          if (sortColumns[i].field === "GROUP_BY") {
            a = o1.groupKey;
            b = o2.groupKey;
          } else {
            a = o1.get(sortColumns[i].id).value;
            b = o2.get(sortColumns[i].id).value;
          }

          v = sortColumns[i].sortFunction(a, b, this.sorts[i], sortColumns[i]);

          if (v !== 0) {
            return v;
          }
        }
        return v;
      });
    }
  }

  public isGrouping(): boolean {
    return this.groupBy && this.groupBy.length > 0;
  }

  public getRowGroup(groupKey: string): RowGroup {
    return this.rowGroups.get(groupKey);
  }

  public createHeader(row: Row): string {
    let header: string = undefined;
    for (var i = 0; i < this.groupColumns.length; i++) {
      header = (header === undefined) ? row.cells[this.groupColumns[i]].value : header + ", " + row.cells[this.groupColumns[i]].value;
    }
    return header;
  }

  public getValueSubject(): Subject<Point> {
    return this.valueSubject;
  }

  public getColumnByName(name: string): Column {
    for (let column of this.columns) {
      if (column.name === name) {
        return column;
      }
    }
  }

  public getFilterMapSubject(): BehaviorSubject<Map<string, HciFilterDto[]>> {
    return this.filterMapSubject;
  }

  public addFilter(field: string, filters: HciFilterDto) {
    if (!this.filterMap.has(field)) {
      this.filterMap.set(field, []);
    }
    this.filterMap.get(field).push(filters);

    this.filterMapSubject.next(this.filterMap);

    this.filterEventSubject.next([filters]);
  }

  /**
   * Way for external grid or user to add filters to a field.
   *
   * @param {string} field
   * @param {HciFilterDto[]} filters
   */
  public addFilters(field: string, filters: HciFilterDto[]) {
    if (!this.filterMap.has(field)) {
      this.filterMap.set(field, []);
    }
    this.filterMap.set(field, filters);
    this.filterMapSubject.next(this.filterMap);

    this.filterEventSubject.next(filters);
  }

  public groupByInSort(field: string): boolean {
    for (let groupField of this.groupBy) {
      if (field === groupField) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add a sort field and then perform the sort.  By default, clear the existing sort and start over.
   *
   * @param {string} field
   * @param {boolean} reset
   */
  public addSort(field: string, ctrl: boolean = false): void {
    let isGrouping: boolean = this.isGrouping();
    let isGroupBy: boolean = (field === "GROUP_BY") ?  true : false;

    let firstIndex: number = (isGrouping) ? this.groupBy.length : 1;

    if (isGroupBy) {
      if (this.sorts.length > 0) {
        this.initializeSorts(true, !this.sorts[0].asc);
      } else {
        this.initializeSorts(true, true);
      }
      let asc: boolean = this.sorts[0].asc;
      this.sort();
      return;
    } else if (isGrouping) {
      if (this.sorts.length - 1 === firstIndex && this.sorts[firstIndex].field === field) {
        // Regular behavior
      } else if (this.sorts && this.sorts.length - 1 === firstIndex && !ctrl && this.sorts[firstIndex].field !== field) {
        this.sorts = this.sorts.slice(0, firstIndex);
      } else if (!ctrl) {
        this.sorts = this.sorts.slice(0, firstIndex);
      }
    } else if (this.sorts.length === 1 && this.sorts[0].field === field) {
      // Regular behavior
    } else if (this.sorts && this.sorts.length === 1 && !ctrl && this.sorts[0].field !== field) {
      this.sorts = [];
    } else if (!ctrl) {
      this.sorts = [];
    }

    if (this.sorts.length === 0) {
      this.sorts.push(new HciSortDto(field));
    } else {
      let exists: boolean = false;
      for (let sort of this.sorts) {
        if (sort.field === field) {
          sort.asc = !sort.asc;
          exists = true;
          break;
        }
      }

      if (!exists) {
        this.sorts.push(new HciSortDto(field));
      }
    }

    this.sortsSubject.next(this.sorts);

    this.sort();
  }

  public getFilterEventSubject(): BehaviorSubject<HciFilterDto[]> {
    return this.filterEventSubject;
  }

  /**
   * If this grid is linked to other grids, prompt the syncing of this grid's filters through the global service.
   *
   * @param {string} field
   * @param {HciFilterDto[]} filters
   */
  public globalClearPushFilter(field: string, filters: HciFilterDto[]) {
    if (this.linkedGroups) {
      for (let linkedGroup of this.linkedGroups) {
        this.gridGlobalService.clearPushFilter(linkedGroup, this.id, field, filters);
      }
    }
  }

  public getOriginalData(): Object[] {
    return this.originalData;
  }

  public getOriginalRow(i: number): any {
    return this.originalData[i];
  }

  public getPreparedData(): Row[] {
    return this.preparedData;
  }

  public getDataChangeSubject(): Subject<any> {
    return this.dataChangeSubject;
  }

  public getDirtyCells(): Point[] {
    return this.dirtyCells;
  }

  public getDirtyCellsSubject(): Subject<Point[]> {
    return this.dirtyCellsSubject;
  }

  public getRowChangedSubject(): Subject<RowChange> {
    return this.rowChangedSubject;
  }

  /**
   * TODO: Rename observed to subject.  Change to event.
   *
   * @returns {Subject<HciSortDto>}
   */
  public getSortsSubject(): Subject<HciSortDto[]> {
    return this.sortsSubject;
  }

  /**
   * Return the theme split by space.
   *
   * @returns {string[]}
   */
  getThemes(): string[] {
    return this.config.theme.split(" ");
  }

  /**
   * Create a new empty row with empty data based on the column fields.
   */
  createNewRow(): void {
    this.newRow = new Row();

    for (var j = 0; j < this.columns.length; j++) {
      this.newRow.add(new Cell({value: undefined, key: undefined}));

      var fields = this.columns[j].field.split(".");

      if (fields.length === 1) {
        this.newRow.data[fields[0]] = undefined;
      } else {
        let obj: Object = undefined;
        for (var i = fields.length - 1; i >= 1; i--) {
          let parent: Object = {};
          parent[fields[i]] = obj;
          obj = parent;
        }
        this.newRow.data[fields[0]] = obj;
      }
    }

    if (isDevMode()) {
      console.debug("hci-grid: " + this.id + ": createNewRow:");
      console.debug(this.newRow);
    }

    this.newRowSubject.next(this.newRow);
  }

  /**
   * Save the new row.  If custom saving functions exist, use those, otherwise, just add to the original data array.
   */
  saveNewRow(): void {
    let leftRow: HTMLElement = <HTMLElement>this.gridElement.querySelector("#row-left--1");
    let rightRow: HTMLElement = <HTMLElement>this.gridElement.querySelector("#row-right--1");
    if ((leftRow && leftRow.querySelector(".ng-invalid")) || rightRow.querySelector(".ng-invalid")) {
      console.warn("New row has invalid columns.");
      this.getNewRowMessageSubject().next("Can't save, there are invalid columns.");
    } else if (this.newRowPostCall) {
      this.busySubject.next(true);

      this.newRowPostCall(this.newRow.data)
        .pipe(finalize(() => {
          this.newRowPostCallFinally(this);
        }))
        .subscribe((newRow: any) => {
          this.newRowPostCallSuccess(newRow, this);
        }, (error: any) => {
          this.newRowPostCallError(error, this);
        });
    } else {
      this.originalData.push(this.newRow.data);
      this.initData();
      this.newRowSubject.next(undefined);
    }
  }

  /**
   * Create a default function for what new row post success.  Push to original data and refresh.
   *
   * @returns {(newRow: any, gridService?: GridService) => void}
   */
  createDefaultNewRowPostCallSuccess(): (newRow: any, gridService?: GridService) => void {
    return (newRow: any, gridService?: GridService) => {
      this.originalData.push(newRow);
      this.initData();
      this.newRowSubject.next(undefined);
    };
  }

  /**
   * Create a default function for what new row post error.  Set new row message as error.
   *
   * @returns {(error: any) => void}
   */
  createDefaultNewRowPostCallError(): (error: any, gridService?: GridService) => void {
    return (error: any, gridService?: GridService) => {
      console.error(error);
      this.getNewRowMessageSubject().next(error);
      return of(undefined);
    };
  }

  /**
   * Create a default function for what new row post finally.  Set busy to false.
   *
   * @returns {() => void}
   */
  createDefaultNewRowPostCallFinally(): (gridService?: GridService) => void {
    return (gridService?: GridService) => {
      this.busySubject.next(false);
    };
  }

  /**
   * Return the newRowSubject.
   *
   * @returns {Subject<Row>}
   */
  getNewRowSubject(): Subject<Row> {
    return this.newRowSubject;
  }

  getNewRowMessageSubject(): Subject<string> {
    return this.newRowMessageSubject;
  }

  /**
   * Return the busySubject.
   *
   * @returns {Subject<boolean>}
   */
  getBusySubject(): Subject<boolean> {
    return this.busySubject;
  }
}
