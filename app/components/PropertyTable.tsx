import * as React from "react";
import { Table, Column, Cell } from "@blueprintjs/table";
import { observer } from "mobx-react";
import { TextField, Field } from "../model/Field";
import { FieldSet } from "../model/FieldSet";

//const styles = require("./Sessions.scss");

export interface IProps {
  fields: FieldSet;
}
interface IState {
  selectedRow: number;
}

@observer
export default class PropertyTable extends React.Component<IProps, IState> {
  private getFieldNameCell(rowIndex: number) {
    const v = this.props.fields.values();
    const f: Field = v[rowIndex];
    return <Cell>{f.englishLabel}</Cell>;
  }
  private getFieldValueCell(rowIndex: number) {
    const p = this.props.fields.values()[rowIndex];
    if (p instanceof TextField) {
      return <Cell>{p.toString()}</Cell>;
    }
    if (p instanceof Date) {
      return <Cell>{(p as Date).toLocaleDateString()}</Cell>;
    }

    return <Cell />;
  }
  public render() {
    return (
      <div>
        <Table
          numRows={this.props.fields.keys().length}
          isRowHeaderShown={false}
          allowMultipleSelection={false}
          columnWidths={[80, 200]}
        >
          <Column name="Property" renderCell={r => this.getFieldNameCell(r)} />
          <Column name="Value" renderCell={r => this.getFieldValueCell(r)} />
        </Table>
      </div>
    );
  }
}
