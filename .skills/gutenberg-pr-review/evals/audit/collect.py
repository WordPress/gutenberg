#!/usr/bin/env python3
"""Collect a resumable pilot corpus of merged Gutenberg PR reviews."""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


QUERY = r"""
query CollectPullRequests($first: Int!, $after: String) {
  repository(owner: "WordPress", name: "gutenberg") {
    pullRequests(
      first: $first
      after: $after
      states: MERGED
      orderBy: { field: CREATED_AT, direction: DESC }
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        url
        title
        bodyText
        createdAt
        updatedAt
        mergedAt
        authorAssociation
        author { login __typename }
        labels(first: 50) { nodes { name } }
        files(first: 100) {
          totalCount
          nodes { path }
        }
        reviews(first: 100) {
          totalCount
          nodes {
            id
            databaseId
            url
            state
            bodyText
            submittedAt
            authorAssociation
            author { login __typename }
            comments(first: 100) {
              totalCount
              nodes {
                id
                databaseId
                url
                bodyText
                createdAt
                updatedAt
                path
                line
                originalLine
                outdated
                authorAssociation
                author { login __typename }
              }
            }
          }
        }
        comments(first: 100) {
          totalCount
          nodes {
            id
            databaseId
            url
            bodyText
            createdAt
            updatedAt
            authorAssociation
            author { login __typename }
          }
        }
      }
    }
  }
  rateLimit { cost remaining resetAt }
}
"""


SCHEMA = """
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pull_requests (
    number INTEGER PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author TEXT,
    author_association TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    merged_at TEXT NOT NULL,
    labels_json TEXT NOT NULL,
    files_total INTEGER NOT NULL,
    reviews_total INTEGER NOT NULL,
    issue_comments_total INTEGER NOT NULL,
    raw_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS files (
    pr_number INTEGER NOT NULL,
    path TEXT NOT NULL,
    PRIMARY KEY (pr_number, path),
    FOREIGN KEY (pr_number) REFERENCES pull_requests(number) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    database_id INTEGER,
    pr_number INTEGER NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('review', 'review_comment', 'issue_comment')),
    parent_review_id TEXT,
    url TEXT,
    body TEXT NOT NULL,
    state TEXT,
    path TEXT,
    line INTEGER,
    original_line INTEGER,
    outdated INTEGER,
    author TEXT,
    author_association TEXT,
    is_bot INTEGER NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    comments_total INTEGER,
    FOREIGN KEY (pr_number) REFERENCES pull_requests(number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS artifacts_pr_number ON artifacts(pr_number);
CREATE INDEX IF NOT EXISTS artifacts_kind ON artifacts(kind);
CREATE INDEX IF NOT EXISTS artifacts_author ON artifacts(author);
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=500)
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument(
        "--db",
        type=Path,
        default=Path(__file__).with_name("reviews.sqlite"),
    )
    return parser.parse_args()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def author_fields(author: dict[str, Any] | None) -> tuple[str | None, int]:
    if not author:
        return None, 0
    login = author.get("login")
    typename = author.get("__typename")
    is_bot = typename == "Bot" or bool(login and login.lower().endswith("[bot]"))
    return login, int(is_bot)


def gh_graphql(first: int, after: str | None) -> dict[str, Any]:
    command = [
        "gh",
        "api",
        "graphql",
        "-f",
        f"query={QUERY}",
        "-F",
        f"first={first}",
    ]
    if after:
        command.extend(["-F", f"after={after}"])
    result = subprocess.run(command, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or "gh api graphql failed")
    payload = json.loads(result.stdout)
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload


def gh_rest_pages(endpoint: str) -> list[dict[str, Any]]:
    result = subprocess.run(
        ["gh", "api", "--paginate", "--slurp", endpoint],
        text=True,
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"gh api failed for {endpoint}")
    pages = json.loads(result.stdout)
    return [item for page in pages for item in page]


def gh_rate_limit() -> dict[str, Any]:
    result = subprocess.run(
        [
            "gh",
            "api",
            "graphql",
            "-f",
            "query=query { rateLimit { cost remaining resetAt } }",
        ],
        text=True,
        capture_output=True,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or "failed to query GraphQL rate limit")
    return json.loads(result.stdout)["data"]["rateLimit"]


def get_meta(conn: sqlite3.Connection, key: str) -> str | None:
    row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None


def set_meta(conn: sqlite3.Connection, key: str, value: Any) -> None:
    conn.execute(
        "INSERT INTO meta(key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, str(value)),
    )


def insert_artifact(
    conn: sqlite3.Connection,
    *,
    artifact: dict[str, Any],
    pr_number: int,
    kind: str,
    parent_review_id: str | None = None,
    state: str | None = None,
    comments_total: int | None = None,
) -> None:
    author, is_bot = author_fields(artifact.get("author"))
    conn.execute(
        """
        INSERT OR REPLACE INTO artifacts(
            id, database_id, pr_number, kind, parent_review_id, url, body, state,
            path, line, original_line, outdated, author, author_association,
            is_bot, created_at, updated_at, comments_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            artifact["id"],
            artifact.get("databaseId"),
            pr_number,
            kind,
            parent_review_id,
            artifact.get("url"),
            artifact.get("bodyText") or "",
            state,
            artifact.get("path"),
            artifact.get("line"),
            artifact.get("originalLine"),
            int(artifact["outdated"]) if artifact.get("outdated") is not None else None,
            author,
            artifact.get("authorAssociation"),
            is_bot,
            artifact.get("submittedAt") or artifact.get("createdAt"),
            artifact.get("updatedAt"),
            comments_total,
        ),
    )


