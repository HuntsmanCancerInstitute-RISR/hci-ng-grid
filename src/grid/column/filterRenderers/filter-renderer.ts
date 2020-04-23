import {ChangeDetectorRef, ElementRef, EventEmitter, Input, Output, OnDestroy} from "@angular/core";
import {untilDestroyed} from "ngx-take-until-destroy";
import {HciFilterDto} from "hci-ng-grid-dto";

import {Column} from "../column";
import {GridService} from "../../services/grid.service";

export class FilterRenderer implements OnDestroy {

  @Input() column: Column;
  @Output() close: EventEmitter<boolean> = new EventEmitter<boolean>();

  filters: HciFilterDto[];
  config: any = {};
  shared = false;
  width: number = 250;
  gridService: GridService;
  elementRef: ElementRef;
  changeDetectorRef: ChangeDetectorRef;

  constructor(gridService: GridService, elementRef: ElementRef, changeDetectorRef: ChangeDetectorRef) {
    this.gridService = gridService;
    this.elementRef = elementRef;
    this.changeDetectorRef = changeDetectorRef;
  }

  ngOnInit() {
    this.filtersSubscribe();
  }
  
  ngOnDestroy() {}

  ngAfterViewInit() {
    this.changeDetectorRef.detectChanges();
  }

  filtersSubscribe() {
    this.gridService.getFilterMapSubject().pipe(untilDestroyed(this)).subscribe((filterMap: Map<string, HciFilterDto[]>) => {
      if (this.column) {
        if (filterMap.has(this.column.field)) {
          this.filters = filterMap.get(this.column.field);
        } else {
          this.reset();
          this.gridService.addFilters(this.column.field, this.filters);
        }
      }
    });
  }

  filter() {
    // To Override
  }

  getConfig(): any {
    return this.config;
  }

  setConfig(config: any) {
    if (config) {
      this.config = config;
    }
  }

  reset() {
    if (!this.filters) {
      this.filters = [];
    }
  }

  stop(event: MouseEvent) {
    event.stopPropagation();
  }

  toggleShared() {
    this.shared = !this.shared;
    this.filter();
  }

  valueClear() {
    this.close.emit(true);
  }
}
