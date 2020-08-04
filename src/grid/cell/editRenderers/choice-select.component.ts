import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewContainerRef,
  NgZone, ViewChild, ElementRef, Renderer2, AfterViewInit
} from "@angular/core";
import Popper from "popper.js";
import { debounceTime, filter, takeUntil } from "rxjs/operators";
import { FormControl } from "@angular/forms";
import { fromEvent } from "rxjs";
import { untilDestroyed } from "ngx-take-until-destroy";

@Component({
  selector: "choice-select",
  template: `
    <div class="dropdown">
      <div class="select-trigger"
           (click)="open(dropdown, origin)" #origin>

        <ng-template [ngIf]="!isOpen" [ngIfElse]="searchTpl">
          {{ label }}
        </ng-template>

        <ng-template #searchTpl>
          <input [formControl]="searchControl"
                 placeholder="Search..." autofocus
                 (click)="$event.stopPropagation()">
        </ng-template>

      </div>

      <ng-template #dropdown>

        <div class="select-menu">

          <cdk-virtual-scroll-viewport itemSize="32" class="select-menu-inner"
                                       [style.height.px]="visibleOptions * 32">

            <div *ngIf="!options.length" class="no-results-item">No results found...</div>

            <div *cdkVirtualFor="let option of filterOptions" class="select-item"
                 [class.active]="isActive(option)"
                 (click)="select(option)">
              <ng-template [ngIf]="!optionTpl">{{option[labelKey]}}</ng-template>
              <ng-template *ngTemplateOutlet="optionTpl; context: {$implicit: option}"></ng-template>
            </div>
          </cdk-virtual-scroll-viewport>

        </div>

      </ng-template>


    </div>
  `,
  styles: [`
    .select-menu {
      color: #212529;
      text-align: left;
      list-style: none;
      overflow-x: hidden;
      background-color: #fff;
      border: 1px solid rgba(0, 0, 0, .15);
    }

    :host {
      width: 100%;
    }

    .select-trigger {
      border: 1px solid lightgray;
      text-align: left;
      padding: 1px;
      font-size: 14px;
      color: #212529;
      cursor: pointer;
    }

    .select-menu-inner {
      max-height: 128px;
    }

    input:focus {
      outline: none;
    }

    input {
      border: none;
      width: 100%;
      font-size: 14px;
    }

    .select-item:hover {
      background-color: whitesmoke;
    }

    .select-item:active {
      background-color: #a8cee7;
      color: #fff;
    }

    .select-item {
      height: 32px;
      display: flex;
      align-items: center;
      padding: 0 7px;
      cursor: pointer;
      font-size: 9px;
      
    }
    input, select {
      height: auto;
    }

    .no-results-item {
      height: 32px;
      display: flex;
      align-items: center;
      padding: 0 7px;
      font-size: 14px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChoiceSelectComponent implements OnInit, OnDestroy {
  @Input() model;
  @Input() labelKey = "display";
  @Input() idKey = "id";
  private _options: any[];
  @Input() set options(val: any[]) {
    this._options = val;
    this.filterOptions = [...this._options];
  }
  get options(): any[] {
    return  this._options;
  }
  @Input() optionTpl: TemplateRef<any>;
  @Output() selectChange = new EventEmitter();
  @Output() closed = new EventEmitter();

  public visibleOptions = 4;
  searchControl = new FormControl();

  private view: EmbeddedViewRef<any>;
  private popperRef: Popper;
  private filterOptions = [];

  constructor(private vcr: ViewContainerRef, private zone: NgZone, private cdr: ChangeDetectorRef,
              private renderer: Renderer2) {}

  get isOpen() {
    return !!this.popperRef;
  }
  private handleClickOutside() {
    fromEvent(document, "click")
        .pipe(
            filter(({ target }) => {
              const origin = this.popperRef.reference as HTMLElement;
              return origin.contains(target as HTMLElement) === false;
            }),
            takeUntil(this.closed)
        )
        .subscribe(() => {
          this.close();
          if(!this.cdr["destroyed"]) {
            this.cdr.detectChanges();
          }
        });
  }

  // tslint:disable-next-line:member-ordering
  ngOnInit() {
    if (this.model !== undefined) {
      this.model = this.options.find(currentOption => currentOption[this.idKey] === this.model);

      if(!this.model) {
        this.model = this.options.find(currentOption => currentOption === this.model);
      }
    }


    this.searchControl.valueChanges
        .pipe(
            debounceTime(300),
            untilDestroyed(this)
        )
        .subscribe(term => this.search(term));
  }
  search(value: string) {
    this.filterOptions = this.options.filter(option => option[this.labelKey].includes(value));
    requestAnimationFrame(() => (this.visibleOptions = this.options.length || 1));
  }
  select(option) {
    this.model = option;
    this.selectChange.emit(option[this.idKey] ? option[this.idKey] : option ? option : "");
    // the handleClickOutside function will close the dropdown
  }

  isActive(option) : boolean {
    if (!this.model) {
      return false;
    }
    return (option[this.idKey] === this.model[this.idKey] || option === this.model);
  }



  get label() {
    return this.model && this.model[this.labelKey] ? this.model[this.labelKey] : this.model ? this.model : "Select...";
  }

  open(dropdownTpl: TemplateRef<any>, origin: HTMLElement) {
    this.view = this.vcr.createEmbeddedView(dropdownTpl);
    const dropdown = this.view.rootNodes[0];

    document.body.appendChild(dropdown);
    dropdown.style.width = `${origin.offsetWidth}px`;

    this.zone.runOutsideAngular(() => {
      this.popperRef = new Popper(origin, dropdown, {
        removeOnDestroy: true
      });
    });

    this.handleClickOutside();
  }

  close() {
    this.closed.emit();
    this.popperRef.destroy();
    this.view.destroy();
    this.searchControl.patchValue("");
    this.view = null;
    this.popperRef = null;
  }


  ngOnDestroy() {
    this.cdr.detach();
  }
}
