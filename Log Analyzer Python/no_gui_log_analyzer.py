""" Log analyzer command line version """
import sys
import subprocess
from log_analyzer import ECategory, EColors, get_times, get_lines, get_summaries

def __print_error(text: str):
    """ Print error message in red """
    print(f"{EColors.RED} {text} {EColors.ENDC}", end='')

def __execute_option(options, option):
    """ Print out results in color """
    key = list(options)[option]
    function = next(iter(options[key]))
    args = options[key][function]
    summary = function(*args)
    for section, (text, _divider_lines) in summary.items():
        for index, line in enumerate(text.split('\n')):
            print(EColors.ENDC, end='')
            if index in _divider_lines:
                print(EColors.YELLOW, end='')
            elif section == ECategory.SUCCESS:
                print(EColors.GREEN, end='')
            elif section == ECategory.FAILURE:
                print(EColors.RED, end='')
            print(line)
        print(EColors.ENDC, end='')

def __print_help(filename, error):
    """ Print out usage as help for user """
    options = ""
    for index, option in enumerate([
        "Times of all transactions",
        "Times of failure transactions",
        "Times of success transactions",
        "Logs of all transactions",
        "Logs of failure transactions",
        "Logs of success transactions"
    ]):
        options += f"\t{index + 1} = {option}\n"
    __print_error(f"\t--- {error} ---\nUsage:\
         python {filename} <logfile> <option>\n<options>:\n{options}")

def __main():
    """ main function for command line interaction """
    if len(sys.argv) >= 3:
        filename = sys.argv[1]
        if subprocess.run(f"test -f {filename}", check=False).returncode != 0:
            __print_error(f"File {sys.argv[0]} does not exist! Check the path")
            sys.exit(1)
        option = int(sys.argv[2])
        summaries = get_summaries(filename)
        options = {
            "Times of all transactions": {get_times: [summaries, None]},
            "Times of failure transactions": {get_times: [summaries, ECategory.FAILURE]},
            "Times of success transactions": {get_times: [summaries, ECategory.SUCCESS]},
            "Logs of all transactions": {get_lines: [summaries, filename, None]},
            "Logs of failure transactions": {get_lines: [summaries, filename, ECategory.FAILURE]},
            "Logs of success transactions": {get_lines: [summaries, filename, ECategory.SUCCESS]}
        }

        if (option > 0 and option <= len(options)):
            __execute_option(options, option - 1)
        else:
            __print_help(filename, "Invalid option!")
    else:
        __print_help(sys.argv[0], "Insufficient amount of arguments!")

if __name__ == '__main__':
    __main()
