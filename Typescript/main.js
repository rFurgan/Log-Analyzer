"use strict";
var _a;
var EKeyword;
(function (EKeyword) {
    EKeyword["TELEGRAM"] = "Telegram Recieved";
    EKeyword["STATUS"] = "intermediate-status : 104";
})(EKeyword || (EKeyword = {}));
var ECategory;
(function (ECategory) {
    ECategory["SUCCESS"] = "rpc : completion";
    ECategory["FAILURE"] = "rpc : aborted";
})(ECategory || (ECategory = {}));
var EBorder;
(function (EBorder) {
    EBorder["open"] = "OPEN";
    EBorder["close"] = "CLOSE";
})(EBorder || (EBorder = {}));
function getTimestamp(lines, lineNumber, lookUp = true) {
    const regex = /\d+ (\d+\.\d+)/;
    const result = lines[lineNumber].match(regex);
    if (!result || result.length <= 1) {
        if (lookUp && lineNumber >= 0) {
            return getTimestamp(lines, lineNumber - 1, true);
        }
        else if (!lookUp && lineNumber < lines.length) {
            return getTimestamp(lines, lineNumber + 1, true);
        }
        else {
            throw new Error("Failed to find timestamp");
        }
    }
    return result[1];
}
function inNextLines(lines, keywords) {
    let result = null;
    keywords.forEach((keyword) => {
        lines.forEach((line) => {
            if (line.includes(keyword)) {
                result = keyword;
            }
        });
    });
    return result;
}
function timestampToMs(h, m, s, ms) {
    m = h * 60 + m;
    s = m * 60 + s;
    ms = s * 1000 + ms;
    return ms;
}
function toTime(timestamp) {
    const regex = /([0-9]{1,2})([0-9]{2})([0-9]{2})\.([0-9]+)/;
    const result = timestamp.toString().match(regex);
    if (result === null || result.length <= 4) {
        throw new Error("Failed to filter time");
    }
    const [_, h, m, s, ms] = result;
    const timestampMs = timestampToMs(parseInt(h), parseInt(m), parseInt(s), parseInt(ms));
    return [`${h}:${m}:${s}.${ms}`, timestampMs];
}
function getDuration(startTimeMs, stopTimeMs) {
    const durationMs = stopTimeMs - startTimeMs;
    const s = parseInt(`${durationMs / 1000}`);
    const ms = (durationMs % 1000);
    return `${s > 0 ? (s + 's ') : ''}${ms > 0 ? (ms + 'ms') : ''}`;
}
function getSummaries(lines) {
    let timestamp;
    let timestampStart = null;
    let timestampStop = null;
    let lineStart = null;
    let lineStop = null;
    const overviews = [];
    lines.forEach((line, i) => {
        if (line.includes(EKeyword.TELEGRAM)) {
            timestamp = parseFloat(getTimestamp(lines, i));
            if (!timestampStart) {
                if (inNextLines(lines.slice(i + 1, i + 6), [EKeyword.STATUS])) {
                    timestampStart = timestamp;
                    lineStart = i;
                }
            }
            else if (!timestampStop) {
                const rpcResult = inNextLines(lines.slice(i + 1, i + 7), [ECategory.SUCCESS, ECategory.FAILURE]);
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
                        durationTime: getDuration(typeof timeStartMs === 'string' ? parseInt(timeStartMs) : timeStartMs, typeof timeStopMs === 'string' ? parseInt(timeStopMs) : timeStopMs),
                        lineStart: lineStart,
                        lineStop: lineStop
                    });
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
function showTimes(overviews) {
    overviews.forEach((overview, index) => {
        var _a;
        const pre = document.createElement('pre');
        pre.innerHTML = `--- ${index} ---\nStarted at: ${overview.timeStart}\nFinished at: ${overview.timeStop}\nDuration: ${overview.durationTime}\nStarted at line: ${overview.lineStart}\nFinished at line: ${overview.lineStop}`;
        pre.className = `${overview.category === ECategory.SUCCESS ? 'success' : 'fail'} times hover ${index}`;
        pre.addEventListener('click', () => {
            location.href = `#${overview.lineStart}`;
        });
        (_a = document.getElementById(`${overview.category === ECategory.SUCCESS ? 's' : 'f'}-times`)) === null || _a === void 0 ? void 0 : _a.append(pre);
    });
}
function showLogs(lines, overviews) {
    let overview;
    lines.forEach((line, index) => {
        var _a;
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
            }
            else if (index >= overview.lineStop) {
                overview = undefined;
            }
        }
        (_a = document.getElementById('logs')) === null || _a === void 0 ? void 0 : _a.append(pre);
    });
}
function readSingleFile(event) {
    let file = event.target.files[0];
    if (!file) {
        return;
    }
    document.title = file.name;
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
        var _a;
        const content = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
        displayContents(content);
    };
    fileReader.readAsText(file);
}
function mark(index, start) {
    const className = document.getElementById(`${index}`).className;
    if (start) {
        document.getElementById(`${index}`).className += ' mark-start ';
    }
    else {
        document.getElementById(`${index}`).className = className.replace('mark-start', '');
        document.getElementById(`${index}`).className += ' mark ';
    }
}
function removeStartMark(index) {
    document.getElementById(`${index}`).className = document.getElementById(`${index}`).className.replace('mark-start', '');
}
function removeMarks(from, to) {
    console.log(document.getElementById(`${from}-${to}`));
    console.log(`${from}-${to}`);
    document.getElementById(`${from}-${to}`).remove();
    for (let i = from; i <= to; i++) {
        document.getElementById(`${i}`).className = document.getElementById(`${i}`).className.replace(/(mark)/, '');
    }
}
function timeRange(lines, from, to) {
    const timestampStart = parseFloat(getTimestamp(lines, from));
    const timestampStop = parseFloat(getTimestamp(lines, to));
    const [timeStart, timeStartMs] = toTime(timestampStart);
    const [timeStop, timeStopMs] = toTime(timestampStop);
    const duration = getDuration(timeStartMs, timeStopMs);
    const pre = document.createElement('pre');
    pre.innerText = `Start:    ${timeStart}\nStop:     ${timeStop}\nDuration: ${duration}`;
    pre.className = 'timerange';
    pre.id = `${from}-${to}`;
    document.getElementById(`${from}`).prepend(pre);
}
function displayContents(content) {
    const lines = content.split('\n');
    const overviews = getSummaries(lines);
    showTimes(overviews);
    showLogs(lines, overviews);
    let start = -1;
    const logs = document.getElementById('logs');
    const ranges = [];
    logs.addEventListener('mouseup', (event) => {
        if (event.button === 0) {
            if (isNaN(Number(event.target.id))) {
                return;
            }
            if (start == -1) {
                start = parseInt(event.target.id);
                mark(start, true);
            }
            else {
                const end = parseInt(event.target.id);
                let from;
                let to;
                if (end > start) {
                    from = start;
                    to = end;
                }
                else {
                    from = end;
                    to = start;
                }
                for (let i = from; i <= to; i++) {
                    mark(i, false);
                }
                ranges.push([from, to]);
                timeRange(lines, from, to);
                start = -1;
            }
        }
        else if (event.button === 2) {
            if (start !== -1) {
                removeStartMark(start);
                start = -1;
            }
            else {
                const target = event.target;
                let line = Number(target.id);
                if (isNaN(line)) {
                    const result = target.id.match(/\d+\-\d+/);
                    if (result === null) {
                        return;
                    }
                    line = parseInt(result[0]);
                }
                const mark = {
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
(_a = document.getElementById('file-input')) === null || _a === void 0 ? void 0 : _a.addEventListener('change', readSingleFile, false);
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});
