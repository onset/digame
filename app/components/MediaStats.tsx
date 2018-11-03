import * as React from "react";
import ReactTable from "react-table";
import { observable } from "mobx";
import { observer } from "mobx-react";
import { File } from "../model/file/File";
import ffmpeg = require("fluent-ffmpeg");
import { Dictionary } from "typescript-collections";
import SMErrorBoundary from "./SMErrorBoundary";
const imagesize = require("image-size");
const humanizeDuration = require("humanize-duration");

// require("ffprobe-static").path from here in the renderer only gives a partial path (starting inside the ffprobe folder),
// so we retrieved it in the main process and adjusted for dev vs. installed location
const ffprobePath = require("electron").remote.getGlobal("ffprobepath");
ffmpeg().setFfprobePath(ffprobePath);

export interface IProps {
  file: File;
}
export interface IState {
  error: any;
}

export default class MediaStats extends React.Component<IProps, IState> {
  private stats: Dictionary<string, string>;
  public constructor(props: IProps) {
    super(props);
    this.stats = new Dictionary<string, string>();
    this.state = { error: undefined };
  }

  public componentWillMount() {
    this.updateStats(this.props.file)
      .then(() => this.setState({}))
      .catch(error => {
        this.setState({ error });
      });
  }
  public componentWillReceiveProps(nextProps: IProps) {
    // for the bug that prompted using this, see https://trello.com/c/9keiiGFA
    this.updateStats(nextProps.file)
      .then(() => this.setState({}))
      .catch(error => {
        this.setState({ error });
      });
  }

  public static isMedia(file: File): boolean {
    return ["Image", "Audio", "Video"].indexOf(file.type) > -1;
  }
  private async updateStats(file: File) {
    this.stats.clear();
    return new Promise((resolve: any, reject) => {
      try {
        switch (file.type) {
          case "Image":
            const dimensions = imagesize(file.describedFilePath);
            this.stats.setValue("width", dimensions.width.toString());
            this.stats.setValue("height", dimensions.height.toString());
            resolve();
            break;
          case "Audio":
          case "Video":
            ffmpeg.ffprobe(file.describedFilePath, (err, result) => {
              if (err) {
                console.error(
                  `error testing ffprobe on '${file.describedFilePath}'`
                );
                reject(err);
              } else {
                this.addStat(
                  "Length",
                  humanizeDuration(1000 * result.format.duration, {
                    round: true
                  })
                );
                this.addStat("Format", result.format.format_long_name);
                console.log(JSON.stringify(result));
                result.streams.forEach(stream => {
                  this.processStreamStats(stream);
                });
                resolve(result);
              }
            });
            break;
        }
      } catch (err) {
        reject(err);
      }
    });
  }
  private processStreamStats(stream: any) {
    switch (stream.codec_type) {
      case "audio":
        this.addStat("Audio Codec", stream.codec_name);
        this.addStat("Audio Channels", stream.channels);
        if (stream.bit_rate) {
          this.addStat(
            "Audio Bit Rate",
            Math.round(stream.bit_rate / 1000).toString() + " Kbps"
          );
        }
        if (stream.sample_rate) {
          this.addStat(
            "Audio Sample Rate",
            this.roundToOneDecimalPlace(stream.sample_rate / 1000).toString() +
              " KHz"
          );
        }
        this.addStat(
          "Audio Bit Depth",
          stream.bits_per_sample
            ? stream.bits_per_sample.toString() + "-bit"
            : "N/A"
        );
        break;
      case "video":
        this.addStat("Video Codec", stream.codec_name);
        if (stream.width && stream.height) {
          this.addStat("Resolution", `${stream.width} x ${stream.height}`);
        }

        if (stream.avg_frame_rate) {
          this.addStat(
            "Frame rate",
            // tslint:disable-next-line:no-eval
            Math.round(eval(stream.avg_frame_rate)) + " fps"
          ); //"avg_frame_rate":"26910000/896999",
        }
        break;
      default:
        break;
    }
  }
  private roundToOneDecimalPlace(n: number): number {
    return Math.round(10 * n) / 10;
  }
  private addStat(key: string, value: any) {
    if (value) {
      const s = value.toString();
      if (s.length > 0) {
        this.stats.setValue(key, value);
      }
    }
  }

  public render() {
    const columns = [
      {
        id: "key",
        Header: "Stat",
        width: 120,
        accessor: key => key
      },
      {
        id: "value",
        Header: "Value",
        //width: 200,
        accessor: key => this.stats.getValue(key)
      }
    ];

    return (
      <>
        {this.state.error && (
          <div>
            {`There was a problem inspecting ${
              this.props.file.describedFilePath
            }`}
            <br /> {this.state.error.toString()}
          </div>
        )}

        <ReactTable
          className={"mediaStatsTable"}
          showPagination={false}
          data={this.stats.keys()}
          columns={columns}
          minRows={0}
        />
      </>
    );
  }
}