import {Component, HostBinding} from "@angular/core";

import {DataGeneratorService} from "../services/data-generator.service";

@Component({
  selector: "auto-calc-page-size-demo",
  template: `
    <div class="card d-flex flex-grow-1 flex-shrink-1 ml-2 mr-2 pl-2 pr-2" style="min-height: 0px">
      <div class="card-header">
        <h4>Parent grows to fill available space:</h4>
      </div>
      <div class="d-flex flex-column flex-grow-1 flex-shrink-1" style="min-height: 0px">
        <div class="card-text">
          Test grid page size calculation when the parent grows to fill its available space. This changes as the available space changes, or as the window is resized.
          Changing from 'Auto' to a fixed page size will still calculate the size of the grid, but will produce scrolling, as needed to accomodate the number of desired rows.
          <br/><br/>
          It is important to understand that the sizing behavior is dependent on what elements contain the hci-grid tag. If these are of fixed size or percentage this will work as expected.
          If you use a Flex layout, this will also work, but it is <b>crucial</b> to understand that the expected behavior of flex layouts is that they will not shrink to a lower size
          than their content, by default. Because the grid sizes based on its parent, this would cause expansion, but not shrinking if the window is sized smaller. This default flex behavior
          is overriden by specifying any of min-width: 0, min-height: 0, or overflow: hidden. This would need to be the case for all parent divs that size based on flex, to allow shrinking to fit
          the space. The grid will then size itself to fit. See the source of this page for examples.
          
          <div class="d-flex flex-nowrap" style="align-items: center;">
            <span style="margin-left: 20px; font-size: 1.5em;">Height Of Other Content: </span>
            <input [ngModel]="height" (ngModelChange)="setHeight($event)" style="margin-left: 10px; font-size: 1.5em;" />
          </div>
        </div>
        
        <div class="border" [style.height.px]="height">Other page content</div>

        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [matMenuTriggerFor]="config2">Show Config</button>
          <mat-menu #config2="matMenu" class="config">
            <pre>
              &lt;hci-grid
                [data]="data"
                [columns]="columns"
                [configurable]="false"
                [autoCalcPageSize]="true"&gt;
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
        <div class="d-flex flex-grow-1 flex-shrink-1"  style="min-height: 0px">
          <hci-grid [data]="data"
                    [columns]="columns"
                    [configurable]="false"
                    [autoCalcPageSize]="true">
          </hci-grid>
        </div>

      </div>
    </div>
              
    <div style="margin-bottom: 20px; mt-2" class="border">Footer</div>
  `
})
export class AutoCalcPageSizeComponent {

    @HostBinding("class") classList: string = "demo-component";

    height: number = 30;


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

    setHeight(height: number) {
        this.height = height;
    }
}
