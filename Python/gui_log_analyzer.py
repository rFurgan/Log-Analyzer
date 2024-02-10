""" Log analyzer GUI to open a window for each seleced option """
from re import search
from subprocess import PIPE, run
from tkinter import Listbox, Button, Tk, Text, Scrollbar
from tkinterdnd2 import DND_ALL, TkinterDnD
from log_analyzer import ECategory, get_times, get_lines, get_summaries

DARK= "#26242f"

def __on_drop(event, list_box) -> None:
    """ Upon drop of file/folder parse through first layer of folder and list all files """
    paths = event.data.split(' ')
    for path in paths:
        if __is_folder(path):
            listed = run(['ls', path],\
                check=False, stdout=PIPE).stdout.decode('utf-8').split('\n')
            for item in listed:
                path = f"{path}/{item}"
                if not __is_folder(path) and item != '':
                    list_box.insert('end', path)
        else:
            list_box.insert('end', path)
    list_box.selection_clear(0, 'end')
    list_box.selection_set('end')

def __is_folder(path: str) -> bool:
    """ Check if path is a folder or not """
    return run(f"test -d \"{path}\"", check=False).returncode == 0

def __create_list(window: TkinterDnD.Tk) -> Listbox:
    """ Create list with drag&drop functionality (can drop 'both' files and folders) """
    list_box: Listbox = Listbox(window, selectmode='browse')
    list_box.config(bg=DARK, fg='white')
    list_box.drop_target_register(DND_ALL)
    list_box.dnd_bind('<<Drop>>', lambda event: __on_drop(event, list_box))
    list_box.pack(expand=True, fill='both')
    return list_box

def __create_function_buttons(window: TkinterDnD.Tk, list_box: Listbox) -> None:
    """" Create buttons with corresponding callback functions """
    all_times_button = Button(window, text="All Times",\
        command=lambda: __all_times(list_box))
    all_times_button.pack(expand=True, side="left", padx=5, pady=5)

    failure_times_button = Button(window, text="Failure Times",\
        command=lambda: __failure_times(list_box), bg="red")
    failure_times_button.pack(expand=True, side="left", padx=5)

    success_times_button = Button(window, text="Success Times",\
        command=lambda: __success_times(list_box), bg="green")
    success_times_button.pack(expand=True, side="left", padx=5)

    all_logs_button = Button(window, text="All Logs",\
        command=lambda: __all_logs(list_box))
    all_logs_button.pack(expand=True, side="left", padx=5)

    failure_logs_button = Button(window, text="Failure Logs",\
        command=lambda: __failure_logs(list_box), bg="red")
    failure_logs_button.pack(expand=True, side="left", padx=5)

    success_logs_button = Button(window, text="Success Logs",\
        command=lambda: __success_logs(list_box), bg="green")
    success_logs_button.pack(expand=True, side="left", padx=5)

def __extract_filename(path: str) -> str or None:
    """ Extract filename from path """
    result = search(r"([a-zA-Z_\-0-9]+)(\.[a-zA-Z_\-0-9]+){0,1}$", path)
    return result.groups()[0] if result else None

def __get_filename_path(list_box: str) -> list[str]:
    """ Get selected file from listbox """
    selection = list_box.curselection()
    if len(selection) == 0:
        return (None, None)
    path = list_box.get(selection)
    filename = __extract_filename(path)
    return (filename, path)

def __text_in_new_window(title: str, filename: str, summary: dict[str, tuple]) -> None:
    """ Create new window to show requested logs/times as colored text """
    window: Tk = Tk()
    window.title(f"{title} - {filename}")
    window.config(bg=DARK)

    scrollbar_y = Scrollbar(window, orient='vertical')
    scrollbar_y.pack(side='right', fill='y')

    text_box = Text(window, yscrollcommand=scrollbar_y.set)
    prev_text_lines = 0

    for index, (section, (text, divider_lines)) in enumerate(summary.items()):
        text_box.insert('end', text)

        text_box.tag_add(f"t_{index}", f"{prev_text_lines+1}.0",\
            f"{text.count('\n')+1+prev_text_lines}.0")
        text_box.tag_config(f"t_{index}", background="#26242f",\
            foreground=("green" if section == ECategory.SUCCESS else "red"))

        for divider_line in divider_lines:
            text_box.tag_add(f"d_{index}", f"{divider_line+prev_text_lines+1}.0",\
                f"{divider_line+prev_text_lines+2}.0")
            text_box.tag_config(f"d_{index}", background="yellow", foreground="purple")
        prev_text_lines = text.count('\n')

    text_box.pack(expand=True, fill='both')
    text_box.config(bg=DARK, state='disabled')
    scrollbar_y.config(command=text_box.yview)

def __all_times(list_box: Listbox) -> None:
    """ Create new windows with an time overview of 'both' failed and succeeded interactions"""
    (filename, path) = __get_filename_path(list_box)
    if filename is None or path is None:
        return
    __text_in_new_window('All times', filename, get_times(get_summaries(path), None))

def __failure_times(list_box: Listbox) -> None:
    """ Create new windows with an time overview of failed interactions"""
    (filename, path) = __get_filename_path(list_box)
    if filename is None or path is None:
        return
    __text_in_new_window('Failure times', filename, get_times(get_summaries(path),\
        ECategory.FAILURE))

def __success_times(list_box: Listbox) -> None:
    """ Create new windows with an time overview of succeeded interactions"""
    (filename, path) = __get_filename_path(list_box)
    if filename is None or path is None:
        return
    __text_in_new_window('Success times', filename, get_times(get_summaries(path),\
        ECategory.SUCCESS))

def __all_logs(list_box: Listbox) -> None:
    """ Create new windows with logs of 'both' failed and succeeded interactions"""
    (filename, path) = __get_filename_path(list_box)
    if filename is None or path is None:
        return
    __text_in_new_window('All logs', filename, get_lines(get_summaries(path), path, None))

def __failure_logs(list_box: Listbox) -> None:
    """ Create new windows with logs of failed interactions"""
    (filename, path) = __get_filename_path(list_box)
    if filename is None or path is None:
        return
    __text_in_new_window('Failure logs', filename, get_lines(get_summaries(path), path,\
        ECategory.FAILURE))

def __success_logs(list_box: Listbox) -> None:
    """ Create new windows with logs of succeeded interactions"""
    (filename, path) = __get_filename_path(list_box)
    if filename is None or path is None:
        return
    __text_in_new_window('Success logs', filename, get_lines(get_summaries(path), path,\
        ECategory.SUCCESS))

if __name__ == '__main__':
    root: TkinterDnD.Tk = TkinterDnD.Tk()
    __create_function_buttons(root, __create_list(root))
    root.config(bg=DARK)
    root.mainloop()
