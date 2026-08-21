#!/usr/bin/env python3
"""Resume the full collector across clean GitHub rate-limit checkpoints."""

from __future__ import annotations

import argparse
import sqlite3
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--collector", type=Path, default=SCRIPT_DIR / "full_collect.py"
    )
    parser.add_argument(
        "--db", type=Path, default=SCRIPT_DIR / "full_reviews.sqlite"
    )
    parser.add_argument("--batch-size", type=int, default=20)
    parser.add_argument("--graphql-threshold", type=int, default=150)
    parser.add_argument("--rest-threshold", type=int, default=150)
    parser.add_argument(
        "--reset-grace-seconds",
        type=float,
        default=5.0,
        help="extra delay after GitHub's recorded reset",
    )
    parser.add_argument(
        "--max-cycles",
        type=int,
        help="optional cap for a bounded scheduler smoke test",
    )
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def meta(db: Path, key: str) -> str | None:
    if not db.exists():
        return None
    connection = sqlite3.connect(f"file:{db.resolve()}?mode=ro", uri=True)
    try:
        row = connection.execute(
            "SELECT value FROM meta WHERE key = ?", (key,)
        ).fetchone()
        return row[0] if row else None
    finally:
        connection.close()


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError(f"reset timestamp lacks a timezone: {value}")
    return parsed.astimezone(timezone.utc)


def command(args: argparse.Namespace) -> list[str]:
    return [
        sys.executable,
        str(args.collector.resolve()),
        "--db",
        str(args.db.resolve()),
        "--batch-size",
        str(args.batch_size),
        "--graphql-threshold",
        str(args.graphql_threshold),
        "--rest-threshold",
        str(args.rest_threshold),
    ]


def wait_for_reset(db: Path, grace: float) -> None:
    reset_value = meta(db, "rate_limit_reset_at")
    if not reset_value:
        raise RuntimeError("collector exited 75 without recording rate_limit_reset_at")
    target = parse_timestamp(reset_value).timestamp() + grace
    while True:
        remaining = target - time.time()
        if remaining <= 0:
            return
        delay = min(remaining, 60.0)
        print(
            f"rate-limit checkpoint; resuming in {remaining:.0f}s "
            f"(reset {reset_value})",
            flush=True,
        )
        time.sleep(delay)


def main() -> int:
    args = parse_args()
    if not 1 <= args.batch_size <= 20:
        raise SystemExit("--batch-size must be between 1 and 20")
    if args.graphql_threshold < 0 or args.rest_threshold < 0:
        raise SystemExit("rate-limit thresholds must be nonnegative")
    if args.reset_grace_seconds < 0:
        raise SystemExit("--reset-grace-seconds must be nonnegative")
    if args.max_cycles is not None and args.max_cycles < 1:
        raise SystemExit("--max-cycles must be positive")

    collector_command = command(args)
    if args.dry_run:
        print(" ".join(collector_command))
        return 0

    cycle = 0
    while args.max_cycles is None or cycle < args.max_cycles:
        cycle += 1
        print(f"starting collection cycle {cycle}", flush=True)
        result = subprocess.run(collector_command, check=False)
        if result.returncode == 0:
            print("full collection completed", flush=True)
            return 0
        if result.returncode != 75:
            print(
                f"collector failed with exit status {result.returncode}; not retrying",
                file=sys.stderr,
            )
            return result.returncode
        if args.max_cycles is not None and cycle >= args.max_cycles:
            print("cycle limit reached at a clean checkpoint", flush=True)
            return 75
        wait_for_reset(args.db, args.reset_grace_seconds)

    return 75


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("scheduler interrupted; collector checkpoints remain resumable", file=sys.stderr)
        raise SystemExit(130)
