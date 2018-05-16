/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {async, inject, TestBed} from "@angular/core/testing";

import {} from "jasmine";

import {GridModule} from "../grid.module";
import {GridComponent} from "../grid.component";
import {Row} from "../row/row";
import {Column} from "../column/column";

/**
 * @since 1.0.0
 */
describe("DashboardComponent Tests", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        GridModule
      ]
    });
  });

  it ("Grid should be empty.", () => {
    let fixture = TestBed.createComponent(GridComponent);
    let grid = fixture.componentInstance;

    expect(grid.getGridService().getOriginalDataSize()).toBe(0);
  });

  /*it ("Grid should have 5 rows.", (done) => {
    let fixture = TestBed.createComponent(GridComponent);
    let grid = fixture.componentInstance;

    grid.columnDefinitions = [ new Column({ field: "a", name: "a" }) ]
    grid.boundData = [
      {a: "A"}, {a: "B"}, {a: "C"}, {a: "D"}, {a: "E"}
    ];
    fixture.detectChanges();

    grid.getGridService().viewDataSubject.subscribe((data: Row[]) => {
      expect(data[4].key).toBe("E");
      done();
    });
  });*/

});
