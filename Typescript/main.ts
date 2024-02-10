enum EKeyword {
	TELEGRAM="Telegram Recieved",
	STATUS="intermediate-status : 104"
}

enum ECategory {
	SUCCESS="rpc : completion",
	FAILURE="rpc : aborted"
}

enum EBorder {
    open="OPEN",
    close="CLOSE",
}

interface IOverview {
	category: ECategory | EKeyword,
	timeStart: string | number,
	timeStop: string | number,
	durationTime: string,
	lineStart: number,
	lineStop: number,
}

interface IMark {
    closest: number;
    index: number;
    from: number;
    to: number;
}

function getTimestamp(lines: string[], lineNumber: number, lookUp: boolean = true): string {
	const regex = /\d+ (\d+\.\d+)/;
	const result = lines[lineNumber].match(regex);
	if (!result || result.length <= 1) {
        if (lookUp && lineNumber >= 0) {
            return getTimestamp(lines, lineNumber - 1, true);
        } else if (!lookUp && lineNumber < lines.length) {
            return getTimestamp(lines, lineNumber + 1, true);
        } else {
            throw new Error("Failed to find timestamp");
        }
	}
	return result[1];
}

function inNextLines(lines: string[], keywords: EKeyword[] | ECategory[]): EKeyword | ECategory | null {
	let result: EKeyword | ECategory | null = null;
	keywords.forEach((keyword: EKeyword | ECategory) => {
		lines.forEach((line: string) => {
			if (line.includes(keyword)) {
				result = keyword;
			}
		})
	})
	return result;
}

function timestampToMs(h: number, m: number, s: number, ms: number): number {
	m = h * 60 + m;
	s = m * 60 + s;
	ms = s * 1000 + ms;
	return ms;
}

function toTime(timestamp: number): [string, number] {
	const regex: RegExp = /([0-9]{1,2})([0-9]{2})([0-9]{2})\.([0-9]+)/;
	const result: RegExpMatchArray | null = timestamp.toString().match(regex);
	if (result === null || result.length <= 4) {
		throw new Error("Failed to filter time");
	}
	const [_, h, m, s, ms] = result;
	const timestampMs = timestampToMs(parseInt(h), parseInt(m), parseInt(s), parseInt(ms));
	return [`${h}:${m}:${s}.${ms}`, timestampMs];
}

function getDuration(startTimeMs: number, stopTimeMs: number): string {
	const durationMs: number = stopTimeMs - startTimeMs;
	const s: number = parseInt(`${durationMs / 1000}`);
	const ms: number = (durationMs % 1000);
	return `${s > 0 ? (s + 's ') : ''}${ms > 0 ? (ms + 'ms') : ''}`;
}

function getSummaries(lines: string[]): IOverview[] {
	let timestamp: number;
	let timestampStart: number | null = null;
	let timestampStop: number | null = null;
	let lineStart: number | null = null;
	let lineStop: number | null = null;
	const overviews: IOverview[] = [];

	lines.forEach((line: string, i: number) => {
		if (line.includes(EKeyword.TELEGRAM)) {
			timestamp = parseFloat(getTimestamp(lines, i));
			if (!timestampStart) {
				if (inNextLines(lines.slice(i+1,i+6), [EKeyword.STATUS])) {
					timestampStart = timestamp;
					lineStart = i;
				}
			} else if (!timestampStop) {
				const rpcResult: EKeyword | ECategory | null = inNextLines(lines.slice(i+1,i+7), [ECategory.SUCCESS, ECategory.FAILURE]);
				if (rpcResult) {
					timestampStop = timestamp;
					lineStop = i + 7;
					const [timeStart, timeStartMs] = toTime(timestampStart);
					const [timeStop, timeStopMs] = toTime(timestampStop);
					if (lineStart === null) {
						throw new Error("Something went wrong");
					}
					overviews.push({
						category: rpcResult,
						timeStart: timeStart,
						timeStop: timeStop,
						durationTime: getDuration(
							typeof timeStartMs === 'string' ? parseInt(timeStartMs) : timeStartMs,
							typeof timeStopMs === 'string' ? parseInt(timeStopMs) : timeStopMs
						),
						lineStart: lineStart,
						lineStop: lineStop
					})
					timestampStart = null;
					timestampStop = null;
					lineStart = null;
					lineStop = null;
				}
			}
		}
	});
	return overviews;
}

function showTimes(overviews: IOverview[]): void {
	overviews.forEach((overview: IOverview, index: number) => {
		const pre = document.createElement('pre');
		pre.innerHTML = `--- ${index} ---\nStarted at: ${overview.timeStart}\nFinished at: ${overview.timeStop}\nDuration: ${overview.durationTime}\nStarted at line: ${overview.lineStart}\nFinished at line: ${overview.lineStop}`
		pre.className = `${overview.category === ECategory.SUCCESS ? 'success' : 'fail'} times hover ${index}`;
		pre.addEventListener('click', () => {
			location.href = `#${overview.lineStart}`;
		});
		document.getElementById(`${overview.category === ECategory.SUCCESS ? 's' : 'f'}-times`)?.append(pre);
	});
    
}

