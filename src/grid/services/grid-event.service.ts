import {Injectable, isDevMode} from "@angular/core";
import {Subject} from "rxjs/Rx";

import {GridService} from "./grid.service";
import {Point} from "../utils/point";
import {Range} from "../utils/range";
import {EventMeta} from "../utils/event-meta";
import {RowChange} from "../utils/row-change";

export const CLICK = 0;
export const TAB = 1;
export const ARROW = 2;

/**
 * This service specifically handles events such as key strokes and clicks when such events change what cell or cells
 * are selected.  It also then emits the new selected cell or range of cells so the grid can update rendering.
 */
@Injectable()
export class GridEventService {

  private nColumns: number = 0;
  private selectedLocation: Point = new Point(-1, -1);
  private selectedLocationSubject = new Subject<Point>();

  private unselectSubject = new Subject<Point>();

  private currentRange: Range = null;
  private selectedRange = new Subject<Range>();

  private lastDx: number = 0;
  private lastDy: number = 0;
  private lastEvent: number = null;

  constructor(private gridService: GridService) {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.gridService.id + ": GridEventService constructor");
    }
  }

  getCurrentRange(): Range {
    return this.currentRange;
  }

  getSelectedLocation(): Point {
    return this.selectedLocation;
  }

  setNColumns(nColumns: number) {
    this.nColumns = nColumns;
  }

  setCurrentLocation(location: Point) {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.gridService.id + ": GridEvent.setCurrentLocation: " + (location === null ? "null" : location.toString()));
    }

    this.selectedLocation = location;
    this.selectedLocationSubject.next(this.selectedLocation);
  }

  clearSelectedLocation() {
    this.setSelectedLocation(new Point(-1, -1), null);
    this.currentRange = null;
    this.selectedRange.next(this.currentRange);
  }

  setMouseDragSelected(location: Point) {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.gridService.id + ": setMouseOnDownSelected: " + ((location !== null) ? location.toString() : "null"));
    }

    if (location === null) {
      return;
    }

    if (this.currentRange === null) {
      this.currentRange = new Range(location, location);
    } else {
      this.currentRange.update(location);
    }
    this.selectedRange.next(this.currentRange);
  }

  setSelectedLocation(location: Point, eventMeta: EventMeta) {
    if (isDevMode()) {
      console.debug("hci-grid: " + this.gridService.id + ": GridEvent.setSelectedLocation");
    }

    if (location === null) {
      return;
    } else if (location.isNegative()) {
      this.setCurrentLocation(location);
    } else if (!this.gridService.isColumnSelectable(location.j)) {
      return;
    } else if (eventMeta === null) {
      this.setCurrentLocation(location);
    }
  }

  setSelectedRange(location: Point, eventMeta: EventMeta) {
    this.selectedLocation = location;

    if (this.currentRange == null) {
      this.currentRange = new Range(location, location);
      this.selectedRange.next(this.currentRange);
    } else if (eventMeta == null || eventMeta.isNull()) {
      this.currentRange.setInitial(location);
      this.selectedRange.next(this.currentRange);
    } else if (eventMeta.ctrl) {
      this.currentRange.update(location);
      this.selectedRange.next(this.currentRange);
    }
  }

  /**
   * Called when an arrow key is pressed from the cell at i and j.
   *
   * @param {number} i
   * @param {number} j
   * @param {number} keyCode
   */
  arrowFromLocation(i: number, j: number, keyCode: number) {
    if (keyCode === 37) {
      this.arrowFrom(new Point(i, j), -1, 0, null);
    } else if (keyCode === 39) {
      this.arrowFrom(new Point(i, j), 1, 0, null);
    } else if (keyCode === 38) {
      this.arrowFrom(new Point(i, j), 0, -1, null);
    } else if (keyCode === 40) {
      this.arrowFrom(new Point(i, j), 0, 1, null);
    }
  }

  /**
   * Changes the current location based on the location passed to it plus the direction of the arrow key.  For example,
   * dx=-1 and dy=0 in the case of a left arrow click.  If the new location is greater than the number of columns, then
   * move to the next row down.  If the column is NOT visible, then keep iterating dx+1 until there is a visible one.
   *
   * @param location
   * @param dx
   * @param dy
   */
  arrowFrom(location: Point, dx: number, dy: number, eventMeta: EventMeta) {
    this.lastEvent = ARROW;

    if (location !== null) {
      this.selectedLocation = location;
    } else if (this.selectedLocation.isNegative()) {
      this.selectedLocation = new Point(0, 0);
      this.selectedLocationSubject.next(this.selectedLocation);
      return;
    }

    let oldRowNum: number = this.selectedLocation.i;

    this.lastDx = dx;
    this.lastDy = dy;

    if (dx !== 0) {
      do {
        this.selectedLocation.j = this.selectedLocation.j + dx;
        if (this.selectedLocation.j >= this.gridService.getNVisibleColumns()) {
          this.selectedLocation.i = this.selectedLocation.i + 1;
          this.selectedLocation.j = 0;
        }
        if (this.selectedLocation.j < 0) {
          this.selectedLocation.i = this.selectedLocation.i - 1;
          this.selectedLocation.j = this.gridService.getNVisibleColumns() - 1;
        }
      } while (!this.gridService.isColumnSelectable(this.selectedLocation.j));
    } else {
      this.selectedLocation.i = this.selectedLocation.i + dy;
    }

    if (this.gridService.getRow(this.selectedLocation.i) === null
        || this.selectedLocation.isNegative()
        || !this.gridService.isColumnSelectable(this.selectedLocation.j)) {
      this.selectedLocation = new Point(-1, -1);
    }

    if (oldRowNum !== -1 && this.selectedLocation.i !== -1 && oldRowNum !== this.selectedLocation.i) {
      this.gridService.getRowChangedSubject().next(new RowChange(oldRowNum, this.selectedLocation.i));
    }

    if (isDevMode()) {
      console.debug("hci-grid: " + this.gridService.id + ": arrowFrom: to: " + this.selectedLocation.toString());
    }

    this.selectedLocationSubject.next(this.selectedLocation);
  }

  tabFrom(location: Point, eventMeta: EventMeta) {
    this.lastEvent = TAB;

    if (location === null) {
      this.arrowFrom(this.selectedLocation, 1, 0, eventMeta);
    } else {
      this.arrowFrom(location, 1, 0, eventMeta);
    }
  }

  repeatLastEvent() {
    if (this.lastEvent !== null) {
      if (this.lastEvent === TAB) {
        this.tabFrom(null, null);
      } else if (this.lastEvent === ARROW) {
        this.arrowFrom(null, this.lastDx, this.lastDy, null);
      } else {
        this.selectedLocation = new Point(-1, -1);
        this.selectedLocationSubject.next(this.selectedLocation);
      }
    } else {
      this.selectedLocation = new Point(-1, -1);
      this.selectedLocationSubject.next(this.selectedLocation);
    }
  }

  getLastDx(): number {
    return this.lastDx;
  }

  getLastDy(): number {
    return this.lastDy;
  }

  getUnselectSubject(): Subject<Point> {
    return this.unselectSubject;
  }

  getSelectedLocationSubject(): Subject<Point> {
    return this.selectedLocationSubject;
  }

  getSelectedRange(): Subject<Range> {
    return this.selectedRange;
  }

  isLastEventArrow(): boolean {
    return this.lastEvent !== null && this.lastEvent === ARROW;
  }

  isLastEventClick(): boolean {
    return this.lastEvent !== null && this.lastEvent === CLICK;
  }

  isLastEventTab(): boolean {
    return this.lastEvent !== null && this.lastEvent === TAB;
  }
}
