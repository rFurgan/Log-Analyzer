const loglines = ["13:20:10.166 djs","13:20:10.448 nmyh","13:20:11.434 ndcydyxnvta","13:20:11.952 vxke","13:20:12.205 hctvq","13:20:12.690 lcpbhj","13:20:13.640 cwvfjpeg","13:20:14.590 hqd","13:20:15.482 qzabg","13:20:15.793 eoxfuelkg","13:20:16.634 ","13:20:16.724 lk","13:20:16.860 rfdch","13:20:17.507 uatgkwdil","13:20:18.491 rsxrnscor","13:20:19.151 fbwhrkkzxm","13:20:19.529 tfxef","13:20:19.917 a","13:20:20.811 khzgndnjnta","13:20:21.372 ooyuqipo","13:20:22.352 ","13:20:22.457 o","13:20:22.822 yjj","13:20:23.406 kgboaehgxmq","13:20:24.13 bfo","13:20:24.136 rxpnoulncf","13:20:24.354 kstchdjuqftum","13:20:25.80 syugionwzc","13:20:25.332 uznphwchr","13:20:26.35 ","13:20:26.718 tmfdxn","13:20:26.953 unmhahumhvko","13:20:27.923 kevmourqxvycx","13:20:28.313 xvwn","13:20:29.79 ycmskvqyviu","13:20:30.68 ddycnwpja","13:20:30.127 zzdwb","13:20:30.778 hwictlwywd","13:20:31.357 ujjojxw","13:20:31.586 z","13:20:32.56 vdnr","13:20:32.238 ","13:20:33.63 ","13:20:33.359 vwfxlwhmx","13:20:34.116 ","13:20:34.800 xizux","13:20:35.183 pipcvwbipmyo","13:20:35.217 ofgeslmysnprozth","13:20:35.720 nopejey","13:20:36.299 rpcafvqahj","13:20:36.472 zxvuvodq","13:20:37.154 sfmdvoilybxgtuep","13:20:37.608 yodxqqhajn","13:20:38.216 ","13:20:38.910 ","13:20:39.851 peqlthzshnvwiodil","13:20:40.574 rmka","13:20:40.928 ","13:20:41.888 qzxeuhodgv","13:20:42.731 lnluirknj","13:20:42.783 unaexmtidb","13:20:43.396 gn","13:20:44.16 fxtj","13:20:44.284 mxeksen"]

interface ITimerange {
    from?: number;
    to?: number;
}

class Logviewer {
    private _logs: string[];
    private _matchLines: number[] = []
    private _activeTimerange: boolean = false;
    private _timeranges: ITimerange[] = [];
    private _tempTimerange: ITimerange;

    readonly rMATCH: RegExp = /\smatch\s/;
    readonly rDONT_SHOW: RegExp = /\s(dont-show)\s/;
    readonly rLINE_LOG: RegExp = /(line|log)\-(\d+)/;
    readonly rTIMERANGE: RegExp = /\s(timerange)\s/;
    readonly rTEMP_TIMERANGE: RegExp = /(\stemp\-timerange\s)+/

    readonly MATCH: string = ' match ';
    readonly TIMERANGE: string = ' timerange ';
    readonly DONT_SHOW: string = ' dont-show '
    readonly TEMP_TIMERANGE: string = ' temp-timerange '

    constructor(logs: string[]) {
        this._logs = logs;        
        this._addLogs();
        this._attachSearch();
        this._attachMatchesOnly();
        this._attachTimerange();
    }

    private _addLogs(): void {
        const logs: HTMLElement = (document.getElementById('logs') as HTMLDivElement);
        const lines: HTMLElement = (document.getElementById('lines') as HTMLDivElement);
    
        this._logs.forEach((line: string, lineNumber: number) => {
            const logElement: HTMLParagraphElement = document.createElement('p');
            const lineElement: HTMLParagraphElement = document.createElement('p');
    
            logElement.id = `line-${lineNumber.toString()}`;
            lineElement.id = `log-${lineNumber.toString()}`;
    
            logElement.className += 'log'
            lineElement.className += 'log'
    
            logElement.innerText = line;
            lineElement.innerText = lineNumber.toString();
    
            logs.appendChild(logElement);
            lines.appendChild(lineElement);
        });
    }

