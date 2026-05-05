
function fetch_data(datetime)
{
    const date_str = datetime.toISOString().split("T")[0]
    return fetch("/data/" + date_str + ".json")
        .then(response => response.json())
        .catch(error => {
            console.error("Error fetching data for " + date_str, error)
            return []
        })
}

const is_localhost = window.location.hostname === "localhost"
const current_datetime = is_localhost
    // ? new Date("2026-05-02")  // for testing - has < 2 hours of data, so x-axis should use minute intervals
    ? new Date("2026-05-03")  // for testing - has > 2 hours of data, so x-axis should use hour intervals
    : new Date()
const days_ago = 7
const datetime_24h = new Date(current_datetime.getTime() - 1 * 24 * 60 * 60 * 1000)
const datetime_from = new Date(current_datetime.getTime() - days_ago * 24 * 60 * 60 * 1000)

// Fetch data from datetime_from to current_datetime
const data_promises = []
for (let i = 0; i <= days_ago; ++i)
{
    const datetime = new Date(datetime_from.getTime() + i * 24 * 60 * 60 * 1000)
    data_promises.push(fetch_data(datetime))
}

Promise.all(data_promises)
.then(data_arrays =>
{
    const data = data_arrays.reduce((acc, data_array) => [ ...acc, ...data_array ], [])

    function set_error_type(entry, error_type)
    {
        entry[error_type] = entry.error_type === error_type ? 1 : 0
    }

    function set_error_types(entry)
    {
        set_error_type(entry, "connection_refused")
        set_error_type(entry, "timeout")
        set_error_type(entry, "other")
    }

    // Convert datetime to Date object and convert any error_type into an integer
    data.forEach(entry => {
        if (!entry.datetime.includes("+00:00"))
        {
            entry.datetime += "+00:00"
        }

        entry.datetime = new Date(entry.datetime)
        set_error_types(entry.interactables_server_deno)
        set_error_types(entry.supabase)
    })
    data.sort((a, b) => a.datetime - b.datetime)

    const data_24h = data.filter(entry => entry.datetime >= datetime_24h)
    const data_7d = data.filter(entry => entry.datetime >= datetime_from)

    // For data_7d, bucket into 1 hour intervals
    const buckets = {}
    data_7d.forEach(entry => {
        const bucket_time = new Date(entry.datetime.getTime())
        bucket_time.setMinutes(0, 0, 0) // Round down to the nearest hour
        const bucket_key = bucket_time.toISOString()
        if (!buckets[bucket_key])                {
            buckets[bucket_key] = {
                datetime: bucket_time,
                interactables_server_deno: { response_times: [] },
                supabase: { response_times: [] },
            }
        }
        if (entry.interactables_server_deno.response_time_ms)
        {
            buckets[bucket_key].interactables_server_deno.response_times.push(entry.interactables_server_deno.response_time_ms)
        }
        if (entry.supabase.response_time_ms)
        {
            buckets[bucket_key].supabase.response_times.push(entry.supabase.response_time_ms)
        }
    })


    function calculate_avg_min_max(response_times)
    {
        response_times = response_times.filter(rt => rt !== null)
        if (response_times.length === 0)
        {
            return { avg: null, min: null, max: null }
        }
        const sum = response_times.reduce((a, b) => a + b, 0)
        const avg_response_time_ms = sum / response_times.length
        const min_response_time_ms = Math.min(...response_times)
        const max_response_time_ms = Math.max(...response_times)

        return {
            avg_response_time_ms,
            min_response_time_ms,
            max_response_time_ms,
        }
    }

    // For data_7d, use 1 hour interval buckets to get the average, min and max response time for each bucket
    const data_7d_buckets = Object.values(buckets).map(bucket => {

        return {
            datetime: bucket.datetime,
            interactables_server_deno: calculate_avg_min_max(bucket.interactables_server_deno.response_times),
            supabase: calculate_avg_min_max(bucket.supabase.response_times),
        }
    })

    // Sort data_7d_buckets by datetime
    data_7d_buckets.sort((a, b) => a.datetime - b.datetime)

    return { data_24h, data_7d: data_7d_buckets }
})
.then(({ data_24h, data_7d }) =>
{
    const interactables_context_2d_24h = document.getElementById("interactables_response_time_24h").getContext("2d")
    plot_24h(interactables_context_2d_24h, data_24h, "interactables_server_deno")

    const supabase_context_2d_24h = document.getElementById("supabase_response_time_24h").getContext("2d")
    plot_24h(supabase_context_2d_24h, data_24h, "supabase")


    const interactables_context_2d_7d = document.getElementById("interactables_response_time_7d").getContext("2d")
    plot_7d(interactables_context_2d_7d, data_7d, "interactables_server_deno")

    const supabase_context_2d_7d = document.getElementById("supabase_response_time_7d").getContext("2d")
    plot_7d(supabase_context_2d_7d, data_7d, "supabase")
})


