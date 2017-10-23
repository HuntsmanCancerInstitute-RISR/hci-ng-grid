import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef,
  EventEmitter, Input, Output, Type, ViewChild, ViewContainerRef, ViewEncapsulation
} from "@angular/core";

import { Cell } from "../cell/cell";
import { Point } from "../utils/point";
import { EventMeta } from "../utils/event-meta";
import { GridConfigService } from "../services/grid-config.service";
import { GridEventService } from "../services/grid-event.service";
import { GridDataService } from "../services/grid-data.service";
import { CellTemplate } from "./cell-template.component";
import {LabelCell} from "./label-cell.component";

/**
 * A Cell represents an i, j, and k position in a grid.  This component binds the grid data for that position.  Rendering of
 * the data is left to a dynamically generated template which extends the CellTemplate class.  By default the DefaultCell
 * class is used which simply renders the value in a span.
 */
@Component({
  selector: "hci-cell",
  template: `
    <input #focuser style="position: absolute; left: -1000px;" (focus)="onFocuser();" (keydown)="onFocuserKeyDown($event)" />
    <div (click)="cellClick($event)"
         class="hci-grid-cell-parent">
      <span #template style="display: none;"></span>
    </div>
  `,
  styles: [ `
    .hci-grid-cell-parent {
      height: 100%;
    }
    .hci-grid-cell-template {
      display: inline-block;
      width: 100%;
      height: 100%;
      background-color: transparent;
      padding-left: 8px;
    }
    .hci-grid-cell-template.ng-invalid {
      background-color: #ffeeee;
    }
    .hci-grid-cell-template.selected {
      background-color: #ffff99;
    }
    .hci-grid-cell-template.focused {
      background-color: #ccddff;
    }
  ` ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CellComponent {

  @Input() type: string = "LabelCell";
  @Input() i: number;
  @Input() j: number;
  @Input() k: number;

  @Output() valueChange: EventEmitter<Object> = new EventEmitter<Object>();

  @Output() cellFocused: EventEmitter<Object> = new EventEmitter<Object>();
  @Output() onUDLR: EventEmitter<Object> = new EventEmitter<Object>();

  format: string = null;

  private isViewInitialized: boolean = false;

  @ViewChild("template", { read: ViewContainerRef })
  private template: any;

  @ViewChild("focuser") private focuser: ElementRef;

  private component: any = null;
  private data: Cell;
  private componentRef: CellTemplate = null;

  constructor(private resolver: ComponentFactoryResolver, private gridEventService: GridEventService, private gridConfigService: GridConfigService, private gridDataService: GridDataService, private changeDetectorRef: ChangeDetectorRef) {}

  ngAfterContentInit() {
    this.type = this.gridConfigService.gridConfiguration.columnDefinitions[this.k].template;
    this.component = this.gridConfigService.gridConfiguration.columnDefinitions[this.k].component;
    this.format = this.gridConfigService.gridConfiguration.columnDefinitions[this.k].format;
    this.isViewInitialized = true;
    this.createComponent();

    this.gridDataService.cellDataUpdateObserved.subscribe((range) => {
      if (range != null && range.contains(new Point(this.i, this.j, this.k))) {
        if (this.componentRef.valueable) {
          this.data = this.gridDataService.getCell(this.i, this.j, this.k);
          this.componentRef.setValue(this.data.value);
          this.gridDataService.handleValueChange(this.i, this.j, this.data.key, this.k, this.data.value);
          this.changeDetectorRef.markForCheck();
        }
      }
    });

    if (this.gridConfigService.gridConfiguration.cellSelect) {
      this.gridEventService.getSelectedRangeObservable().subscribe((range) => {
        if (range === null) {
          this.onFocusOut();
        } else if (range.contains(new Point(this.i, this.j, this.k))) {
          if (this.gridConfigService.gridConfiguration.columnDefinitions[this.k].visible) {
            this.onFocus();
          }
        } else {
          this.onFocusOut();
        }
      });

      this.gridEventService.getSelectedLocationObservable().subscribe((location) => {
        if (location === null) {
          this.onFocusOut();
        } else if (location.equalsIJK(this.i, this.j, this.k)) {
          if (this.gridConfigService.gridConfiguration.columnDefinitions[this.k].visible) {
            this.onFocus();
          } else {
            this.gridEventService.arrowFrom(location, 1, 0, null);
          }
        } else {
          this.onFocusOut();
        }
      });

      this.onFocusOut();
    }
  }

  cellClick(event: MouseEvent) {
    if (this.gridConfigService.gridConfiguration.cellSelect && !this.componentRef.handleClick) {
      this.gridEventService.setSelectedRange(new Point(this.i, this.j, this.k), new EventMeta(event.altKey, event.ctrlKey, event.shiftKey));
    }
  }

  onFocuser() {
    if (this.gridConfigService.gridConfiguration.cellSelect) {
      if (this.type === "LabelCell") {
        this.componentRef.onFocus();
      } else {
        this.componentRef.onFocus();
      }
    }
  }

  /**
   * Every Cell contains an input that is positioned off the screen when the input is selected via a tab, we call the
   * CellTemplate's focus() to determine what to do.  By default this method is empty.  In the case of an input cell,
   * the input is focused.  In the case of a date, the datepicker popup is opened.
   */
  onFocus() {
    if (this.gridConfigService.gridConfiguration.cellSelect) {
      if (this.type === "LabelCell") {
        this.focuser.nativeElement.focus();
      }
      this.componentRef.onFocus();
      this.changeDetectorRef.markForCheck();
    }
  }

  onFocusOut() {
    if (this.gridConfigService.gridConfiguration.cellSelect) {
      this.componentRef.onFocusOut();
      this.changeDetectorRef.markForCheck();
    }
  }

  /**
   * The Cell stores a value double binded from the grid[i][j] data.  When we dynamically create a cell template, the
   * parent data is not passed down to the component reference.  Similarly, events emitted from the child are not
   * detectable here automatically.  What we do is pass our value to the component and subscribe to the component's
   * valueChange emitter.
   * This work is handled by the CellTemplate parent class, so any template class just has to include the following code
   * somewhere to make it work: [ngModel]="value" (ngModelChange)="onModelChange($event);"
   * Whatever the template is, such as an input, as it changes will adjust the model which will trigger a valueChange
   * event making this parent class aware that the model changed.
   */
  createComponent() {
    if(!this.isViewInitialized) {
      return;
    }
    if (this.componentRef !== null) {
      return;
    }

    let setIsGroup: boolean = false;
    if (this.gridConfigService.gridConfiguration.columnDefinitions[this.k].isGroup && this.j !== -1) {
      this.type = "LabelCell";
      setIsGroup = true;
    }

    if (this.component) {
      var factories = Array.from(this.resolver["_factories"].keys());
      var factoryClass = <Type<any>> factories.find((o: any) => o.name === this.component.constructor.name);
      let factory = this.resolver.resolveComponentFactory(factoryClass);

      this.componentRef = this.template.createComponent(factory).instance;
      this.componentRef.setValues(this.component);
    } else if (this.type) {
      var factories = Array.from(this.resolver["_factories"].keys());
      var factoryClass = <Type<any>> factories.find((o: any) => o.name === this.type);
      let factory = this.resolver.resolveComponentFactory(factoryClass);

      this.componentRef = this.template.createComponent(factory).instance;
      this.componentRef.setValues(this.component);
    } else {
      let factory = this.resolver.resolveComponentFactory(LabelCell);
      this.componentRef = this.template.createComponent(factory).instance;
    }

    if (this.j === -1 && this.componentRef.activeOnRowHeader) {
      this.componentRef.render = true;
    }

    this.componentRef.setFormat(this.format);

    if (setIsGroup) {
      this.componentRef.valueable = false;
    }

    if (this.componentRef.valueable) {
      this.data = this.gridDataService.getCell(this.i, this.j, this.k);
      this.componentRef.setValue(this.data.value);

      this.componentRef.valueChange.subscribe((value: Object) => {
        this.data.value = value;
        this.gridDataService.handleValueChange(this.i, this.j, this.data.key, this.k, value);
      });
    }

    if (this.gridConfigService.gridConfiguration.keyNavigation) {
      this.componentRef.keyEvent.subscribe((keyCode: number) => {
        this.onKeyDown(keyCode);
      });
      this.componentRef.tabEvent.subscribe((value: boolean) => {
        this.gridEventService.tabFrom(new Point(this.i, this.j, this.k), null);
      });
    }

    this.componentRef.inputFocused.subscribe((eventMeta: EventMeta) => {
      this.gridEventService.setSelectedRange(new Point(this.i, this.j, this.k), eventMeta);
    });

    if (this.gridConfigService.gridConfiguration.cellSelect) {
      this.componentRef.clickEvent.subscribe((eventMeta: EventMeta) => {
        this.gridEventService.setSelectedRange(new Point(this.i, this.j, this.k), eventMeta);
      });
    }
  }

  onKeyDown(keyCode: number) {
    if (this.gridConfigService.gridConfiguration.keyNavigation) {
      if (keyCode === 37) {
        this.gridEventService.arrowFrom(new Point(this.i, this.j, this.k), -1, 0, null);
      } else if (keyCode === 39) {
        this.gridEventService.arrowFrom(new Point(this.i, this.j, this.k), 1, 0, null);
      } else if (keyCode === 38) {
        this.gridEventService.arrowFrom(new Point(this.i, this.j, this.k), 0, -1, null);
      } else if (keyCode === 40) {
        this.gridEventService.arrowFrom(new Point(this.i, this.j, this.k), 0, 1, null);
      } else if (keyCode === 9) {
        this.onFocusOut();
      }
    }
  }

  onFocuserKeyDown(event: KeyboardEvent) {
    if (this.gridConfigService.gridConfiguration.keyNavigation) {
      if (this.type !== "LabelCell") {
        this.focuser.nativeElement.blur();
      }
      this.onKeyDown(event.keyCode);
    }
  }

}
