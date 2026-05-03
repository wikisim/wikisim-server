"""
To update this file on the raspberry pi:
1. run:
sudo vi /usr/local/bin/monitor_wikisim.py
2. copy this whole file
3. ggdGi
4. paste the file content
5. press esc and type :wq to save and exit
6. sudo systemctl restart monitor_wikisim.service
"""

# sudo vi /etc/systemd/system/monitor_wikisim.service
"""
[Unit]
Description=Monitor Wikisim

[Service]
Type=simple
ExecStart=/usr/bin/python3 /usr/local/bin/monitor_wikisim.py
TimeoutStartSec=60

[Install]
WantedBy=multi-user.target
"""
# Then:
# sudo systemctl daemon-reload
# sudo systemctl enable --now monitor_wikisim.service
# sudo journalctl -u monitor_wikisim.service -f



import json
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Literal, Optional

import boto3
import requests


directory_of_this_file = os.path.dirname(os.path.abspath(__file__))


S3_BUCKET_NAME = "status.wikisim.org"
S3_BUCKET_URL = "https://s3.eu-west-2.amazonaws.com/status.wikisim.org/data/"
MAYBE_AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
MAYBE_AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

if (not MAYBE_AWS_ACCESS_KEY_ID) or (not MAYBE_AWS_SECRET_ACCESS_KEY):
    raise Exception("Warning: AWS credentials not found in environment variables. S3 logging will fail.")

AWS_ACCESS_KEY_ID = MAYBE_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = MAYBE_AWS_SECRET_ACCESS_KEY
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="eu-west-2"
)


def utcnow():
    return datetime.now(timezone.utc)

def utcnow_date_str():
    return utcnow().strftime("%Y-%m-%d")


@dataclass
class Url:
    name: str
    url: str
    headers: Optional[dict] = None

URLs_to_check: list[Url] = [
    Url("interactables_server_deno", "https://wikisim-server.wikisim.deno.net/1272v11/vite.svg"),
    Url("supabase", "https://sfkgqscbwofiphfxhnxg.supabase.co/rest/v1/data_components?select=id&id=eq.1272", headers={"apikey": "sb_publishable_XWsGRSpmju8qjodw4gIU8A_O_mHUR1H"}),
]
# A high availability URL to ping for testing
HIGH_AVAILABILITY_URL = Url("high_availability", "https://www.google.com/favicon.ico")


@dataclass
class UrlCheckResult:
    url: str = ""
    status: Literal["OK", "ERROR", "UNKNOWN"] = "ERROR"
    response_time_ms: Optional[float] = None
    error_type: Optional[Literal["timeout", "connection_refused", "other"]] = None
    message: str = ""

@dataclass
class UrlCheckResults:
    datetime: datetime
    interactables_server_deno: UrlCheckResult
    supabase: UrlCheckResult


def check_URLs(URLs: list[Url]):
    print(f"Checking URLs at {utcnow().strftime("%Y-%m-%d %H:%M:%S")}", flush=True)
    result = UrlCheckResults(
        datetime=utcnow(),
        interactables_server_deno=UrlCheckResult(),
        supabase=UrlCheckResult()
    )
    for url in URLs:
        check_URL(url, result.interactables_server_deno if url.name == "interactables_server_deno" else result.supabase)

    return result



def check_URL(URL: Url, result: UrlCheckResult, check_high_availability=True):
    try:
        # print(f"Checking URL: {URL.url}", flush=True)
        response = requests.get(URL.url, timeout=5, headers=URL.headers)
        # print(f"Got response from URL: {URL.url}", flush=True)
        result.response_time_ms = round(response.elapsed.total_seconds() * 1000)
        if response.status_code == 200:
            result.status = "OK"
            result.message = f"URL {URL.url} is up."
        else:
            result.message = f"URL {URL.url} is down. Status code: {response.status_code}. Content: {response.content}"
            result.error_type = get_error_type(result.message)
            print(f"Error checking URL {URL.url}: {result.message}", flush=True)

    except requests.exceptions.RequestException as e:
        result.message = f"URL {URL.url} is down. Error: {e}"
        result.error_type = get_error_type(result.message)
        print(f"Error checking URL {URL.url}: {result.message}", flush=True)


    # Check high availability URL to determine if the issue is with the URL or the network
    if result.status == "ERROR" and check_high_availability:
        high_availabilty_result = check_URL(HIGH_AVAILABILITY_URL, UrlCheckResult(), check_high_availability=False)
        if high_availabilty_result.status == "OK":
            result.message += " Network is up, so the issue is likely with the URL."
        else:
            result.message += " Network is down, so will report the URL as UNKNOWN instead of ERROR."
            result.status = "UNKNOWN"

    return result


