import {
  ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, HostListener, Input, Renderer2,
  ViewContainerRef, OnDestroy
} from "@angular/core";

import { of } from 'rxjs';
import { delay } from 'rxjs/internal/operators';
import {untilDestroyed} from "ngx-take-until-destroy";

import {HciFilterDto, HciSortDto} from "hci-ng-grid-dto";

import {Column} from "./column";
import {GridService} from "../services/grid.service";
import {FilterRenderer} from "./filterRenderers/filter-renderer";

/**
 * Renders the column title and controls icons for filtering and sorting.
 */
@Component({
  selector: "hci-column-header",
  template: `
    <div (click)="doSort($event)"
         style="display: flex; flex-wrap: nowrap; width: inherit; align-items: center; padding-left: 8px; margin-top: auto; margin-bottom: auto;">
      <span id="header-text"
            class="hci-grid-header-text"
            (mouseover)="onMouseOver($event)"
            (mouseout)="onMouseOut($event)">
        {{ column.name }}
      </span>
      <span id="hidden-header-text" style="visibility: hidden; position: absolute;">
        {{ column.name }}
      </span>
      <div class="sort-icon"
           style="display: flex; flex-wrap: nowrap;">
        <div [id]="'filter-' + column.id" *ngIf="column.filterRenderer">
          <a id="filterDropdownToggle"
             (click)="$event.stopPropagation(); showFilter();"
             class="dropdown-toggle"
             [style.color]="hasFilters > 0 ? '#00aa00' : 'inherit'">
            <i class="fas fa-filter"></i>
          </a>
        </div>
        <div [id]="'sort-' + column.id" *ngIf="column.sortable" class="sort-icon" [class.primary]="firstSort">
          <span *ngIf="asc === 1"><span class="fas fa-arrow-alt-circle-up"></span></span>
          <span *ngIf="asc === -1"><span class="fas fa-arrow-alt-circle-down"></span></span>
        </div>
      </div>
    </div>
  `,
  styles: [`

    .sort-icon {
      margin-left: auto;
      padding-right: 5px;
    }

    .dropdown-toggle::after {
      display: none;
    }
    
    .hci-grid-header-text {
      text-overflow: ellipsis;
      overflow-x: hidden;
    }
  `],
})
export class ColumnHeaderComponent implements OnDestroy {

  @Input() column: Column;
  @Input("container") headerContainer: ViewContainerRef;

  asc: number = 0;
  firstSort: boolean = false;
  hasFilters: boolean = false;

  private showPopup: boolean = false;
  private popup: HTMLElement;
  private headerText: HTMLElement;
  private hiddenHeaderText: HTMLElement;
  private filterComponent: FilterRenderer;

  constructor(private gridService: GridService,
              private resolver: ComponentFactoryResolver,
              private changeDetectorRef: ChangeDetectorRef,
              private el: ElementRef,
              private renderer: Renderer2) {}

