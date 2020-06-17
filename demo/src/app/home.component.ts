import {Component, HostBinding} from "@angular/core";

@Component({
  selector: "demo-home",
  template: `
    <div class="card full">
      <div class="card-header">
        Demo Home
      </div>
      <div class="card-body">
        The grid component has many different configuration options.  Therefore, there are a lot of different
        demos below illustrating different types of grids with different features.
        <br />
        Click on a card below to see that demo.
      </div>
    </div>
    <div class="card one-third"
         *ngFor="let demo of demos"
         (mouseenter)="demo.hover = true;"
         (mouseleave)="demo.hover = false;"
         [style.backgroundColor]="demo.hover ? '#ffddbb' : 'inherit'"
         [style.cursor]="demo.hover ? 'pointer' : 'inherit'"
         routerLink="/{{demo.route}}">
      <div class="card-header">
        {{demo.header}}
      </div>
      <div class="card-body">
        {{demo.body}}
      </div>
    </div>
  `,
  styles: [`
  
    .card {
      border: lightgray 1px solid !important;
    }
    
    .card.full {
      flex: 0 1 100%;
    }
  
    .card.one-third {
      flex: 0 0 32%;
    }
    
    .card-header {
      font-weight: bold;
      padding: .25rem 1.0rem;
    }
    
    .card-body {
      padding: 0.75rem;
    }
      
  `]
})
export class HomeComponent {

  @HostBinding("class") classList: string = "outlet-row y-auto card-group justify-content-between p-2";

  demos = [
    {header: "Alerts", route: "alerts", body: "Listen for warnings from the grid and manually deal with them."},
    {header: "Auto Calc Page Size", route: "auto-calc-page-size", body: "Determine number of rows for paging, based on available height"},
    {header: "Busy", route: "busy", body: "Shows the default and custom overlay shown when data is being fetched."},
    {header: "Cell Popup", route: "popup", body: "When text in cells is large, show the entire text in a popup.  Also, custom popups for complex objects."},
    {header: "Copy and Paste", route: "copypaste", body: "Copy and paste from within the grid and to and from spreadsheet software."},
    {header: "Data Types", route: "data-types", body: "See how different text, dates, numbers, choices, etc. can be configured."},
    {header: "Date", route: "date", body: "Built in options for handling dates."},
    {header: "Dynamic Config", route: "dynamic-config", body: "User has the power to custom configure the grid."},
    {header: "Empty", route: "empty", body: "What a grid looks like when bound to an empty array."},
    {header: "Event", route: "event", body: "Use event listeners to handle row selects and output information."},
    {header: "Excel Like Editing", route: "edit", body: "Inline editing with arrow keys, and tabbing."},
    {header: "External Control", route: "external-ctrl", body: "Control the grid through some external buttons."},
    {header: "External Data", route: "external-data", body: "Mock an external data call to simulate a REST endpoint."},
    {header: "Filtering", route: "filter", body: "Show different types of filter, for text, selects and ranges."},
    {header: "Fixed", route: "fixed", body: "With many columns, fix one or more to the left and leave the rest scrollable."},
    {header: "Linked Grids", route: "linked", body: "Two grids that are linked such as they share filters."},
    {header: "Paging", route: "paging", body: "Show examples of page sizes with large data."},
    {header: "Resize", route: "resize", body: "Show grid behavior when grid is resized by the window or programmatically."},
    {header: "Row Grouping", route: "row-group", body: "Group data by one or more specified columns."},
    {header: "Row Select", route: "row-select", body: "Options to select rows by double clicking or selecting multiple rows."},
    {header: "Saving Data", route: "saving", body: "Shows available events emitted when cells and row data are updated."},
    {header: "Simple", route: "simple", body: "The most basic grids with default configuration."},
    {header: "Theming", route: "theming", body: "Show different theme options and custom themes."},
    {header: "Validation", route: "validation", body: "Support input validation on editing."}
  ];
}
