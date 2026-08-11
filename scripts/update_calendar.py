#!/usr/bin/env python3
"""Fetch a public iCalendar feed and generate static upcoming-event JSON."""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Any

from icalendar import Calendar
import recurring_ical_events

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "events.json"
MAX_EVENTS = int(os.environ.get("MAX_EVENTS", "8"))
LOOKAHEAD_DAYS = int(os.environ.get("LOOKAHEAD_DAYS", "365"))


def fetch_calendar(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "CatherineReidWebsiteCalendarSync/1.0"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def as_iso(value: date | datetime | None) -> tuple[str, bool]:
    if value is None:
        return "", False
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat(), False
    return value.isoformat(), True


def normalized_start(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def text(event: Any, key: str) -> str:
    value = event.get(key)
    return str(value).strip() if value is not None else ""


def main() -> int:
    url = os.environ.get("CALENDAR_ICS_URL", "").strip()
    if not url:
        print("CALENDAR_ICS_URL is not set; leaving events.json unchanged.", file=sys.stderr)
        return 2

    raw = fetch_calendar(url)
    calendar = Calendar.from_ical(raw)

    now = datetime.now(timezone.utc)
    end = now + timedelta(days=LOOKAHEAD_DAYS)
    occurrences = recurring_ical_events.of(calendar).between(now, end)

    items: list[dict[str, Any]] = []
    for event in occurrences:
        if str(event.get("STATUS", "")).upper() == "CANCELLED":
            continue

        dtstart = event.decoded("DTSTART", None)
        if dtstart is None:
            continue
        dtend = event.decoded("DTEND", None)

        start_iso, all_day = as_iso(dtstart)
        end_iso, _ = as_iso(dtend)
        item = {
            "title": text(event, "SUMMARY") or "Untitled event",
            "start": start_iso,
            "end": end_iso,
            "allDay": all_day,
            "location": text(event, "LOCATION"),
            "description": text(event, "DESCRIPTION"),
            "url": text(event, "URL"),
            "_sort": normalized_start(dtstart).isoformat(),
        }
        items.append(item)

    items.sort(key=lambda item: item["_sort"])
    items = items[:MAX_EVENTS]
    for item in items:
        item.pop("_sort", None)

    payload = {
        "generatedAt": now.isoformat(),
        "events": items,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} upcoming event(s) to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
