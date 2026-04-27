import time
from typing import Literal, Optional

import requests

URLs_to_check = [
    "https://wikisim-server.wikisim.deno.net/1272v11/vite.svg",
]

log_file = "monitor_log.txt"

def log(status: Literal["OK", "ERROR"], message: str, response_time: Optional[float]=None):
    current_datetime = time.strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write(f"{current_datetime},{status},{response_time},{message}\n")


def check_URLs(URLs):
    for url in URLs:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                log("OK", f"URL {url} is up.", response_time=response.elapsed.total_seconds())
            else:
                log("ERROR", f"URL {url} is down. Status code: {response.status_code}", response_time=response.elapsed.total_seconds())
        except requests.exceptions.RequestException as e:
            log("ERROR", f"URL {url} is down. Error: {e}")


def check_every_N_minutes(N: int):

    while True:
        check_URLs(URLs_to_check)
        time.sleep(N * 60)


if __name__ == "__main__":
    check_every_N_minutes(1)