def insert_pr(conn: sqlite3.Connection, pr: dict[str, Any]) -> None:
    number = pr["number"]
    author, _ = author_fields(pr.get("author"))
    conn.execute(
        """
        INSERT OR REPLACE INTO pull_requests(
            number, url, title, body, author, author_association, created_at,
            updated_at, merged_at, labels_json, files_total, reviews_total,
            issue_comments_total, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            number,
            pr["url"],
            pr["title"],
            pr.get("bodyText") or "",
            author,
            pr.get("authorAssociation"),
            pr["createdAt"],
            pr["updatedAt"],
            pr["mergedAt"],
            json.dumps([node["name"] for node in pr["labels"]["nodes"]]),
            pr["files"]["totalCount"],
            pr["reviews"]["totalCount"],
            pr["comments"]["totalCount"],
            json.dumps(pr, separators=(",", ":")),
        ),
    )
    conn.execute("DELETE FROM files WHERE pr_number = ?", (number,))
    conn.executemany(
        "INSERT OR IGNORE INTO files(pr_number, path) VALUES (?, ?)",
        [(number, node["path"]) for node in pr["files"]["nodes"]],
    )
    conn.execute("DELETE FROM artifacts WHERE pr_number = ?", (number,))
    for review in pr["reviews"]["nodes"]:
        insert_artifact(
            conn,
            artifact=review,
            pr_number=number,
            kind="review",
            state=review["state"],
            comments_total=review["comments"]["totalCount"],
        )
        for comment in review["comments"]["nodes"]:
            insert_artifact(
                conn,
                artifact=comment,
                pr_number=number,
                kind="review_comment",
                parent_review_id=review["id"],
                state=review["state"],
            )
    for comment in pr["comments"]["nodes"]:
        insert_artifact(
            conn,
            artifact=comment,
            pr_number=number,
            kind="issue_comment",
        )


def backfill_files(conn: sqlite3.Connection) -> int:
    rows = conn.execute(
        """
        SELECT p.number, p.files_total, COUNT(f.path) AS files_collected
        FROM pull_requests p
        LEFT JOIN files f ON f.pr_number = p.number
        GROUP BY p.number
        HAVING files_collected < p.files_total
        ORDER BY p.number DESC
        """
    ).fetchall()
    for number, expected, _ in rows:
        files = gh_rest_pages(
            f"repos/WordPress/gutenberg/pulls/{number}/files?per_page=100"
        )
        with conn:
            conn.execute("DELETE FROM files WHERE pr_number = ?", (number,))
            conn.executemany(
                "INSERT INTO files(pr_number, path) VALUES (?, ?)",
                [(number, item["filename"]) for item in files],
            )
        if len(files) != expected:
            raise RuntimeError(
                f"PR #{number}: expected {expected} files but collected {len(files)}"
            )
        print(f"backfilled files for PR #{number}: {len(files)}", flush=True)
    return len(rows)


def write_manifest(db_path: Path, conn: sqlite3.Connection, rate: dict[str, Any]) -> None:
    if not rate:
        stored_rate = get_meta(conn, "last_rate_limit")
        rate = json.loads(stored_rate) if stored_rate else {}
    counts = conn.execute(
        """
        SELECT
          (SELECT COUNT(*) FROM pull_requests),
          (SELECT COUNT(*) FROM artifacts),
          (SELECT COUNT(*) FROM artifacts WHERE kind = 'review'),
          (SELECT COUNT(*) FROM artifacts WHERE kind = 'review_comment'),
          (SELECT COUNT(*) FROM artifacts WHERE kind = 'issue_comment'),
          (SELECT COUNT(*) FROM artifacts WHERE is_bot = 0 AND TRIM(body) != '')
        """
    ).fetchone()
    truncation = conn.execute(
        """
        SELECT
          COALESCE(SUM(
            (SELECT COUNT(*) FROM files f WHERE f.pr_number = p.number) < p.files_total
          ), 0),
          COALESCE(SUM(
            (SELECT COUNT(*) FROM artifacts a
             WHERE a.pr_number = p.number AND a.kind = 'review') < p.reviews_total
          ), 0),
          COALESCE(SUM(
            (SELECT COUNT(*) FROM artifacts a
             WHERE a.pr_number = p.number AND a.kind = 'issue_comment') < p.issue_comments_total
          ), 0),
          COALESCE((
            SELECT SUM(
              (SELECT COUNT(*) FROM artifacts child
               WHERE child.parent_review_id = review.id
                 AND child.kind = 'review_comment') < review.comments_total
            )
            FROM artifacts review
            WHERE review.kind = 'review'
          ), 0)
        FROM pull_requests p
        """
    ).fetchone()
    manifest = {
        "updated_at": utc_now(),
        "scope": "merged PRs ordered by creation time descending",
        "target_limit": int(get_meta(conn, "target_limit") or 0),
        "pull_requests": counts[0],
        "artifacts": {
            "total": counts[1],
            "reviews": counts[2],
            "review_comments": counts[3],
            "issue_comments": counts[4],
            "nonempty_human": counts[5],
        },
        "possibly_truncated_connections": {
            "files": truncation[0],
            "reviews": truncation[1],
            "issue_comments": truncation[2],
            "review_comments": truncation[3],
        },
        "rate_limit": rate,
        "cursor": get_meta(conn, "cursor"),
        "has_next_page": get_meta(conn, "has_next_page") == "True",
    }
    destination = db_path.with_name("manifest.json")
    with tempfile.NamedTemporaryFile(
        "w", dir=destination.parent, delete=False, encoding="utf-8"
    ) as handle:
        json.dump(manifest, handle, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    os.replace(temporary, destination)


def main() -> int:
    args = parse_args()
    if args.limit <= 0 or not 1 <= args.batch_size <= 20:
        raise SystemExit("limit must be positive; batch size must be between 1 and 20")
    args.db.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.executescript(SCHEMA)
    existing_target = get_meta(conn, "target_limit")
    if existing_target and int(existing_target) != args.limit:
        raise SystemExit(
            f"database target is {existing_target}; use a fresh database for {args.limit}"
        )
    set_meta(conn, "target_limit", args.limit)
    if not get_meta(conn, "started_at"):
        set_meta(conn, "started_at", utc_now())
        set_meta(conn, "ordering", "CREATED_AT_DESC")
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0]
    cursor = get_meta(conn, "cursor")
    last_rate: dict[str, Any] = {}
    while count < args.limit:
        first = min(args.batch_size, args.limit - count)
        payload = gh_graphql(first, cursor)
        connection = payload["data"]["repository"]["pullRequests"]
        nodes = connection["nodes"]
        if not nodes:
            raise RuntimeError("GitHub returned no PRs before the target was reached")
        with conn:
            for pr in nodes:
                insert_pr(conn, pr)
            cursor = connection["pageInfo"]["endCursor"]
            set_meta(conn, "cursor", cursor)
            set_meta(conn, "has_next_page", connection["pageInfo"]["hasNextPage"])
            set_meta(conn, "updated_at", utc_now())
        count = conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0]
        last_rate = payload["data"]["rateLimit"]
        with conn:
            set_meta(conn, "last_rate_limit", json.dumps(last_rate))
        write_manifest(args.db, conn, last_rate)
        print(
            f"collected={count}/{args.limit} cost={last_rate['cost']} "
            f"remaining={last_rate['remaining']}",
            flush=True,
        )
        if not connection["pageInfo"]["hasNextPage"] and count < args.limit:
            raise RuntimeError("connection ended before the target was reached")

    backfill_files(conn)
    if not last_rate:
        stored_rate = get_meta(conn, "last_rate_limit")
        last_rate = json.loads(stored_rate) if stored_rate else gh_rate_limit()
        with conn:
            set_meta(conn, "last_rate_limit", json.dumps(last_rate))
    with conn:
        set_meta(conn, "completed_at", utc_now())
    write_manifest(args.db, conn, last_rate)
    print(f"complete: {args.db}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("interrupted; progress has been checkpointed", file=sys.stderr)
        sys.exit(130)