function showLogs(lines: string[], overviews: IOverview[]): void {
    let overview: undefined | IOverview;
    lines.forEach((line: string, index: number) => {
        if (overview === undefined && overviews.length > 0) {
            overview = overviews.shift();
        }
        const pre = document.createElement('pre');
        pre.innerHTML = line;
        pre.id = `${index}`;

        if (overview != undefined) {
            if (index >= overview.lineStart && index < overview.lineStop) {
                pre.id = `${index}`;
                pre.className = `${overview.category === ECategory.SUCCESS ? 'success' : 'fail'}-logs ${index}`;
            } else if (index >= overview.lineStop) {
                overview = undefined;
            }
        }
        document.getElementById('logs')?.append(pre);
    });
}

function readSingleFile(event: any): void {
	let file: File = event.target.files[0];
	if (!file) {
		return;
	}
    document.title = file.name;
    const fileReader = new FileReader();
	fileReader.onload = (event: ProgressEvent<FileReader>) => {
		const content = event.target?.result;
		displayContents(content);
	};
	fileReader.readAsText(file);
}

function mark(index: number, start: boolean): void {
    const className: string = (document.getElementById(`${index}`) as HTMLElement).className;
    if (start) {
        (document.getElementById(`${index}`) as HTMLElement).className += ' mark-start ';
    } else {
        (document.getElementById(`${index}`) as HTMLElement).className = className.replace('mark-start', '');
        (document.getElementById(`${index}`) as HTMLElement).className += ' mark ';
    }
}

function removeStartMark(index: number): void {
    (document.getElementById(`${index}`) as HTMLElement).className = (document.getElementById(`${index}`) as HTMLElement).className.replace('mark-start', '');
}

function removeMarks(from: number, to: number): void {
    console.log((document.getElementById(`${from}-${to}`) as HTMLElement));
    console.log(`${from}-${to}`);
    (document.getElementById(`${from}-${to}`) as HTMLElement).remove();
    for(let i=from; i<=to; i++) {
        (document.getElementById(`${i}`) as HTMLElement).className = (document.getElementById(`${i}`) as HTMLElement).className.replace(/(mark)/, '');
    }
}

function timeRange(lines: string[], from: number, to: number): void {
    const timestampStart: number = parseFloat(getTimestamp(lines, from));
    const timestampStop: number = parseFloat(getTimestamp(lines, to));
    const [timeStart, timeStartMs] = toTime(timestampStart);
    const [timeStop, timeStopMs] = toTime(timestampStop);
    const duration: string = getDuration(timeStartMs as number, timeStopMs as number);
    const pre = document.createElement('pre');
    pre.innerText = `Start:    ${timeStart}\nStop:     ${timeStop}\nDuration: ${duration}`;
    pre.className = 'timerange';
    pre.id =  `${from}-${to}`;
    (document.getElementById(`${from}`) as HTMLElement).prepend(pre);
}

function displayContents(content: string | ArrayBuffer | null | undefined): void {
	const lines: string[] = (content as string).split('\n');
	const overviews: IOverview[] = getSummaries(lines);

	showTimes(overviews);
	showLogs(lines, overviews);

    let start = -1;
    const logs = (document.getElementById('logs') as HTMLElement);
    const ranges: number[][] = [];
    logs.addEventListener('mouseup', (event: MouseEvent) => {
        if (event.button === 0) {
            if (isNaN(Number((event.target as HTMLElement).id))) {
                return;
            }
            if (start == -1) {
                start = parseInt((event.target as HTMLElement).id);
                mark(start, true);
            } else {
                const end = parseInt((event.target as HTMLElement).id);
                let from: number;
                let to: number;
                if (end > start) {
                    from = start;
                    to = end;
                } else {
                    from = end;
                    to = start;
                }
                for (let i=from; i<=to; i++) {
                    mark(i, false);
                }
                ranges.push([from, to]);
                timeRange(lines, from, to);
                start = -1;
            }
        } else if (event.button === 2) {
            if (start !== -1) {
                removeStartMark(start);
                start = -1;
            } else {
                const target = (event.target as HTMLElement);
                let line: number = Number(target.id);
                if (isNaN(line)) {
                    const result = target.id.match(/\d+\-\d+/);
                    if (result === null) {
                        return;
                    }
                    line = parseInt(result[0]);
                }
                const mark: IMark = {
                    index: -1,
                    closest: -1,
                    from: -1,
                    to: -1,
                };
                ranges.forEach(([from, to], i) => {
                    if (line >= from && line <= to) {
                        if (mark.closest < 0 || mark.closest > from) {
                            mark.closest = from;
                            mark.index = i;
                            mark.from = from;
                            mark.to = to;
                        }
                    }
                });
                if (mark.index === -1) {
                    return;
                }
                removeMarks(mark.from, mark.to);
                ranges.splice(mark.index, 1);
            }
        }
    });
}

document.getElementById('file-input')?.addEventListener('change', readSingleFile, false);
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});
