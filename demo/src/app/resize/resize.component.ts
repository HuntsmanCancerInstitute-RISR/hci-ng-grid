import {Component, HostBinding} from "@angular/core";

import {DataGeneratorService} from "../services/data-generator.service";

@Component({
  selector: "resize-demo",
  template: `
    <div class="card">
      <div class="card-header">
        <h4>Resize Parent</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Test grid resizing when the parent is resized.
          <div class="d-flex flex-nowrap" style="align-items: center;">
            <span style="margin-left: 20px; font-size: 1.5em;">Width: </span>
            <input [ngModel]="width" (ngModelChange)="setWidth($event)" style="margin-left: 10px; font-size: 1.5em;" />
          </div>
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config1">Show Config</button>
          <mat-menu #config1="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [pageSize]="5"
                [pageSizes]="[5, 10, 25]&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div [style.width.px]="width">
          <hci-grid [data]="data"
                    [columns]="columns"
                    [pageSize]="5"
                    [pageSizes]="[5, 10, 25]">
          </hci-grid>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <h4>Panel Resize</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Test grid resizing when the parent is resized by a button.
        </div>
        <div class="card-text">
          <button (click)="width2 = 600">600</button>
          <button (click)="width2 = 700">700</button>
          <button (click)="width2 = 800">800</button>
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config2">Show Config</button>
          <mat-menu #config2="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [pageSize]="5"
                [pageSizes]="[5, 10, 25]&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div [style.width.px]="width2">
          <hci-grid [data]="data"
                    [columns]="columns"
                    [pageSize]="5"
                    [pageSizes]="[5, 10, 25]">
          </hci-grid>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>Window Resize</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Test grid resizing when the parent is 100% and changed by window resize.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config3">Show Config</button>
          <mat-menu #config3="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [pageSize]="5"
                [pageSizes]="[5, 10, 25]&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div style="width: 100%;">
          <hci-grid [data]="data"
                    [columns]="columns"
                    [nVisibleRows]="5"
                    [pageSize]="5"
                    [pageSizes]="[5, 10, 25]">
          </hci-grid>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Grid in ngIf</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Test grid when it is rendered after an ngIf.
        </div>
        <div class="card-text">
          <button (click)="showGrid4 = !showGrid4">Toggle Grid</button>
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config4">Show Config</button>
          <mat-menu #config4="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [pageSize]="5"
                [pageSizes]="[5, 10, 25]&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div style="width: 100%;">
          <hci-grid *ngIf="showGrid4"
                    [data]="data"
                    [columns]="columns">
          </hci-grid>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Fixed Height</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Sets the grid height to 100px.  The grid content sets itself accordingly.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config5">Show Config</button>
          <mat-menu #config5="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [height]="100"&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name Long Title"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div style="width: 100%;">
          <hci-grid [data]="data"
                    [columns]="columns"
                    [height]="100">
          </hci-grid>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Fixed Height No Data</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Sets the grid height to 100px.  The grid content sets itself accordingly.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config5">Show Config</button>
          <mat-menu #config5="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="nodata"
                [columns]="columns"
                [height]="100"&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name Long Title"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div style="width: 100%;">
          <hci-grid [data]="nodata"
                    [columns]="columns"
                    [height]="100">
          </hci-grid>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h4>Fixed Height No Data Scroll</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          Sets the grid height to 100px.  The grid content sets itself accordingly.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config5">Show Config</button>
          <mat-menu #config1="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="nodata"
                [columns]="columns"
                [height]="100"&gt;
              &lt;/hci-grid&gt;
              
              Columns:
              field: "idPatient", name: "ID", visible: false
              field: "lastName", name: "Last Name Long Title"
              field: "middleName", name: "Middle Name"
              field: "firstName", name: "First Name"
              field: "dob", name: "Date of Birth", dataType: "date"
              field: "gender", name: "Gender"
              field: "address", name: "Address"
            </pre>
          </mat-menu>
        </div>
        <div style="width: 200px;">
          <hci-grid [data]="nodata"
                    [columns]="columns"
                    [height]="100">
          </hci-grid>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header mb-3">
        <h4>Full Width</h4>
      </div>
      <hci-grid [data]="data"
                [columns]="columns"
                [height]="100">
      </hci-grid>
    </div>
    
    <div style="margin-bottom: 200px;"></div>
  `
})
export class ResizeDemoComponent {

    @HostBinding("class") classList: string = "demo-component";

    width: number = 800;
    width2: number = 800;

    dataSize: number = 250;
    data: Object[];
    nodata: Object[] = [];

    columns: any[] = [
        { field: "idPatient", name: "ID", visible: false },
        { field: "lastName", name: "Last Name Long Title" },
        { field: "middleName", name: "Middle Name" },
        { field: "firstName", name: "First Name" },
        { field: "dob", name: "Date of Birth", dataType: "date" },
        { field: "gender", name: "Gender" },
        { field: "address", name: "Address" }
    ];

    showGrid4: boolean = false;

    constructor(private dataGeneratorService: DataGeneratorService) {}

    ngOnInit() {
        this.initData();
    }

    initData() {
        this.data = this.dataGeneratorService.getData(this.dataSize);
    }

    setWidth(width: number) {
        this.width = width;
    }
}
