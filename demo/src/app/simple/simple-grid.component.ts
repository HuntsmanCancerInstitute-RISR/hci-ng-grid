import { Component, OnInit } from "@angular/core";
import { Column } from "hci-ng-grid/index";

import { DataGeneratorService } from "../services/data-generator.service";

@Component({
  selector: "simple-grid",
  template: `
    <div style="padding: 20px;">
      <h2>Simple Grid</h2>
    </div>
    <div style="padding: 20px;">
      <hci-grid [title]="'Simple Grid'"
                [inputData]="simpleData1">
          <column-def [field]="'lastName'"></column-def>
          <column-def [field]="'firstName'"></column-def>
          <column-def [field]="'dob'">
              <hci-grid-cell-date #template [dateFormat]="'MMM D, YYYY'"></hci-grid-cell-date>
          </column-def>
          <column-def [field]="'pcg.nLabs'"></column-def>
          <column-def [field]="'pcg.nested.nLabPath'"></column-def>
      </hci-grid>
    </div>
    <div style="padding: 20px;">
      <h2>More Simple Grid</h2>
    </div>
    <div style="padding: 20px;">
      Here we pass the data array and column definitions.  The column definitions specify the complex data path and the
      template type and that is all.  There is no filtering, header, sorting or paging.
    </div>
    <div style="padding: 20px;">
      <hci-grid [inputData]="simpleData2">
        <column-def [field]="'lastName'"></column-def>
        <column-def [field]="'firstName'"></column-def>
        <column-def [field]="'dob'">
          <hci-grid-cell-date #template [dateFormat]="'MMM D, YYYY'"></hci-grid-cell-date>
        </column-def>
        <column-def [field]="'pcg.nLabs'"></column-def>
        <column-def [field]="'pcg.nested.nLabPath'"></column-def>
      </hci-grid>
    </div>
    <div style="padding: 20px;">
      <h2>Even More Simple Grid</h2>
    </div>
    <div style="padding: 20px;">
      Here the only thing passed in is the data.  Visible label columns are created automatically based on every key
      in the object.
    </div>
    <div style="padding: 20px;">
      <hci-grid [inputData]="simpleData3">
      </hci-grid>
    </div>
    <div style="padding: 20px;">
        <h2>Simple Grid - Delayed Input</h2>
    </div>
    <div style="padding: 20px;">
        <hci-grid [title]="'Simple Grid Delayed'"
                  [inputData]="simpleData4">
            <column-def [field]="'idPatient'" [name]="'ID'" [visible]="false"></column-def>
            <column-def [field]="'lastName'" [name]="'Last Name'"></column-def>
            <column-def [field]="'firstName'" [name]="'First Name'"></column-def>
            <column-def [field]="'dob'" [name]="'Date of Birth'">
                <hci-grid-cell-date #template [dateFormat]="'MMM D, YYYY'"></hci-grid-cell-date>
            </column-def>
            <column-def [field]="'address'" [name]="'Address 1'"></column-def>
            <column-def [field]="'citystatezip'" [name]="'Address 2'"></column-def>
        </hci-grid>
    </div>
  `
})
export class SimpleGridComponent implements OnInit {

  simpleData1: Array<Object> = [
    { "idPatient": 1, "firstName": "Bob", "lastName": "Smith", "dob": 101110000000, "pcg": { "qmatm": "What?", "nLabs": 1, "nested": { "nLabPath": 12 } } },
    { "idPatient": 2, "firstName": "Jane", "lastName": "Doe", "dob": 111110000000, "pcg": { "qmatm": "What?", "nLabs": 2, "nested": { "nLabPath": 23 } } },
    { "idPatient": 3, "firstName": "Rick", "lastName": "James", "dob": 121110000000, "pcg": { "qmatm": "What?", "nLabs": 3, "nested": { "nLabPath": 34 } } },
    { "idPatient": 4, "firstName": "Rick", "lastName": "James", "dob": 999990000000, "pcg": { "qmatm": "What?", "nLabs": 99, "nested": { "nLabPath": 9 } } },
    { "idPatient": 5, "firstName": "Ragini", "lastName": "Kanth", "dob": 131110000000, "pcg": { "qmatm": "What?", "nLabs": 4, "nested": { "nLabPath": 45 } } },
    { "idPatient": 6, "firstName": "Sameer", "lastName": "Byrne", "dob": 141110000000, "pcg": { "qmatm": "Huh?", "nLabs": 5, "nested": { "nLabPath": 56 } } }
  ];

  simpleData2: Array<Object> = [
    { "idPatient": 1, "firstName": "Bob", "lastName": "Smith", "dob": 101110000000, "pcg": { "qmatm": "What?", "nLabs": 1, "nested": { "nLabPath": 12 } } },
    { "idPatient": 2, "firstName": "Jane", "lastName": "Doe", "dob": 111110000000, "pcg": { "qmatm": "What?", "nLabs": 2, "nested": { "nLabPath": 23 } } },
    { "idPatient": 3, "firstName": "Rick", "lastName": "James", "dob": 121110000000, "pcg": { "qmatm": "What?", "nLabs": 3, "nested": { "nLabPath": 34 } } },
    { "idPatient": 4, "firstName": "Rick", "lastName": "James", "dob": 999990000000, "pcg": { "qmatm": "What?", "nLabs": 99, "nested": { "nLabPath": 9 } } },
    { "idPatient": 5, "firstName": "Ragini", "lastName": "Kanth", "dob": 131110000000, "pcg": { "qmatm": "What?", "nLabs": 4, "nested": { "nLabPath": 45 } } },
    { "idPatient": 6, "firstName": "Sameer", "lastName": "Byrne", "dob": 141110000000, "pcg": { "qmatm": "Huh?", "nLabs": 5, "nested": { "nLabPath": 56 } } }
  ];

  simpleData3: Array<Object> = [
    { "idPatient": 1, "firstName": "Bob", "lastName": "Smith" },
    { "idPatient": 2, "firstName": "Jane", "lastName": "Doe" },
    { "idPatient": 3, "firstName": "Rick", "lastName": "James" },
    { "idPatient": 4, "firstName": "Rick", "lastName": "James"},
    { "idPatient": 5, "firstName": "Ragini", "lastName": "Kanth" },
    { "idPatient": 6, "firstName": "Sameer", "lastName": "Byrne" }
  ];

  simpleData4: Array<Object> = null;

  constructor(private dataGeneratorService: DataGeneratorService) {}

  ngOnInit() {
    this.dataGeneratorService.generateSimpleData4(10);
    this.dataGeneratorService.getSimpleData4().subscribe((simpleData4: Array<Object>) => {
      this.simpleData4 = simpleData4;
    });
  }

}
