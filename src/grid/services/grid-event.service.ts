import {Injectable, isDevMode} from "@angular/core";
import { Subject, Observable } from "rxjs/Rx";

import { GridConfigService } from "./grid-config.service";
import { GridDataService } from "./grid-data.service";
import { Point } from "../utils/point";
import { Range } from "../utils/range";
import { EventMeta } from "../utils/event-meta";

@Injectable()
export class GridEventService {
  private nColumns: number = 0;
  private _currentLocation: Point = new Point(-1, 0, -1);
  private selectedLocation = new Subject<Point>();
  private selectedLocationObservable = this.selectedLocation.asObservable();

  private _currentRange: Range = null;
  private selectedRange = new Subject<Range>();
  private selectedRangeObservable = this.selectedRange.asObservable();

  constructor(private gridConfigService: GridConfigService, private gridDataService: GridDataService) {}

  get currentRange(): Range {
    return this._currentRange;
  }

  setNColumns(nColumns: number) {
    this.nColumns = nColumns;
  }

  setSelectedLocation(location: Point, eventMeta: EventMeta) {
    if (!this.gridConfigService.gridConfiguration.cellSelect) {
      return;
    }

    if (this._currentRange == null) {
      this._currentRange = new Range(location, location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta == null || eventMeta.isNull()) {
      this._currentRange.setInitial(location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta.ctrl) {
      this._currentRange.update(location);
      this.selectedRange.next(this._currentRange);
    }
  }

  setSelectedRange(location: Point, eventMeta: EventMeta) {
    if (!this.gridConfigService.gridConfiguration.cellSelect) {
      return;
    }
    this._currentLocation = location;

    if (this._currentRange == null) {
      this._currentRange = new Range(location, location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta == null || eventMeta.isNull()) {
      this._currentRange.setInitial(location);
      this.selectedRange.next(this._currentRange);
    } else if (eventMeta.ctrl) {
      this._currentRange.update(location);
      this.selectedRange.next(this._currentRange);
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
    if (isDevMode()) {
      console.debug("GridEventService.arrowFrom %i %i %o %o", dx, dy, this.gridConfigService.gridConfiguration.cellSelect, this.gridConfigService.gridConfiguration.keyNavigation);
    }

    if (!this.gridConfigService.gridConfiguration.cellSelect || !this.gridConfigService.gridConfiguration.keyNavigation) {
      return;
    }
    this._currentLocation = location;

    let tries: number = this.gridConfigService.gridConfiguration.columnDefinitions.length;
    do {
      if (tries === 0) {
        this._currentLocation.i = 0;
        this._currentLocation.j = 0;
        this._currentLocation.k = 0;
        break;
      }

      if (dy > 0 && this.gridDataService.getRowGroup(this._currentLocation.i).length() === this._currentLocation.j + dy) {
        this._currentLocation.i = this._currentLocation.i + dy;
        this._currentLocation.j = 0;
      } else if (dy > 0) {
        this._currentLocation.j = this._currentLocation.j + dy;
      } else if (dy < 0 && this._currentLocation.j > 0) {
        this._currentLocation.j = this._currentLocation.j + dy;
      } else if (dy < 0 && this._currentLocation.j === 0) {
        this._currentLocation.i = this._currentLocation.i + dy;
        if (this._currentLocation.i < 0) {
          this._currentLocation = new Point(-1, 0, -1);
        } else {
          this._currentLocation.j = this.gridDataService.getRowGroup(this._currentLocation.i).length() - 1;
        }
      } else if (dx !== 0) {
        this._currentLocation.k = this._currentLocation.k + dx;
        this._currentLocation.i = Math.max(0, this._currentLocation.i);
        this._currentLocation.j = Math.max(0, this._currentLocation.j);
        //this._currentLocation.k = Math.max(0, this._currentLocation.k);

        if (this._currentLocation.k === this.nColumns) {
          this._currentLocation.k = 0;

          if (this.gridDataService.getRowGroup(this._currentLocation.i).length() === this._currentLocation.j + 1) {
            this._currentLocation.i = this._currentLocation.i + 1;
            this._currentLocation.j = 0;
          } else {
            this._currentLocation.j = this._currentLocation.j + 1;
          }
        } else if (this._currentLocation.k < 0) {
          this._currentLocation.k = this.gridConfigService.gridConfiguration.columnDefinitions.length - 1;
          if (this._currentLocation.j > 0) {
            this._currentLocation.j = this._currentLocation.j - 1;
          } else if (this._currentLocation.i === 0) {
            this._currentLocation.k = this.gridConfigService.gridConfiguration.columnDefinitions.length - 1;
          } else {
            this._currentLocation.i = this._currentLocation.i - 1;
          }
        }
      }

      tries = tries - 1;
    } while (this._currentLocation.k >= 0 && !this.gridConfigService.gridConfiguration.columnDefinitions[this._currentLocation.k].visible);

    if (this.gridDataService.getRowGroup(this._currentLocation.i) === null) {
      this._currentLocation = new Point(-1, 0, -1);
    }

    this.selectedLocation.next(this._currentLocation);
  }

  tabFrom(location: Point, eventMeta: EventMeta) {
    if (!this.gridConfigService.gridConfiguration.cellSelect || !this.gridConfigService.gridConfiguration.keyNavigation) {
      return;
    }
    this.arrowFrom(location, 1, 0, eventMeta);
  }

  getSelectedLocationObservable(): Observable<Point> {
    return this.selectedLocationObservable;
  }

  getSelectedRangeObservable(): Observable<Range> {
    return this.selectedRangeObservable;
  }
}
