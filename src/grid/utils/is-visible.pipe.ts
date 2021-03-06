import { Pipe, PipeTransform } from "@angular/core";

import { Column } from "../column/column";

@Pipe({
  name: "isVisible"
})
export class IsVisiblePipe implements PipeTransform {
  transform(list) {
    if (list === undefined) {
      return list;
    } else {
      return list.filter((o: Column) => o.visible);
    }
  }
}
