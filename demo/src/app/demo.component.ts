/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {Component} from "@angular/core";

declare const VERSION: string;

/**
 * The demo will route to many different types of grids depending on what features are to be shown.
 *
 * Currently there is a simple grid, inline editing, and row grouping.  Each grid will have its own module
 * route and component.  The component will store the demo data, column definitions, and any other configuration
 * specific to that grid.
 */
@Component({
  selector: "demo",
  template: `
    <div class="navbar navbar-dark bg-dark box-shadow">
      <div class="d-flex flex-grow-1 justify-content-between">
        <a class="navbar-brand d-flex align-items-center" routerLink="/">hci-ng-grid Demo</a>
        <span class="d-flex" style="color: gray; margin-left: 0; margin-right: auto; align-items: center;">v{{version}}</span>
        <div class="mr-3">
          <button class="btn btn-outline-primary white" routerLink="/docs">Documentation</button>
        </div>
        <div class="d-inline-block">
          <button class="btn btn-outline-primary white" [matMenuTriggerFor]="routeList">Select A Demo</button>
          <mat-menu #routeList="matMenu" class="config">
            <a class="dropdown-item" routerLink="/">Home</a>
            <a class="dropdown-item" routerLink="/alerts">Alerts</a>
            <a class="dropdown-item" routerLink="/auto-calc-page-size">Auto-Calc Page Size</a>
            <a class="dropdown-item" routerLink="/busy">Busy</a>
            <a class="dropdown-item" routerLink="/popup">Cell Popup</a>
            <a class="dropdown-item" routerLink="/copypaste">Copy/Paste</a>
            <a class="dropdown-item" routerLink="/data-types">Data Types</a>
            <a class="dropdown-item" routerLink="/date">Date Formatting</a>
            <a class="dropdown-item" routerLink="/dynamic-config">Dynamic Config</a>
            <a class="dropdown-item" routerLink="/empty">Empty Grid</a>
            <a class="dropdown-item" routerLink="/event">Event Listeners</a>
            <a class="dropdown-item" routerLink="/external-ctrl">External Control</a>
            <a class="dropdown-item" routerLink="/external-data">External Sort/Filter/Page</a>
            <a class="dropdown-item" routerLink="/edit">Inline Edit and Key Nav</a>
            <a class="dropdown-item" routerLink="/filter">Filtering</a>
            <a class="dropdown-item" routerLink="/fixed">Fixed Columns</a>
            <a class="dropdown-item" routerLink="/linked">Linked Grids</a>
            <a class="dropdown-item" routerLink="/new-row">New Row</a>
            <a class="dropdown-item" routerLink="/paging">Paging</a>
            <a class="dropdown-item" routerLink="/resize">Resize</a>
            <a class="dropdown-item" routerLink="/row-group">Row Grouping</a>
            <a class="dropdown-item" routerLink="/row-select">Row Select</a>
            <a class="dropdown-item" routerLink="/saving">Saving Data</a>
            <a class="dropdown-item" routerLink="/simple">Simple</a>
            <a class="dropdown-item" routerLink="/theming">Themes</a>
            <a class="dropdown-item" routerLink="/validation">Validation</a>
          </mat-menu>
        </div>
      </div>
    </div>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [ `
    a {
      color: black;
    }
  ` ]
})
export class DemoComponent {

  version: string = VERSION;

}
