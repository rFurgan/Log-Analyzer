const loglines = [
  "13:20:10.166 djs",
  "13:20:10.448 nmyh",
  "13:20:11.434 ndcydyxnvta",
  "13:20:11.952 vxke",
  "13:20:12.205 hctvq",
  "13:20:12.690 lcpbhj",
  "13:20:13.640 cwvfjpeg",
  "13:20:14.590 hqd",
  "13:20:15.482 qzabg",
  "13:20:15.793 eoxfuelkg",
  "13:20:16.634 ",
  "13:20:16.724 lk",
  "13:20:16.860 rfdch",
  "13:20:17.507 uatgkwdil",
  "13:20:18.491 rsxrnscor",
  "13:20:19.151 fbwhrkkzxm",
  "13:20:19.529 tfxef",
  "13:20:19.917 a",
  "13:20:20.811 khzgndnjnta",
  "13:20:21.372 ooyuqipo",
  "13:20:22.352 ",
  "13:20:22.457 o",
  "13:20:22.822 yjj",
  "13:20:23.406 kgboaehgxmq",
  "13:20:24.13 bfo",
  "13:20:24.136 rxpnoulncf",
  "13:20:24.354 kstchdjuqftum",
  "13:20:25.80 syugionwzc",
  "13:20:25.332 uznphwchr",
  "13:20:26.35 ",
  "13:20:26.718 tmfdxn",
  "13:20:26.953 unmhahumhvko",
  "13:20:27.923 kevmourqxvycx",
  "13:20:28.313 xvwn",
  "13:20:29.79 ycmskvqyviu",
  "13:20:30.68 ddycnwpja",
  "13:20:30.127 zzdwb",
  "13:20:30.778 hwictlwywd",
  "13:20:31.357 ujjojxw",
  "13:20:31.586 z",
  "13:20:32.56 vdnr",
  "13:20:32.238 ",
  "13:20:33.63 ",
  "13:20:33.359 vwfxlwhmx",
  "13:20:34.116 ",
  "13:20:34.800 xizux",
  "13:20:35.183 pipcvwbipmyo",
  "13:20:35.217 ofgeslmysnprozth",
  "13:20:35.720 nopejey",
  "13:20:36.299 rpcafvqahj",
  "13:20:36.472 zxvuvodq",
  "13:20:37.154 sfmdvoilybxgtuep",
  "13:20:37.608 yodxqqhajn",
  "13:20:38.216 ",
  "13:20:38.910 ",
  "13:20:39.851 peqlthzshnvwiodil",
  "13:20:40.574 rmka",
  "13:20:40.928 ",
  "13:20:41.888 qzxeuhodgv",
  "13:20:42.731 lnluirknj",
  "13:20:42.783 unaexmtidb",
  "13:20:43.396 gn",
  "13:20:44.16 fxtj",
  "13:20:44.284 mxeksen",
];

interface ITimerange {
  from: number;
  to: number;
}

class Logviewer {
  private _loglines: string[];
  private _matches: number[] = [];
  private _activeTimerange: boolean = false;
  private _timeranges: ITimerange[] = [];

  private readonly _logsElement: HTMLDivElement = document.getElementById(
    "logs"
  ) as HTMLDivElement;
  private readonly _searchElement: HTMLInputElement = document.getElementById(
    "search"
  ) as HTMLInputElement;
  private readonly _topElement: HTMLDivElement = document.getElementById(
    "top"
  ) as HTMLDivElement;
  private readonly _searchColorElement: HTMLInputElement =
    document.getElementById("search-color") as HTMLInputElement;
  private readonly _lineElements: HTMLCollectionOf<HTMLDivElement> =
    document.getElementsByClassName("line") as HTMLCollectionOf<HTMLDivElement>;

  constructor(loglines: string[]) {
    this._loglines = loglines;
    this._addLogs();
    this._attachSearch();
    this._attachTimerange();
    this._attachSearchColor();
  }

