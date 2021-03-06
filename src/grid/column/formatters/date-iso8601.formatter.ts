import * as moment from "moment";

import {FormatterParser} from "./formatter-parser";

/**
 * Designed to work with dates coming from the backend in the ISO 8601 date format of YYYY-MM-DD.
 */
export class DateIso8601Formatter extends FormatterParser {

  format: string = "MM/DD/YYYY";

  setConfig(config: any) {
    super.setConfig(config);

    if (config.format) {
      this.format = config.format;
    }
  }

  formatValue(value: any): any {
    if (value !== undefined) {
      let date: string = moment(value).format(this.format);

      if (date === "Invalid date") {
        throw new Error("Could not format date.");
      } else {
        return date;
      }
    } else {
      return undefined;
    }
  }

  parseValue(value: any): any {
    if (value !== undefined) {
      let date: string = moment(<string>value, this.format).toISOString().substring(0, 10);

      if (date === "Invalid Date") {
        throw new Error("Could not format date.");
      } else {
        return date;
      }
    } else {
      return undefined;
    }
  }
}
