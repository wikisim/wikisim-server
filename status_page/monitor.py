import time
from typing import Literal, Optional, Callable
from dataclasses import dataclass

import requests


@dataclass
class Url:
    url: str
    headers: Optional[dict] = None

URLs_to_check: list[Url] = [
    Url("https://wikisim-server.wikisim.deno.net/1272v11/vite.svg"),
    Url("https://sfkgqscbwofiphfxhnxg.supabase.co/rest/v1/data_components?select=id&id=eq.1272", headers={"apikey": "sb_publishable_XWsGRSpmju8qjodw4gIU8A_O_mHUR1H"}),
]
# A high availability URL to ping for testing
HIGH_AVAILABILITY_URL = Url("https://www.google.com/favicon.ico")

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


def check_URLs(URLs: list[Url], log: Logger):
    for url in URLs:
        check_URL(url, log)


def check_URL(URL: Url, log: Logger, check_high_availability=True):
    success = False

    try:
        # print(f"Checking URL: {URL.url}")
        response = requests.get(URL.url, timeout=5, headers=URL.headers)
        # print(f"Got response from URL: {URL.url}")
        if response.status_code == 200:
            log("OK", f"URL {URL.url} is up.", response.elapsed.total_seconds())
            success = True
        else:
            log("ERROR", f"URL {URL.url} is down. Status code: {response.status_code}. Content: {response.content}", response.elapsed.total_seconds())
    except requests.exceptions.RequestException as e:
        log("ERROR", f"URL {URL.url} is down. Error: {e}", None)

    # Check high availability URL to determine if the issue is with the URL or the network
    if not success and check_high_availability:
        check_URL(HIGH_AVAILABILITY_URL, log, check_high_availability=False)


def check_every_N_minutes(N: int, log: Logger):

    while True:
        check_URLs(URLs_to_check, log)
        time.sleep(N * 60)


if __name__ == "__main__":
    check_every_N_minutes(1, factory_log(print_logs=True))
