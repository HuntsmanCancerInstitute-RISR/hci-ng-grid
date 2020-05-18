/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {NgModule} from "@angular/core";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {CommonModule} from "@angular/common";
import {HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {RouterModule} from "@angular/router";
import {MatMenuModule} from "@angular/material/menu";
import {MatTooltipModule} from "@angular/material/tooltip";

import {GridModule} from "hci-ng-grid";

import {DemoComponent} from "./demo.component";
import {DataGeneratorService} from "./services/data-generator.service";
//import {DocsComponent} from "./docs/docs.component";
import {EditGridComponent} from "./edit/edit-grid.component";
import {HomeComponent} from "./home.component";
import {SimpleGridComponent} from "./simple/simple-grid.component";
import {SelectGridComponent} from "./select/select-grid.component";
import {RowGroupGridComponent} from "./row-group/row-group-grid.component";
import {FixedGridComponent} from "./fixed/fixed-grid.component";
import {FilterGridComponent} from "./filter/filter-grid.component";
import {ExternalControlComponent} from "./external-ctrl/external-ctrl.component";
import {ExternalDataComponent} from "./external-data/external-data.component";
import {CopyPasteGridComponent} from "./copypaste/copypaste-grid.component";
import {AlertsGridComponent} from "./alerts/alerts-grid.component";
import {PagingGridComponent} from "./paging/paging-grid.component";
import {ThemingComponent} from "./theming/theming.component";
import {DynamicConfigGridComponent} from "./dynamic-config/dynamic-config.component";
import {EmptyGridComponent} from "./empty/empty-grid.component";
import {EventComponent} from "./event/event.component";
import {PopupComponent} from "./popup/popup.component";
import {ResizeDemoComponent} from "./resize/resize.component";
import {LinkedDemoComponent} from "./linked/linked.component";
import {LabPopup} from "./components/lab.component";
import {UserProfileDirective} from "./dynamic-config/user-profile.directive";
import {DictionaryFilterRenderer} from "./filter/dictionary-filter.component";
import {DemoInterceptor} from "./services/demo.interceptor";
import {SavingDemoComponent} from "./saving/saving.component";
import {BusyDemoComponent} from "./busy/busy.component";
import {ValidationComponent} from "./validation/validation.component";
import {DateDemoComponent} from "./date/date.component";
import {DataTypesDemoComponent} from "./data-types/data-types.component";
import {NewRowDemo} from "./new-row/new-row.component";

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatMenuModule,
    MatTooltipModule,
    RouterModule.forRoot([
      { path: "", redirectTo: "/home", pathMatch: "full" },
      { path: "alerts", component: AlertsGridComponent },
      { path: "busy", component: BusyDemoComponent },
      { path: "copypaste", component: CopyPasteGridComponent },
      { path: "data-types", component: DataTypesDemoComponent },
      { path: "date", component: DateDemoComponent},
      //{ path: "docs", component: DocsComponent},
      { path: "dynamic-config", component: DynamicConfigGridComponent },
      { path: "edit", component: EditGridComponent },
      { path: "empty", component: EmptyGridComponent },
      { path: "event", component: EventComponent },
      { path: "external-ctrl", component: ExternalControlComponent },
      { path: "external-data", component: ExternalDataComponent },
      { path: "filter", component: FilterGridComponent },
      { path: "fixed", component: FixedGridComponent },
      { path: "home", component: HomeComponent },
      { path: "linked", component: LinkedDemoComponent },
      { path: "new-row", component: NewRowDemo },
      { path: "paging", component: PagingGridComponent },
      { path: "popup", component: PopupComponent },
      { path: "resize", component: ResizeDemoComponent },
      { path: "row-group", component: RowGroupGridComponent },
      { path: "row-select", component: SelectGridComponent },
      { path: "saving", component: SavingDemoComponent },
      { path: "simple", component: SimpleGridComponent },
      { path: "theming", component: ThemingComponent },
      { path: "validation", component: ValidationComponent },
    ], {useHash: true}),
    GridModule.forRoot()
  ],
  declarations: [
    AlertsGridComponent,
    BusyDemoComponent,
    CopyPasteGridComponent,
    DataTypesDemoComponent,
    DateDemoComponent,
    DemoComponent,
    DictionaryFilterRenderer,
    //DocsComponent,
    DynamicConfigGridComponent,
    EditGridComponent,
    EmptyGridComponent,
    EventComponent,
    ExternalControlComponent,
    ExternalDataComponent,
    RowGroupGridComponent,
    FixedGridComponent,
    FilterGridComponent,
    HomeComponent,
    LabPopup,
    LinkedDemoComponent,
    PagingGridComponent,
    PopupComponent,
    ResizeDemoComponent,
    SavingDemoComponent,
    SelectGridComponent,
    SimpleGridComponent,
    ThemingComponent,
    UserProfileDirective,
    ValidationComponent,
    NewRowDemo
  ],
  providers: [
    DataGeneratorService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: DemoInterceptor,
      multi: true
    }
  ],
  bootstrap: [
    DemoComponent
  ],
  entryComponents: [
    DictionaryFilterRenderer,
    LabPopup
  ]
})
export class DemoModule {}