    private _markMatches(revert: boolean): void {
        this._matchLines.forEach((lineNumber: number) => {
            const logElement: HTMLParagraphElement = (document.getElementById(`log-${lineNumber.toString()}`) as HTMLParagraphElement);
            const lineElement: HTMLParagraphElement = (document.getElementById(`line-${lineNumber.toString()}`) as HTMLParagraphElement);
            if (revert) {
                logElement.className = logElement.className.replace(this.rMATCH, '');
                lineElement.className = lineElement.className.replace(this.rMATCH, '');
            } else {
                logElement.className += this.MATCH;
                lineElement.className += this.MATCH;
            }
        });
    }

    private _matchesOnly(): void {
        const showOnlyMatchesElement: HTMLInputElement = (document.getElementById('showOnlyMatches') as HTMLInputElement);
        for (let element of (document.getElementsByClassName('log') as HTMLCollectionOf<HTMLParagraphElement> as any)) {
            const match: RegExpMatchArray | null = element.id.match(this.rLINE_LOG);
            if (match == null || match.length < 1) {
                return;
            }
            const id: number = parseInt(match[match.length - 1]);
            if (this._matchLines.indexOf(id) === -1) {
                if (!showOnlyMatchesElement.checked) {
                    element.className = element.className.replace(this.rDONT_SHOW, '');
                } else if (showOnlyMatchesElement.checked && element.className.indexOf(this.DONT_SHOW) === -1) {
                    element.className += this.DONT_SHOW;
                }
            } else {
                element.className = element.className.replace(this.rDONT_SHOW, '');
            }
        }
    }

    private _attachMatchesOnly(): void {
        const showOnlyMatchesElement: HTMLInputElement = (document.getElementById('showOnlyMatches') as HTMLInputElement);
        showOnlyMatchesElement.addEventListener('change', this._matchesOnly.bind(this));
    }

    private _search(): void {
        const searchElement = (document.getElementById('search') as HTMLInputElement);
        this._markMatches(true);
        const searchRequest: string = searchElement.value.trim();
        this._matchLines = searchRequest === '' ? [] : (loglines as any).flatMap((line: string, lineNumber: number) => {
            return line.indexOf(searchRequest) > -1 ? lineNumber : [];
        });
        this._matchesOnly();
        this._markMatches(false);
    }

    private _attachSearch(): void {
        const searchElement = (document.getElementById('search') as HTMLInputElement);
        searchElement.addEventListener('keyup', this._search.bind(this));
    }

    private _addTimerange() {
        const top: HTMLDivElement = (document.getElementById('top') as HTMLDivElement);
        const container: HTMLDivElement = (document.getElementById('container') as HTMLDivElement);
        const topHeight: number = top.getBoundingClientRect().height;
        const timerange: ITimerange = this._timeranges[this._timeranges.length - 1];
        const fromRect: DOMRect = (document.getElementById(`line-${timerange.from}`) as HTMLParagraphElement).getBoundingClientRect();
        const toRect: DOMRect = (document.getElementById(`line-${timerange.to}`) as HTMLParagraphElement).getBoundingClientRect();
        const p: HTMLParagraphElement = document.createElement('p');
        p.innerText = "100 - 200";
        p.className = "sideways";
        p.style.marginTop = `${fromRect.top - topHeight}px`;
        p.style.height = `${toRect.top + toRect.height - topHeight}px`
        container.insertBefore(p, container.firstChild);
        // TODO
    }

    // Class with `from-to` and remove only those

    private _closeTimerangeTags(collection: HTMLCollectionOf<HTMLParagraphElement>): void {
        const timerange: ITimerange = this._timeranges[this._timeranges.length - 1];
        if (timerange.from === undefined || timerange.to === undefined) {
            return;
        }
        for(let line=timerange.from; line <= timerange.to; line++) {
            const lineElement: HTMLParagraphElement = (collection.item(line) as HTMLParagraphElement);
            const logElement: HTMLParagraphElement = (collection.item(line + collection.length / 2) as HTMLParagraphElement);
            lineElement.className = lineElement.className.replace(this.rTEMP_TIMERANGE, this.TIMERANGE);
            logElement.className = logElement.className.replace(this.rTEMP_TIMERANGE, this.TIMERANGE);
        }
    }

    private _closeTimerange(collection: HTMLCollectionOf<HTMLParagraphElement>, line: number): void {
        const timerange = this._timeranges[this._timeranges.length - 1];
        if (timerange.from !== undefined && timerange.from > line) {
            timerange.to = timerange.from;
            timerange.from = line;
        } else {
            this._timeranges[this._timeranges.length - 1].to = line;
        }
        this._activeTimerange = false;
        this._closeTimerangeTags(collection);
        // this._addTimerange();
    }