  ngOnInit() {
    if (this.column.filterRenderer) {
      of(undefined).pipe(delay(0)).subscribe(() => {
        let factory = this.resolver.resolveComponentFactory(this.column.filterRenderer);
        this.filterComponent = this.headerContainer.createComponent(factory).instance;
        this.filterComponent.column = this.column;
        this.filterComponent.setConfig(this.column.filterConfig);
        this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "display", "none");
        this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "position", "absolute");
        this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "z-index", "50");
        this.filterComponent.close.pipe(untilDestroyed(this)).subscribe((closed: boolean) => {
          this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "display", "none");
        });
      });
    }

    this.headerText = this.el.nativeElement.querySelector("#header-text");
    this.hiddenHeaderText = this.el.nativeElement.querySelector("#hidden-header-text");

    this.gridService.getFilterMapSubject().pipe(untilDestroyed(this)).subscribe((filterMap: Map<string, HciFilterDto[]>) => {
      if (this.column) {
        if (filterMap.has(this.column.field)) {
          this.hasFilters = filterMap.get(this.column.field).filter((filterInfo: HciFilterDto) => {
            return filterInfo.valid;
          }).length === 0 ? false : true;
        }
      }
    });

    this.gridService.sortsSubject.pipe(untilDestroyed(this)).subscribe((sorts: HciSortDto[]) => {
      if (this.column.field === "GROUP_BY") {
        this.firstSort = true;
        this.asc = 0;

        if (sorts.length > 0) {
          this.asc = (sorts[0].asc) ? 1 : -1;
        }
      } else {
        this.firstSort = false;
        this.asc = 0;

        for (let i = 0; i < sorts.length; i++) {
          if (this.column.field === sorts[i].field) {
            if (sorts[i].asc) {
              this.asc = 1;
            } else {
              this.asc = -1;
            }

            if (i === 0) {
              this.firstSort = true;
            }

            break;
          }
        }
      }
    });
  }
  
  ngOnDestroy() {}

  ngAfterViewInit(): void {
    this.changeDetectorRef.detectChanges();
    if(this.column.reverseDefaultSort) {
      this.doDefaultReverseSort();
      this.column.reverseDefaultSort = !this.column.reverseDefaultSort;
    }
  }

  showFilter() {
    this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "display", "inherit");
    let wHost: number = this.filterComponent.width;
    let mainContent: number = (<HTMLElement>this.el.nativeElement.closest("#main-content")).offsetWidth;
    let xView: number = (<HTMLElement>this.el.nativeElement.closest(".header-view")).offsetLeft;
    let x: number = xView + this.el.nativeElement.offsetLeft + this.el.nativeElement.offsetWidth - 30;
    if (x + wHost > mainContent) {
      x = mainContent - wHost;
    }
    this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "margin-top", "30px");
    this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "margin-left", x + "px");
  }

  doSort(event: MouseEvent) {
    if (this.column.sort && event.ctrlKey) {
      this.gridService.addSort(this.column.field, true);
    } else if (this.column.sort) {
      this.gridService.addSort(this.column.field);
    }
  }

  // Call the sort function twice, because
  // the first time only sorts it out with ascendance.
  doDefaultReverseSort() {
    this.gridService.addSort(this.column.field);
    this.gridService.addSort(this.column.field);
  }

  onMouseOver(event: MouseEvent): void {
    if (Math.floor(this.headerText.offsetWidth) !== Math.floor(this.hiddenHeaderText.offsetWidth)) {
      this.showPopup = true;
    }

    if (this.showPopup) {
      this.popup = this.renderer.createElement("div");
      this.renderer.addClass(this.popup, "hci-grid");
      let themes: string[] = this.gridService.getConfigSubject().getValue().theme.split(" ");
      for (let theme of themes) {
        this.renderer.addClass(this.popup, theme);
      }
      this.renderer.addClass(this.popup, "column-header-tooltip");
      this.renderer.setStyle(this.popup, "height", this.el.nativeElement.offsetHeight);
      this.renderer.setStyle(this.popup, "position", "absolute");
      this.renderer.setStyle(this.popup, "z-index", "9000");
      this.renderer.setStyle(this.popup, "left", (event.clientX + 5) + "px");
      this.renderer.setStyle(this.popup, "top", (event.clientY + 5) + "px");
      this.renderer.appendChild(this.popup, this.renderer.createText(this.column.name));

      this.renderer.appendChild(document.body, this.popup);
    }
  }

  onMouseOut(event: MouseEvent): void {
    if (this.showPopup) {
      this.renderer.removeChild(document.body, this.popup);
    }
  }

  @HostListener("document:click", ["$event"])
  private clickout(event) {
    if (!this.el.nativeElement.contains(event.target) && this.filterComponent) {
      this.renderer.setStyle(this.filterComponent.elementRef.nativeElement, "display", "none");
    }
  }
}
