import {Cell} from "../cell/cell";

/**
 *
 */
export class Row {

  cells: Array<Cell> = new Array<Cell>();
  data: Object = {};
  header: any = null;
  size: number = 1;

  HIDDEN: number = 0;
  COLLAPSED: number = 1;
  EXPANDED: number = 2;
  state: number = this.EXPANDED;

  i: number;
  private _key: any;
  private _rowNum: number;
  private _selected: boolean = false;
  private _visible: boolean = true;

  equals(row: Row, compareIndexes: Array<number>): boolean {
    if (this.length() !== row.length()) {
      return false;
    }
    let v: number = 0;
    for (var i = 0; i < compareIndexes.length; i++) {
      if (typeof this.get(compareIndexes[i]).value === "number") {
        v = this.get(compareIndexes[i]).value - row.get(compareIndexes[i]).value;
      } else if (typeof this.get(compareIndexes[i]).value === "string") {
        if (this.get(compareIndexes[i]).value < row.get(compareIndexes[i]).value) {
          v = -1;
        } else if (this.get(compareIndexes[i]).value > row.get(compareIndexes[i]).value) {
          v = 1;
        }
      }
      if (v !== 0) {
        return false;
      }
    }
    return true;
  }

  isDirty(): boolean {
    for (let cell of this.cells) {
      if (cell.dirty) {
        return true;
      }
    }

    return false;
  }

  createHeader(headerColumns: Array<number>) {
    this.header = null;
    for (var i = 0; i < headerColumns.length; i++) {
      this.header = this.header === null ? this.cells[headerColumns[i]].value : this.header + ", " + this.cells[headerColumns[i]].value;
    }
  }

  getConcatenatedCells() {
    let all: string = null;
    for (let cell of this.cells) {
      all = (all === null) ? cell.value : all + ", " + cell.value;
    }
    return all;
  }

  add(cell: Cell) {
    this.cells.push(cell);
  }

  get(i: number): Cell {
    return this.cells[i];
  }

  hasHeader(): boolean {
    return this.header !== null;
  }

  isExpanded(): boolean {
    return this.state === this.EXPANDED;
  }

  isCollaposed(): boolean {
    return this.state === this.COLLAPSED;
  }

  getHeader(): any {
    return this.header;
  }

  setHeader(header: any) {
    this.header = header;
  }

  length(): number {
    return this.cells.length;
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(visible: boolean) {
    this._visible = visible;
  }

  get key(): any {
    return this._key;
  }

  set key(key: any) {
    this._key = key;
  }

  get rowNum(): any {
    return this._rowNum;
  }

  set rowNum(rowNum: any) {
    this._rowNum = rowNum;
  }

  get selected(): any {
    return this._selected;
  }

  set selected(selected: any) {
    this._selected = selected;
  }
}
