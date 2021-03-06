import {Component, HostBinding} from "@angular/core";

import {DataGeneratorService} from "../services/data-generator.service";

@Component({
  selector: "paging-grid",
  template: `
    <div class="card">
      <div class="card-header">
        <h4>Paging Grid</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          A basic paging example.  The default page size is 10 with several different paging size options.
          <div class="d-flex flex-nowrap" style="align-items: center;">
            <a class="btn btn-primary" (click)="initData()">Re-generate Data</a><br />
            <span style="margin-left: 20px; font-size: 1.5em;">Size: </span>
            <input [(ngModel)]="dataSize" style="margin-left: 10px; font-size: 1.5em;" />
          </div>
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config1">Show Config</button>
          <mat-menu #config1="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [title]="'Paging Grid'"
                [data]="pagingData"
                [columns]="pagingColumns"
                [pageSize]="10"
                [pageSizes]="[10, 25, 100]&gt;
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
        <div>
          <hci-grid [title]="'Paging Grid'"
                    [data]="pagingData"
                    [columns]="pagingColumns"
                    [pageSize]="10"
                    [pageSizes]="[10, 25, 100]">
          </hci-grid>
        </div>
      </div>
    </div>
  `
})
export class PagingGridComponent {

  @HostBinding("class") classList: string = "demo-component";

    dataSize: number = 250;
    pagingData: Object[];

    pagingColumns: any[] = [
        { field: "idPatient", name: "ID", visible: false },
        { field: "lastName", name: "Last Name" },
        { field: "middleName", name: "Middle Name" },
        { field: "firstName", name: "First Name" },
        { field: "dob", name: "Date of Birth", dataType: "date" },
        { field: "gender", name: "Gender" },
        { field: "address", name: "Address" }
    ];

    constructor(private dataGeneratorService: DataGeneratorService) {}

    ngOnInit() {
        this.initData();
    }

    initData() {
        this.dataGeneratorService.generatePagingData(this.dataSize);
        this.pagingData = this.dataGeneratorService.getPagingData(null, null, null);
    }
}
