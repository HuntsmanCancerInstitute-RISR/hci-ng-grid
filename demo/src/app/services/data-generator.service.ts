import {Injectable} from "@angular/core";
import {Observable} from "rxjs/Rx";

import {ExternalData, ExternalInfo, FilterInfo} from "hci-ng-grid";
import {PageInfo} from "hci-ng-grid";

const momentRandom = require("moment-random");

/**
 * Automatically generate different types of data to test filtering/paging and the such for various size data sets.
 */
@Injectable()
export class DataGeneratorService {

  filteredData: Array<Object> = new Array<Object>();
  pagingData: Array<Object> = new Array<Object>();
  fixedData: Array<Object> = new Array<Object>();
  externalData1: Array<Object> = new Array<Object>();
  externalData2: Object[] = [];
  simpleData4: Array<Object> = new Array<Object>();

  private _firstNames: string[] = [ "Alred", "Amy", "Betty", "Bob", "Charles", "Charlize", "Doug", "Debbie", "Frank", "Fay", "Gerry", "Gina",
      "Harry", "Hellen", "Mike", "Milla", "Sam", "Sarah", "Tim", "Tina" ];
  private _lastNames: string[] = [ "Black", "Brown", "Grey", "Khan", "Smith", "White" ];
  private _middleNames: string[] = [ "", "A", "C", "D", "H", "L", "N", "O", "R", "T", "Z" ];
  private _cities: string[] = [ "Salt Lake City", "Odgen", "Provo" ];
  private _streets1: string[] = [ "Pine", "Red", "Green", "Oak", "Aspen" ];
  private _streets2: string[] = [ "acres", "shade", "wood", "dale" ];
  private _stypes: string[] = [ "Ln", "Rd", "St", "Dr" ];
  private _labTypes: string[] = [ "ANA", "PTT", "BMP", "CBC", "CMP", "ESR", "A1C" ];

  generateDate(startYear: number, endYear: number): string {
    let date: Date = momentRandom(endYear + "-12-31", startYear + "-01-01");
    return date.toISOString();
  }

