
# Monitor Uptime

This was made due to a user reporting the [deno server timing out](https://github.com/wikisim/wikisim-server/issues/3)
whilst trying to serve an interactable.

The monitor.py script will:
* check the different URLs (deno server and supabase)
* log the results to an s3 bucket e.g. https://s3.eu-west-2.amazonaws.com/status.wikisim.org/data/2026-05-02.json

The index.html file will read the log files from the s3 bucket it is hosted in
and display the results.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python monitor.py
```


## Deployment

### AWS

### Monitoring Script

1. Get the AWS credentials from the AWS console and set as the environment variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for the `wikisim-status-monitor-script` user (stored in ~/.aws/credentials.wikisim_server_monitor_script).
2. Follow the instructions in the monitor.py file
