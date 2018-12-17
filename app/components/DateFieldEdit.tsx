import * as React from "react";
import { observer } from "mobx-react";
// tslint:disable-next-line:no-submodule-imports
import DatePicker from "react-datepicker";
import { Moment } from "moment";
import { Field } from "../model/field/Field";
const moment = require("moment");

export interface IProps {
  field: Field;
}

// automatically update when the value changes
@observer
// the React.HTMLAttributes<HTMLDivElement> allows the use of "className=" on these fields
export default class DateFieldEdit extends React.Component<
  IProps & React.HTMLAttributes<HTMLDivElement>
> {
  constructor(props: IProps) {
    super(props);
  }

  public render() {
    const label: string = this.props.field.labelInUILanguage;
    const m: Moment = this.props.field.text
      ? moment(this.props.field.text)
      : null;
    return (
      <div className={"field " + this.props.className}>
        <label>{label}</label>
        <DatePicker
          className="date-picker"
          dateFormat="ll"
          selected={m}
          //onChange={d => console.log("change " + d)}
          onChange={newDate => {
            if (newDate != null) {
              // TODO: while this is changing the value, it's not propagating back to our props so you don't see the change immediately
              const ISO_YEAR_MONTH_DATE_DASHES_FORMAT = "YYYY-MM-DD";
              this.props.field.setValueFromString(
                newDate.format(ISO_YEAR_MONTH_DATE_DASHES_FORMAT)
              );
            }
          }}
        />
      </div>
    );
  }
}
