import time
from typing import Literal, Optional, Callable

import requests

URLs_to_check = [
    "https://wikisim-server.wikisim.deno.net/1272v11/vite.svg",
]

type Logger = Callable[[Literal["OK", "ERROR"], str, Optional[float]], None]

log_file = "monitor_log.txt"

def factory_log(print_logs: bool = False) -> Logger:
    def log(status: Literal["OK", "ERROR"], message: str, response_time: Optional[float]=None):
        current_datetime = time.strftime("%Y-%m-%d %H:%M:%S")
        msg = f"{current_datetime},{status},{response_time},{message}"
        with open(log_file, "a") as f:
            f.write(msg + "\n")

        if print_logs:
            print(msg)

    return log


def check_URLs(URLs, log: Logger):
    for url in URLs:
        check_URL(url, log)


def check_URL(URL, log: Logger):
    try:
        response = requests.get(URL, timeout=5)
        if response.status_code == 200:
            log("OK", f"URL {URL} is up.", response.elapsed.total_seconds())
        else:
            log("ERROR", f"URL {URL} is down. Status code: {response.status_code}", response.elapsed.total_seconds())
    except requests.exceptions.RequestException as e:
        log("ERROR", f"URL {URL} is down. Error: {e}", None)


def check_every_N_minutes(N: int, log: Logger):

    while True:
        check_URLs(URLs_to_check, log)
        time.sleep(N * 60)


if __name__ == "__main__":
    check_every_N_minutes(1, factory_log(print_logs=True))