    private _openTimerange(collection: HTMLCollectionOf<HTMLParagraphElement>, line: number): void {
        this._timeranges.push({from: line});
        (collection.item(line) as HTMLParagraphElement).className += this.TEMP_TIMERANGE;
        (collection.item(line + collection.length / 2) as HTMLParagraphElement).className += this.TEMP_TIMERANGE;
        this._activeTimerange = true;
    }

    private _cancelTimerange(collection: HTMLCollectionOf<HTMLParagraphElement>): void {
        const activeLine: number | undefined = this._timeranges[this._timeranges.length - 1].from;
        if (activeLine === undefined) {
            return;
        }
        const lineElement: HTMLParagraphElement = collection.item(activeLine) as HTMLParagraphElement;
        const logElement: HTMLParagraphElement = collection.item(activeLine + collection.length / 2) as HTMLParagraphElement;
        lineElement.className = lineElement.className.replace(this.rTIMERANGE, '');
        logElement.className = logElement.className.replace(this.rTIMERANGE, '');
        this._timeranges.pop();
        this._activeTimerange = false;
    }

    private _getClosestTimerangeIndex(line: number): number {
        let timerangeIndex: number = -1;
        this._timeranges.forEach((timerange: ITimerange, index: number) => {
            if (timerange.from !== undefined && timerange.from <= line && timerange.from > timerangeIndex) {
                timerangeIndex = index;
            }
        });
        return timerangeIndex;
    }

    private _removeTimerange(collection: HTMLCollectionOf<HTMLParagraphElement>, line: number): void {
        const index: number = this._getClosestTimerangeIndex(line);
        if (index === -1) {
            return;
        }
        const timerange: ITimerange = this._timeranges[index];
        if (timerange.from === undefined || timerange.to === undefined) {
            return;
        }
        for(let line=timerange.from; line <= timerange.to; line++) {
            const lineElement: HTMLParagraphElement = (collection.item(line) as HTMLParagraphElement);
            const logElement: HTMLParagraphElement = (collection.item(line + collection.length / 2) as HTMLParagraphElement);
            lineElement.className = lineElement.className.replace(this.rTIMERANGE, '');
            logElement.className = logElement.className.replace(this.rTIMERANGE, '');
        }
        this._timeranges.splice(index);
    }

    private onTimerange(event: MouseEvent): void {
        const match: RegExpMatchArray | null = (event.target as HTMLParagraphElement).id.match(this.rLINE_LOG);
        if (match == null || match.length < 1) {
            return;
        }
        const line: number = parseInt(match[match.length - 1]);
        const collection: HTMLCollectionOf<HTMLParagraphElement> = document.getElementsByClassName('log') as HTMLCollectionOf<HTMLParagraphElement>;
        if (event.button === 0) {
            if (!this._activeTimerange) {
                this._openTimerange(collection, line);
            } else {
                this._closeTimerange(collection, line);
            }
        } else if (event.button === 2) {
            if (this._activeTimerange) {
                this._cancelTimerange(collection);
            } else {
                this._removeTimerange(collection, line);
            }
        }    
    }

    private _onMouseOver(event: MouseEvent): void {
        if (!this._activeTimerange) {
            return;
        }
        const match: RegExpMatchArray | null = (event.target as HTMLParagraphElement).id.match(this.rLINE_LOG);
        if (match == null || match.length < 1) {
            return;
        }
        const collection: HTMLCollectionOf<HTMLParagraphElement> = document.getElementsByClassName('log') as HTMLCollectionOf<HTMLParagraphElement>;
        for(let element of (collection as any)) {
            element.className = element.className.replace(this.rTEMP_TIMERANGE, '');
        }
        const line: number = parseInt(match[match.length - 1]);
        const timerange: ITimerange = this._timeranges[this._timeranges.length - 1];
        if (timerange.from === undefined) {
            return;
        }
        for(let index = (timerange.from <= line ? timerange.from : line); index <= (timerange.from <= line ? line : timerange.from); index++) {
            (collection.item(index) as HTMLParagraphElement).className += this.TEMP_TIMERANGE;
            (collection.item(index + collection.length / 2) as HTMLParagraphElement).className += this.TEMP_TIMERANGE;
        }
    }

    private _attachTimerange(): void {
        (document.getElementById('container') as HTMLDivElement).addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault());
        (document.getElementById('container') as HTMLDivElement).addEventListener('mouseup', this.onTimerange.bind(this));
        (document.getElementById('container') as HTMLDivElement).addEventListener('mousemove', this._onMouseOver.bind(this));
    }
}

new Logviewer(loglines);