  private _addLogs(): void {
    this._loglines.forEach((line: string, lineNumber: number) => {
      const lineElement = document.createElement("div");
      const lineNumberElement = document.createElement("p");
      const lineLogElement = document.createElement("p");
      lineElement.className = "line";
      lineElement.id = `${lineNumber}`;
      lineLogElement.innerText = line;
      lineNumberElement.innerText = `${lineNumber}`;
      lineElement.append(lineNumberElement, lineLogElement);
      this._logsElement.append(lineElement);
    });
  }

  private _markMatches(): void {
    this._matches.forEach((match: number) => {
      (this._lineElements.item(match) as HTMLParagraphElement).className +=
        " match ";
    });
  }

  private _unmarkMatches(): void {
    for (let lineElement of this._lineElements as any) {
      lineElement.className = lineElement.className.replace(/\smatch\s/, "");
    }
  }

  private _search(): void {
    this._unmarkMatches();
    const searchRequest: string = this._searchElement.value.trim();
    this._matches =
      searchRequest === ""
        ? []
        : (loglines as any).flatMap((line: string, lineNumber: number) => {
            return line.indexOf(searchRequest) > -1 ? lineNumber : [];
          });
    this._markMatches();
  }

  private _attachSearch(): void {
    this._searchElement.addEventListener("keyup", this._search.bind(this));
  }

  private _attachSearchColor() {
    this._searchColorElement.addEventListener("change", (event) => {
      for (let styleSheet of document.styleSheets as any) {
        if (styleSheet.cssRules) {
          for (let cssrule of styleSheet.cssRules) {
            console.log((cssrule as CSSStyleRule).selectorText);
            if ((cssrule as CSSStyleRule).selectorText === ".match") {
              (cssrule as CSSStyleRule).style.backgroundColor = (
                event.target as HTMLInputElement
              ).value;
            }
          }
        }
      }
    });
  }

  private _getLinesElement(timerange: ITimerange): HTMLParagraphElement {
    const linesElement: HTMLParagraphElement = document.createElement("p");
    linesElement.innerText = `${timerange.from} - ${timerange.to}`;
    return linesElement;
  }

  private _getDurationElement(timerange: ITimerange): HTMLParagraphElement {
    const timeDiff = timerange.to - timerange.from;
    const durationElement: HTMLParagraphElement = document.createElement("p");
    durationElement.innerText = `${timeDiff}s`;
    return durationElement;
  }

  private _getColorElement(): HTMLInputElement {
    const colorElement: HTMLInputElement = document.createElement("input");
    colorElement.type = "color";
    // TODO
    // colorElement.value = _getRandomColor();
    // colorElement.addEventListener(('change' => {
    //     // Change color of timerange indicator
    // }))
    return colorElement;
  }

  private _getRemoveElement(
    timerangeElement: HTMLDivElement
  ): HTMLButtonElement {
    const removeElement: HTMLButtonElement = document.createElement("button");
    removeElement.addEventListener("click", () => {
      timerangeElement.remove();
    });
    return removeElement;
  }

  private _getTimerangeElement(timerange: ITimerange): HTMLDivElement {
    const timerangeElement: HTMLDivElement = document.createElement("div");
    const removeElement: HTMLParagraphElement = document.createElement("p");
    timerangeElement.append(
      this._getLinesElement(timerange),
      this._getDurationElement(timerange),
      this._getColorElement(),
      this._getRemoveElement(timerangeElement)
    );
    return timerangeElement;
  }

  private _addTimerangeOverview(): void {
    const timeranges: HTMLDivElement = document.getElementById(
      "timeranges"
    ) as HTMLDivElement;
    // TODO _getTImerangeElement
    timeranges.append();
  }

  private _closeTimerangeTags(): void {
    const timerange: ITimerange = this._timeranges[this._timeranges.length - 1];
    if (timerange.from === undefined || timerange.to === undefined) {
      return;
    }
    for (let line = timerange.from; line <= timerange.to; line++) {
      const lineElement: HTMLParagraphElement = this._lineElements.item(
        line
      ) as HTMLParagraphElement;
      lineElement.className = lineElement.className.replace(
        /(\stemp\-timerange\s)+/,
        " timerange "
      );
    }
  }

