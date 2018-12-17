import * as React from "react";
import { observer } from "mobx-react";
import { Field } from "../../model/field/Field";
import { Creatable, Option, OptionValues } from "react-select";
// tslint:disable-next-line:no-duplicate-imports
import ReactSelect from "react-select";
import { observable } from "mobx";
import { translateFieldLabel } from "../../l10nUtils";

const titleCase = require("title-case");

export interface IProps {
  field: Field;
}

/* This is for choices that have a distinct id vs. name, definitions, examples, etc.
  Maybe just genre & access.
  */
@observer
export default class GenreChooser extends React.Component<
  IProps & React.HTMLAttributes<HTMLDivElement>
> {
  public render() {
    const label = translateFieldLabel(this.props.field);
    const choices = this.props.field.definition.complexChoices
      ? this.props.field.definition.complexChoices
      : [];

    const options = choices.map(c => {
      let tip = c.definition;
      if (c.examples && c.examples.length > 0) {
        tip += "\nExamples: " + c.examples;
      }
      return new Object({
        value: c.id,
        label: c.label,
        title: tip
      });
    });

    return (
      <div className={"field " + this.props.className}>
        <label>{label}</label>
        <ReactSelect
          name={this.props.field.englishLabel}
          value={this.props.field.text}
          onChange={(s: any) => {
            this.props.field.text = (s && s.value ? s.value : "") as string;
          }}
          options={options}
        />
      </div>
    );
  }
}
