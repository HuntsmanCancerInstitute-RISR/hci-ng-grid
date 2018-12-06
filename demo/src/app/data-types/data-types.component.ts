import {Component} from "@angular/core";

import {Observable} from "rxjs/Observable";

import {ExternalData, ExternalInfo, TextFilterRenderer} from "hci-ng-grid";

import {DataGeneratorService} from "../services/data-generator.service";

@Component({
  selector: "filter-grid",
  template: `
    <div class="card">
      <div class="card-header">
        <h4>Choices</h4>
      </div>
      <div class="card-body">
        <div class="card-text">
          This grid uses the same gender data twice.  The data is values of 1, 2, or 3.  The first column specifies manual
          choice types.  The last column specifies a url to fetch the choices from.  For example, if you rely on a REST call
          to fetch dictionaries, you would want the second option.
        </div>
        <div class="card-text">
          Also to note that this demo uses an external data call with a 100-900 ms delay and the choiceUrl has a 250-750 ms
          delay.  This is important because the grid waits for the choiceUrl response before finalizing configuration and
          the column configuration is needed before the data can be prepared.
        </div>
        <div class="card-text">
          <button type="button" class="btn btn-outline-primary" [ngbPopover]="config1" popoverTitle="Config" placement="right">Show Config</button>
          <ng-template #config1>
          </ng-template>
        </div>
        <p>
          <hci-grid [title]="'Filter Grid'"
                    [dataCall]="dataCall1"
                    [columns]="columns1">
          </hci-grid>
        </p>
      </div>
    </div>
    `
})
export class DataTypesDemoComponent {

  dataCall1: (externalInfo: ExternalInfo) => {};
  data1: Object[];
  columns1: any[] = [
    { field: "idPatient", name: "ID", visible: true },
    { field: "lastName", name: "Last Name", filterRenderer: TextFilterRenderer },
    { field: "middleName", name: "Middle Name" },
    { field: "firstName", name: "First Name", filterRenderer: TextFilterRenderer },
    { field: "genderDict", name: "Gender", choices: [{v: 1, d: "F"}, {v: 2, d: "M"}, {v: 3, d: "U"}], choiceValue: "v", choiceDisplay: "d" },
    { field: "genderDict", name: "Gender Url", choiceUrl: "/api/dictionary/gender", choiceValue: "value", choiceDisplay: "display" },
  ];

  constructor(private dataGeneratorService: DataGeneratorService) {}

  ngOnInit() {
    this.data1 = this.dataGeneratorService.getData(250);

    this.dataCall1 = (externalInfo: ExternalInfo) => {
      return Observable.of(new ExternalData(this.dataGeneratorService.getData(250), externalInfo)).delay(Math.random() * 900 + 100);
    };
  }
}