  private _closeTimerange(line: number): void {
    const timerange = this._timeranges[this._timeranges.length - 1];
    if (timerange.from !== undefined && timerange.from > line) {
      timerange.to = timerange.from;
      timerange.from = line;
    } else {
      this._timeranges[this._timeranges.length - 1].to = line;
    }
    this._activeTimerange = false;
    this._closeTimerangeTags();
  }

  private _openTimerange(line: number): void {
    this._timeranges.push({ from: line, to: -1 });
    (this._lineElements.item(line) as HTMLDivElement).className +=
      " temp-timerange ";
    this._activeTimerange = true;
  }

  // TODO  Janky
  private _cancelTimerange(): void {
    const activeLine: number | undefined =
      this._timeranges[this._timeranges.length - 1].from;
    if (activeLine === undefined) {
      return;
    }
    const lineElement: HTMLParagraphElement = this._lineElements.item(
      activeLine
    ) as HTMLParagraphElement;
    lineElement.className = lineElement.className.replace(
      /\s(timerange)\s/,
      ""
    );
    this._timeranges.pop();
    this._activeTimerange = false;
  }

  private _getClosestTimerangeIndex(line: number): number {
    let timerangeIndex: number = -1;
    this._timeranges.forEach((timerange: ITimerange, index: number) => {
      if (
        timerange.from !== undefined &&
        timerange.from <= line &&
        timerange.from > timerangeIndex
      ) {
        timerangeIndex = index;
      }
    });
    return timerangeIndex;
  }

  // TODO  Janky
  private _removeTimerange(line: number): void {
    const index: number = this._getClosestTimerangeIndex(line);
    if (index === -1) {
      return;
    }
    const timerange: ITimerange = this._timeranges[index];
    if (timerange.from === undefined || timerange.to === undefined) {
      return;
    }
    for (let line = timerange.from; line <= timerange.to; line++) {
      const lineElement: HTMLParagraphElement = this._lineElements.item(
        line
      ) as HTMLParagraphElement;
      lineElement.className = lineElement.className.replace(
        /\s(timerange)\s/,
        ""
      );
    }
    this._timeranges.splice(index);
  }

  private onMouseUp(event: MouseEvent): void {
    const line: number = parseInt((event.target as any).parentNode.id);
    if (event.button === 0) {
      if (!this._activeTimerange) {
        this._openTimerange(line);
      } else {
        this._closeTimerange(line);
      }
    } else if (event.button === 2) {
      if (this._activeTimerange) {
        this._cancelTimerange();
      } else {
        this._removeTimerange(line);
      }
    }
  }

  private _onMouseOver(event: MouseEvent): void {
    if (!this._activeTimerange) {
      return;
    }
    const line: number = parseInt((event.target as any).parentNode.id);
    if ((Number as any).isNaN(line)) {
      console.log("Error");
      return;
    }
    for (let lineElement of this._lineElements as any) {
      lineElement.className = lineElement.className.replace(
        /(\stemp\-timerange\s)+/,
        ""
      );
    }
    const timerange: ITimerange = this._timeranges[this._timeranges.length - 1];
    if (timerange.from === undefined) {
      return;
    }
    for (
      let index = timerange.from <= line ? timerange.from : line;
      index <= (timerange.from <= line ? line : timerange.from);
      index++
    ) {
      (this._lineElements.item(index) as HTMLParagraphElement).className +=
        " temp-timerange ";
    }
  }

  // TODO - Mousemove on whole body
  private _attachTimerange(): void {
    this._logsElement.addEventListener("contextmenu", (event: MouseEvent) =>
      event.preventDefault()
    );
    this._logsElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    this._logsElement.addEventListener(
      "mousemove",
      this._onMouseOver.bind(this)
    );
  }
}

new Logviewer(loglines);
