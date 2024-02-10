""" Log analyzer general functionality """
import re
import locale

class EColors:
    """ Enumeration representing color codes for output """
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    ENDC = '\033[0m'

class ECategory:
    """ Enumeration representing categories of interaction in logs """
    SUCCESS="rpc : completion"
    FAILURE="rpc : aborted"

def __get_duration(start_time_in_ms, stop_time_in_ms):
    """ Calculate and return time passed between timestamps in milliseconds """
    duration_in_ms = stop_time_in_ms - start_time_in_ms
    s = int(duration_in_ms / 1000)
    ms = duration_in_ms % 1000
    return f"{s}.{ms:03}s"

def __timestamp_to_ms(h, m, s, ms):
    """ Convert and return time into milliseconds """
    m = h * 60 + m
    s = m * 60 + s
    ms = s * 1000 + ms
    return ms

def __get_timestamp(line):
    """ Extract and return timestamp from provided line """
    regex_result = re.search(r"\d+ (\d+\.\d+)", line)
    if not regex_result:
        raise NotImplementedError("Timestamp not detected")
    return float(regex_result.groups()[0])

def __in_next_lines(lines, keywords):
    """ Check provided lines for keywords and return result """
    for keyword in keywords:
        for line in lines:
            if keyword in line:
                return keyword
    return None

def __to_time(timestamp):
    """ Convert given timestamp and return as time """
    regex = r"([0-9]{1,2})([0-9]{2})([0-9]{2})\.([0-9]+)"
    h, m, s, ms = re.search(regex, str(timestamp)).groups()
    timestamp_in_ms = __timestamp_to_ms(int(h), int(m), int(s), int(ms))
    return f"{int(h):02}:{m}:{s}.{ms}", timestamp_in_ms

def __summarize_times(summaries):
    """ Calculate and return time differences of each interaction """
    text = ""
    divider_lines=[]
    counter = 0
    for summary in summaries:
        divider_lines.append(text.count('\n'))
        text += f"------------- #{counter} -------------\n"
        for key, value in summary.items():
            text += f"{key:<15}: {value}\n"
        counter += 1
    return text, divider_lines

def __summarize_logs(summaries, filename):
    """ Detect and return logs of each interaction """
    text = ""
    divider_lines=[]
    counter = 0
    for summary in summaries:
        divider_lines.append(text.count('\n'))
        text += f"------------- #{counter} -------------\n"
        with open(filename, 'r', encoding=locale.getpreferredencoding()) as read_file:
            for line_number, line in enumerate(read_file):
                if summary["stop_line"] >= line_number >= summary["start_line"]:
                    text += line
            counter += 1
    return text, divider_lines

def get_summaries(filename):
    """ Summarize extracted information as object """
    summaries = {ECategory.SUCCESS: [], ECategory.FAILURE: []}
    with open(filename, 'r', encoding=locale.getpreferredencoding()) as read_file:
        timestamp_start = None
        line_start = None
        timestamp_stop = None
        line_stop = None
        lines = read_file.readlines()
        for i, line in enumerate(lines):
            if "Telegram Recieved." in line:
                timestamp = __get_timestamp(line)
                if not timestamp_start:
                    if __in_next_lines(lines[i+1:i+6], ["intermediate-status : 104"]):
                        timestamp_start = timestamp
                        line_start = i
                elif not timestamp_stop:
                    rpc_result = __in_next_lines(lines[i+1:i+7],\
                        [ECategory.SUCCESS, ECategory.FAILURE])
                    if rpc_result:
                        timestamp_stop = timestamp
                        line_stop = i + 7

                        start_time, start_time_in_ms = __to_time(timestamp_start)
                        stop_time, stop_time_in_ms = __to_time(timestamp_stop)

                        summaries[rpc_result].append({
                            'start_time': start_time,
                            'stop_time': stop_time,
                            'duration_time': __get_duration(start_time_in_ms, stop_time_in_ms),
                            'start_line': line_start,
                            'stop_line': line_stop
                        })
                        timestamp_start = None
                        timestamp_stop = None
                        line_start = None
                        line_stop = None
        return summaries

def get_times(summaries, category):
    """ Calculate and return summary of time differences of each interaction """
    summary={}
    if category == ECategory.FAILURE:
        summary[ECategory.FAILURE] = __summarize_times(summaries[ECategory.FAILURE])
    elif category == ECategory.SUCCESS:
        summary[ECategory.SUCCESS] = __summarize_times(summaries[ECategory.SUCCESS])
    else:
        summary[ECategory.SUCCESS] = __summarize_times(summaries[ECategory.SUCCESS])
        summary[ECategory.FAILURE] = __summarize_times(summaries[ECategory.FAILURE])
    return summary

def get_lines(summaries, filename, category):
    """ Detect and return summary of logs of each interaction """
    summary={}
    if category == ECategory.FAILURE:
        summary[ECategory.FAILURE] = __summarize_logs(summaries[ECategory.FAILURE], filename)
    elif category == ECategory.SUCCESS:
        summary[ECategory.SUCCESS] = __summarize_logs(summaries[ECategory.SUCCESS], filename)
    else:
        summary[ECategory.SUCCESS] = __summarize_logs(summaries[ECategory.SUCCESS], filename)
        summary[ECategory.FAILURE] = __summarize_logs(summaries[ECategory.FAILURE], filename)
    return summary