function plot_24h(context_2d, data_24h, service_name)
{
    const response_times_24h = data_24h.map(entry => entry[service_name].response_time_ms)
    let max_response_time_24h = Math.max(...response_times_24h.filter(rt => rt !== null))
    // Round max_response_time_24h up to the nearest 1000
    max_response_time_24h = Math.ceil(max_response_time_24h / 1000) * 1000

    const min_datetime = data_24h[0]?.datetime
    const max_datetime = data_24h[data_24h.length - 1]?.datetime
    let datetime_range_hours = (max_datetime - min_datetime) / (1000 * 60 * 60)
    datetime_range_hours = Number.isNaN(datetime_range_hours) ? 0 : datetime_range_hours

    // Set some min_datetime_hour and max_datetime_hour that are rounded to the
    // nearest hour, so that the x-axis labels look nice
    const min_datetime_hour = new Date(min_datetime.getTime())
    min_datetime_hour.setMinutes(0, 0, 0)
    const max_datetime_hour = new Date(max_datetime.getTime())
    max_datetime_hour.setMinutes(0, 0, 0)
    if (max_datetime_hour < max_datetime)
    {
        max_datetime_hour.setHours(max_datetime_hour.getHours() + 1)
    }

    const format_datetime = (d) => d.toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
    })
    const x_title = data_24h.length > 0
        ? `${format_datetime(data_24h[0].datetime)} - ${format_datetime(data_24h[data_24h.length - 1].datetime)}`
        : ""

    new Chart(context_2d, {
        type: "line",
        data: {
            labels: data_24h.map(entry => entry.datetime),
            datasets: [
                {
                    label: "Response Time (ms)",
                    data: response_times_24h,
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: "Connection Refused",
                    data: data_24h.map(entry => entry[service_name].connection_refused * max_response_time_24h),
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                    // type: "bar",
                },
                {
                    label: "Timeout",
                    data: data_24h.map(entry => entry[service_name].timeout * max_response_time_24h),
                    borderColor: "rgba(255, 159, 64, 1)",
                    borderWidth: 1,
                    // type: "bar",
                },
                {
                    label: "Other Errors",
                    data: data_24h.map(entry => entry[service_name].other * max_response_time_24h),
                    borderColor: "rgba(153, 102, 255, 1)",
                    borderWidth: 1,
                    // type: "bar",
                },
            ]
        },
        options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: datetime_range_hours < 2 ? "minute" : "hour",
                        displayFormats: {
                            hour: "HH:mm",
                            minute: "HH:mm",
                        },
                    },
                    min: min_datetime_hour,
                    max: max_datetime_hour,
                    ticks: {
                        maxTicksLimit: 13,
                    },
                    title: {
                        display: true,
                        text: x_title,
                    }
                },
                y: {
                    beginAtZero: true,
                }
            },
            // barPercentage increases width of error bars so that they
            // touch and form a continuous block:
            barPercentage: 3.0,
        }
    })
}


function plot_7d(context_2d, data_7d, service_name)
{
    const avg_response_times = data_7d.map(entry => entry[service_name].avg_response_time_ms)
    const min_response_times = data_7d.map(entry => entry[service_name].min_response_time_ms)
    const max_response_times = data_7d.map(entry => entry[service_name].max_response_time_ms)

    new Chart(context_2d, {
        type: "line",
        data: {
            labels: data_7d.map(entry => entry.datetime),
            datasets: [
                {
                    label: "Average Response Time (ms)",
                    data: avg_response_times,
                    borderColor: "rgba(153, 102, 255, 1)",
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: "Min Response Time (ms)",
                    data: min_response_times,
                    borderColor: "rgba(255, 159, 64, 1)",
                    borderWidth: 1,
                    fill: false
                },
                {
                    label: "Max Response Time (ms)",
                    data: max_response_times,
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                    fill: false
                },
            ]
        },
        options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "day",
                        displayFormats: {
                            day: "EEE d MMM"
                        }
                    },
                    ticks: {
                        maxTicksLimit: 8,
                    }
                }
            }
        }
    })
}