  getData(size: number) {
    let data = new Array<Object>();
    for (var i = 1; i <= size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let genderDict: number = j % 2;
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let city: string = this._cities[Math.floor(Math.random() * this._cities.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);
      let phone: number = Math.floor(Math.random() * 9999999 + 8010000000);
      let nLabs: number = Math.floor(Math.random() * 100);
      let lab = {
        tech: this._lastNames[Math.floor(Math.random() * this._lastNames.length)],
        type: this._labTypes[Math.floor(Math.random() * this._labTypes.length)],
        value: Math.floor(Math.random() * 200)
      };
      let path = {
        nPath: Math.floor(Math.random() * 200)
      };

      data.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, genderDict: genderDict, address: addy + " " + street, citystatezip: city + ", UT 84101", phone: phone, nLabs: nLabs, lab: lab, path: path });
    }
    return data;
  }

  generateFixedData(size: number) {
    this.fixedData = new Array<Object>();
    for (var i = 0; i < size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let city: string = this._cities[Math.floor(Math.random() * this._cities.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);
      let phone: number = Math.floor(Math.random() * 9999999 + 8010000000);

      this.fixedData.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, address: addy + " " + street, citystatezip: city + ", UT 84101", phone: phone });
    }
  }

  getFixedData(filters: string[], sort: string, asc: boolean): Array<Object> {
    return this.fixedData;
  }

  generateSimpleData4(size: number) {
    this.simpleData4 = new Array<Object>();
    for (var i = 0; i < size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let city: string = this._cities[Math.floor(Math.random() * this._cities.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);
      let phone: number = Math.floor(Math.random() * 9999999 + 8010000000);

      this.simpleData4.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, address: addy + " " + street, citystatezip: city + ", UT 84101", phone: phone });
    }
  }

  getSimpleData4(delay: number): Observable<Array<Object>> {
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(this.simpleData4);
      }, delay);
    });
  }

  generateFilteredData(size: number) {
    this.filteredData = new Array<Object>();
    for (var i = 0; i < size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);

      this.filteredData.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, address: addy + " " + street });
    }
  }

  getFilteredData(filters: string[], sort: string, asc: boolean): Array<Object> {
    return this.filteredData;
  }

  generatePagingData(size: number) {
    this.pagingData = new Array<Object>();
    for (var i = 0; i < size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);

      this.pagingData.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, address: addy + " " + street });
    }
  }

  getPagingData(filters: string[], sort: string, asc: boolean): Array<Object> {
    return this.pagingData;
  }

  generateExternalData1(size: number) {
    this.externalData1 = new Array<Object>();
    for (var i = 0; i < size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);

      this.externalData1.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, address: addy + " " + street });
    }
  }

  /**
   * Designed to mimic a backend service.  The grid will send the current filtering/sorting/paging information.  In cases
   * I foresee, if any component is external, they should all be, but build this thing assuming separate cases.
   * To mimic, basically we handle any case where we set the "external flag" for the grid configuration.
   *
   * @param externalInfo
   * @returns {ExternalData}
   */
  getExternalData1(externalInfo: ExternalInfo): Observable<ExternalData> {
    console.info("getExternalData1");
    console.info(externalInfo);

    if (!externalInfo) {
      return Observable.create(observer => { observer.next(new ExternalData(this.externalData1, externalInfo)); });
    }
    if (!externalInfo.getPage()) {
      externalInfo.setPage(new PageInfo());
    }
    let filters: any = externalInfo.getFilter();
    let sort: any = externalInfo.getSort();
    let pageInfo: PageInfo = externalInfo.getPage();

    let filtered: Array<Object> = new Array<Object>();
    if (!filters) {
      filtered = this.externalData1;
    } else {
      for (var i = 0; i < this.externalData1.length; i++) {
        filters = filters.filter((f: FilterInfo) => {
          return f.value !== undefined && f.value !== "";
        });

        filters = filters.sort((a: FilterInfo, b: FilterInfo) => {
          return a.field.localeCompare(b.field);
        });

        let choiceFilters: FilterInfo[] = filters.filter((f: FilterInfo) => {
          return f.dataType === "choice";
        });
        let otherFilters: FilterInfo[] = filters.filter((f: FilterInfo) => {
          return f.dataType !== "choice";
        });

        let addChoice: boolean = true;
        if (choiceFilters.length > 0) {
          addChoice = false;
          for (var j = 0; j < choiceFilters.length; j++) {
            if (this.externalData1[i][choiceFilters[j]["field"]].indexOf(filters[j]["value"]) === -1) {
              addChoice = true;
              break;
            }
          }
        }

        let addOther: boolean = true;
        for (var j = 0; j < otherFilters.length; j++) {
          if (this.externalData1[i][otherFilters[j]["field"]].indexOf(filters[j]["value"]) === -1) {
            addOther = false;
          }
        }
        if (addChoice && addOther) {
          filtered.push(this.externalData1[i]);
        }
      }
    }

    if (sort) {
      filtered = filtered.sort((a: Object, b: Object) => {
        if (sort["asc"]) {
          if (a[sort["field"]] < b[sort["field"]]) {
            return -1;
          } else if (a[sort["field"]] < b[sort["field"]]) {
            return 1;
          } else {
            return 0;
          }
        } else {
          if (a[sort["field"]] > b[sort["field"]]) {
            return -1;
          } else if (a[sort["field"]] < b[sort["field"]]) {
            return 1;
          } else {
            return 0;
          }
        }
      });
    }

    if (!pageInfo) {
      return Observable.create(observer => { observer.next(new ExternalData(filtered, externalInfo)); });
    }

    let data: Array<Object> = new Array<Object>();

    console.info(pageInfo);

    let page: number = pageInfo.getPage();
    let pageSize: number = pageInfo.getPageSize();

    let n: number = filtered.length;
    externalInfo.getPage().setDataSize(n);
    if (externalInfo.page.pageSize > 0) {
      externalInfo.getPage().setNumPages(Math.ceil(n / pageSize));
    } else {
      externalInfo.getPage().setNumPages(1);
    }

    console.info("externalData1 paging: " + n + " " + page + " " + pageSize);

    if (pageSize > 0) {
      if (page * pageSize > n - 1) {
        return Observable.create(observer => { observer.next(new ExternalData(data, externalInfo)); });
      }

      for (var i = page * pageSize; i < Math.min(n, (page + 1) * pageSize); i++) {
        data.push(filtered[i]);
      }
      return Observable.create(observer => { observer.next(new ExternalData(data, externalInfo)); });
    } else {
      return Observable.create(observer => { observer.next(new ExternalData(filtered, externalInfo)); });
    }
  }

  generateExternalData2(size: number) {
    console.debug("Start generateExternalData2: " + size);

    this.externalData2 = [];
    for (var i = 0; i < size; i++) {
      let j: number = Math.floor(Math.random() * this._firstNames.length);
      let gender: string = (j % 2 === 0) ? "Male" : "Female";
      let firstName: string = this._firstNames[j];
      let middleName: string = this._middleNames[Math.floor(Math.random() * this._middleNames.length)];
      let lastName: string = this._lastNames[Math.floor(Math.random() * this._lastNames.length)];
      let addy: number = Math.floor(Math.random() * 9800 + 100);
      let street: string = this._streets1[Math.floor(Math.random() * this._streets1.length)] + this._streets2[Math.floor(Math.random() * this._streets2.length)] + " " + this._stypes[Math.floor(Math.random() * this._stypes.length)];
      let dob: string = this.generateDate(1930, 1990);

      this.externalData2.push({ idPatient: i, middleName: middleName, firstName: firstName, lastName: lastName, dob: dob, gender: gender, address: addy + " " + street });
    }

    console.debug("Done generateExternalData2: " + this.externalData2.length);
  }

  /**
   * Designed to mimic a backend service.  The grid will send the current filtering/sorting/paging information.  In cases
   * I foresee, if any component is external, they should all be, but build this thing assuming separate cases.
   * To mimic, basically we handle any case where we set the "external flag" for the grid configuration.
   *
   * @param externalInfo
   * @returns {ExternalData}
   */
  getExternalData2(externalInfo: ExternalInfo): Observable<ExternalData> {
    if (!externalInfo) {
      return new Observable<ExternalData>(observer => observer.next(new ExternalData(this.externalData2, externalInfo)));
    }
    if (!externalInfo.getPage()) {
      externalInfo.setPage(new PageInfo());
    }
    let filters: any = externalInfo["filter"];
    let sort: any = externalInfo["sort"];

    let filtered: Object[] = [];
    if (!filters) {
      filtered = this.externalData2;
    } else {
      for (var i = 0; i < this.externalData2.length; i++) {
        let add: boolean = true;
        for (var j = 0; j < filters.length; j++) {
          if (this.externalData2[i][filters[j]["field"]].indexOf(filters[j]["value"]) === -1) {
            add = false;
          }
        }
        if (add) {
          filtered.push(this.externalData2[i]);
        }
      }
    }

    if (sort) {
      filtered = filtered.sort((a: Object, b: Object) => {
        if (sort["asc"]) {
          if (a[sort["field"]] < b[sort["field"]]) {
            return -1;
          } else if (a[sort["field"]] < b[sort["field"]]) {
            return 1;
          } else {
            return 0;
          }
        } else {
          if (a[sort["field"]] > b[sort["field"]]) {
            return -1;
          } else if (a[sort["field"]] < b[sort["field"]]) {
            return 1;
          } else {
            return 0;
          }
        }
      });
    }

    externalInfo.getPage().setDataSize(filtered.length);
    return new Observable<ExternalData>(observer => observer.next(new ExternalData(filtered, externalInfo)));
  }

}
