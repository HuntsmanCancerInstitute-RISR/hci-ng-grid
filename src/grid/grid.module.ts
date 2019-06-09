/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {ANALYZE_FOR_ENTRY_COMPONENTS, ModuleWithProviders, NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";

import {NgbModule} from "@ng-bootstrap/ng-bootstrap";

import {GridComponent} from "./grid.component";
import {ColumnHeaderComponent} from "./column/column-header.component";
import {IsVisiblePipe} from "./utils/is-visible.pipe";
import {IsGroupPipe} from "./utils/is-group.pipe";
import {IsFixedPipe} from "./utils/is-fixed.pipe";
import {IsRowVisiblePipe} from "./utils/is-row-visible.pipe";
import {TextEditRenderer} from "./cell/editRenderers/text-edit-renderer.component";
import {TextFilterRenderer} from "./column/filterRenderers/text-filter-renderer.component";
import {CompareFilterRenderer} from "./column/filterRenderers/compare-filter-renderer.component";
import {ChoiceEditRenderer} from "./cell/editRenderers/choice-edit-renderer.component";
import {DateEditRenderer} from "./cell/editRenderers/date-edit-renderer.component";
import {SelectFilterRenderer} from "./column/filterRenderers/select-filter-renderer.component";
import {BigTextPopup} from "./cell/viewPopupRenderer/bigtext-popup.component";
import {ConfigMenuComponent} from "./config/config-menu.component";
import {GridGlobalService} from "./services/grid-global.service";
import {ConfigMultiChoiceComponent} from "./config/config-multi-choice.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgbModule
  ],
  declarations: [
    GridComponent,
    ColumnHeaderComponent,
    IsVisiblePipe,
    IsGroupPipe,
    IsFixedPipe,
    IsRowVisiblePipe,
    TextEditRenderer,
    DateEditRenderer,
    ChoiceEditRenderer,
    TextFilterRenderer,
    SelectFilterRenderer,
    CompareFilterRenderer,
    BigTextPopup,
    ConfigMenuComponent,
    ConfigMultiChoiceComponent
  ],
  entryComponents: [
    TextEditRenderer,
    DateEditRenderer,
    ChoiceEditRenderer,
    TextFilterRenderer,
    SelectFilterRenderer,
    CompareFilterRenderer,
    BigTextPopup
  ],
  exports: [
    GridComponent
  ]
})
export class GridModule {

  static forRoot(globalConfig?: any, components?: any[]): ModuleWithProviders {
    return {
      providers: [
        GridGlobalService,
        {provide: "globalConfig", useValue: (globalConfig) ? globalConfig : {}},
        {
          provide: ANALYZE_FOR_ENTRY_COMPONENTS,
          useValue: components,
          multi: true
        }
      ],
      ngModule: GridModule
    };
  }

  static withComponents(components: any[]): ModuleWithProviders {
    return {
      ngModule: GridModule,
      providers: [
        {
          provide: ANALYZE_FOR_ENTRY_COMPONENTS,
          useValue: components,
          multi: true
        }
      ]
    };
  }
}