def get_error_type(message: str) -> Literal["timeout", "connection_refused", "other"]:
    if "connection refused" in message.lower():
        return "connection_refused"
    elif "timeout" in message.lower():
        return "timeout"
    else:
        return "other"


def check_every_N_minutes(N: int):
    while True:
        result = check_URLs(URLs_to_check)
        log_result(result)
        time.sleep(N * 60)


log_data = []
def log_result(result: UrlCheckResults):
    print(f"Logging result: {result}", flush=True)
    global log_data
    get_latest_log_file_from_s3()
    append_result_to_log(result)
    upload_log_file_to_s3()


def get_latest_log_file_from_s3():
    global log_data
    current_date = utcnow_date_str()
    if log_data:
        if log_data[0]["datetime"] and log_data[0]["datetime"].startswith(current_date):
            print(f"Using cached log data for {current_date}", flush=True)
            return

    log_file_name = f"{current_date}.json"
    # Get the latest log file from S3 if not already downloaded
    s3_url = S3_BUCKET_URL + log_file_name
    try:
        response = requests.get(s3_url, timeout=5)
        if response.status_code == 200:
            log_data = response.json()
            print(f"Downloaded existing log file from S3: {s3_url}", flush=True)
        else:
            log_data = []
            print(f"No existing log file found on S3 for today: {s3_url}. Will create a new one.", flush=True)
    except requests.exceptions.RequestException as e:
        log_data = []
        print(f"Error downloading log file from S3: {e}. Will create a new one.", flush=True)


def append_result_to_log(result: UrlCheckResults):
    global log_data
    log_entry = {
        "datetime": result.datetime.strftime("%Y-%m-%dT%H:%M:%S"),
        "interactables_server_deno": {
            "status": result.interactables_server_deno.status,
            "response_time_ms": result.interactables_server_deno.response_time_ms,
        },
        "supabase": {
            "status": result.supabase.status,
            "response_time_ms": result.supabase.response_time_ms,
        }
    }

    if result.interactables_server_deno.error_type:
        log_entry["interactables_server_deno"]["error_type"] = result.interactables_server_deno.error_type
    if result.supabase.error_type:
        log_entry["supabase"]["error_type"] = result.supabase.error_type

    log_data.append(log_entry)
    print(f"Appended new log entry. Total entries for today: {len(log_data)}", flush=True)


def upload_log_file_to_s3():
    global log_data
    current_date = utcnow_date_str()
    log_file_name = f"{current_date}.json"
    s3_key = f"data/{log_file_name}"

    # This ensures we only keep a months worth of backup files on disk.
    day_of_month = utcnow().strftime("%d")
    with open(directory_of_this_file + f"/backup_{day_of_month}.json", "w") as f:
        json.dump(log_data, f)

    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(log_data),
            ContentType="application/json"
        )
        print(f"Successfully uploaded log file to S3: {s3_key}", flush=True)
    except Exception as e:
        print(f"Error uploading log file to S3: {e}", flush=True)


if __name__ == "__main__":
    # Assess args to see if it should run once or in a loop every N minutes:
    run_mode = "once" if "once" in sys.argv else "loop"

    if run_mode == "once":
        print(f"WikiSim monitor running in one-time check mode.", flush=True)
        result = check_URLs(URLs_to_check)
        log_result(result)
    elif run_mode == "loop":
        print(f"WikiSim monitor running in loop. Call with option \"once\" to have it run once", flush=True)
        check_every_N_minutes(1)
else:
    print(f"WikiSim monitor not running, imported as a module __name__: {__name__}", flush=True)
