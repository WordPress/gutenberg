#!/usr/bin/env python3
"""Collect a resumable, all-state Gutenberg pull-request review corpus.

The primary PR connection is deliberately ordered oldest-first and includes every
state.  A fixed ``audit_started_at`` timestamp makes the moving tail deterministic:
PRs created after that timestamp are never inserted.  Connections nested under a
PR are fetched inline up to GitHub's maximum page size and are repaired through
paginated REST endpoints whenever they overflow.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from typing import Any


OWNER = "WordPress"
REPOSITORY = "gutenberg"
SCHEMA_VERSION = "1"
MAX_GITHUB_ATTEMPTS = 6
MAX_RETRY_DELAY_SECONDS = 60.0

TRANSIENT_GITHUB_FAILURES = (
    re.compile(r"\bHTTP\s+(?:429|502|503|504)\b", re.IGNORECASE),
    re.compile(r"\bconnection (?:reset|refused|aborted)\b", re.IGNORECASE),
    re.compile(r"\b(?:request |i/o |read |write )?timed? ?out\b", re.IGNORECASE),
    re.compile(r"\bTLS handshake timeout\b", re.IGNORECASE),
    re.compile(r"\bdeadline exceeded\b", re.IGNORECASE),
    re.compile(r"\btemporary failure\b", re.IGNORECASE),
    re.compile(r"\bserver closed (?:the )?(?:idle )?connection\b", re.IGNORECASE),
    re.compile(r"\bstream error\b", re.IGNORECASE),
    re.compile(r"\bunexpected EOF\b", re.IGNORECASE),
    re.compile(r"\bunexpected end of JSON input\b", re.IGNORECASE),
    re.compile(r"\binvalid JSON response\b", re.IGNORECASE),
    re.compile(r"\berror connecting to\b", re.IGNORECASE),
    re.compile(r"\bcheck your internet connection\b", re.IGNORECASE),
    re.compile(r"\bcould not resolve host\b", re.IGNORECASE),
    re.compile(r"\bnetwork is unreachable\b", re.IGNORECASE),
    re.compile(r"\bno route to host\b", re.IGNORECASE),
)

QUERY = r"""
query CollectPullRequests($first: Int!, $after: String) {
  repository(owner: "WordPress", name: "gutenberg") {
    pullRequests(
      first: $first
      after: $after
      states: [OPEN, MERGED, CLOSED]
      orderBy: { field: CREATED_AT, direction: ASC }
    ) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        url
        title
        bodyText
        state
        isDraft
        createdAt
        updatedAt
        mergedAt
        closedAt
        authorAssociation
        author { login __typename }
        labels(first: 100) { totalCount nodes { name } }
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

BOOTSTRAP_QUERY = r"""
query BootstrapPullRequestSnapshot {
  repository(owner: "WordPress", name: "gutenberg") {
    population: pullRequests(states: [OPEN, MERGED, CLOSED]) {
      totalCount
    }
    newest: pullRequests(
      last: 1
      states: [OPEN, MERGED, CLOSED]
      orderBy: { field: CREATED_AT, direction: ASC }
    ) {
      nodes { number createdAt }
    }
  }
  rateLimit { cost remaining resetAt }
}
"""

FILES_QUERY = r"""
query CollectPullRequestFiles($number: Int!, $after: String) {
  repository(owner: "WordPress", name: "gutenberg") {
    pullRequest(number: $number) {
      files(first: 100, after: $after) {
        totalCount
        nodes { path }
        pageInfo { hasNextPage endCursor }
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
    state TEXT NOT NULL CHECK (state IN ('OPEN', 'MERGED', 'CLOSED')),
    is_draft INTEGER NOT NULL,
    author TEXT,
    author_association TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    merged_at TEXT,
    closed_at TEXT,
    observed_at TEXT NOT NULL,
    labels_json TEXT NOT NULL,
    labels_total INTEGER NOT NULL,
    files_total INTEGER NOT NULL,
    reviews_total INTEGER NOT NULL,
    issue_comments_total INTEGER NOT NULL,
    review_comments_total INTEGER NOT NULL,
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
    observed_at TEXT NOT NULL,
    comments_total INTEGER,
    FOREIGN KEY (pr_number) REFERENCES pull_requests(number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pull_requests_state ON pull_requests(state);
CREATE INDEX IF NOT EXISTS artifacts_pr_number ON artifacts(pr_number);
CREATE INDEX IF NOT EXISTS artifacts_kind ON artifacts(kind);
CREATE INDEX IF NOT EXISTS artifacts_author ON artifacts(author);
"""


class RateLimitPause(RuntimeError):
    """A recoverable stop requested before consuming the remaining API budget."""

    def __init__(self, resource: str, remaining: int, reset_at: str) -> None:
        super().__init__(
            f"{resource} rate limit has {remaining} remaining; resets at {reset_at}"
        )
        self.resource = resource
        self.remaining = remaining
        self.reset_at = reset_at


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db",
        type=Path,
        default=Path(__file__).with_name("full_reviews.sqlite"),
        help="SQLite checkpoint database (default: full_reviews.sqlite)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="PR nodes per GraphQL page, 1-20 (default: 10)",
    )
    parser.add_argument(
        "--audit-started-at",
        help="fixed ISO-8601 cutoff for a new database (default: now, UTC)",
    )
    parser.add_argument(
        "--graphql-threshold",
        type=int,
        default=100,
        help="pause before a request at or below this remaining budget",
    )
    parser.add_argument(
        "--rest-threshold",
        type=int,
        default=100,
        help="pause before an overflow backfill at or below this core budget",
    )
    parser.add_argument(
        "--stop-after-pages",
        type=int,
        help="checkpoint and stop after N pages (for smoke/resume tests)",
    )
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="exercise schema and idempotent inserts without network access",
    )
    return parser.parse_args()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError(f"timestamp must include a timezone: {value}")
    return parsed.astimezone(timezone.utc)


def is_transient_github_failure(message: str) -> bool:
    return any(pattern.search(message) for pattern in TRANSIENT_GITHUB_FAILURES)


def retry_after_seconds(message: str, now: datetime | None = None) -> float | None:
    """Extract Retry-After seconds or an HTTP date when gh exposes the header."""

    match = re.search(
        r"(?:^|[\r\n])\s*retry-after\s*:\s*([^\r\n]+)",
        message,
        re.IGNORECASE,
    )
    if not match:
        return None
    value = match.group(1).strip()
    if value.isdigit():
        return float(value)
    try:
        retry_at = parsedate_to_datetime(value)
    except (TypeError, ValueError, OverflowError):
        return None
    if retry_at.tzinfo is None:
        retry_at = retry_at.replace(tzinfo=timezone.utc)
    current = now or datetime.now(timezone.utc)
    return max(0.0, (retry_at.astimezone(timezone.utc) - current).total_seconds())


def retry_delay(attempt: int, message: str) -> float:
    requested = retry_after_seconds(message)
    if requested is not None:
        return min(requested, MAX_RETRY_DELAY_SECONDS)
    return min(float(2 ** (attempt - 1)), MAX_RETRY_DELAY_SECONDS)


def run_gh(arguments: list[str], failure: str) -> Any:
    for attempt in range(1, MAX_GITHUB_ATTEMPTS + 1):
        result = subprocess.run(
            ["gh", "api", *arguments], text=True, capture_output=True
        )
        if not result.returncode:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError as error:
                message = f"invalid JSON response from GitHub: {error}"
        else:
            message = result.stderr.strip() or failure
        if (
            not is_transient_github_failure(message)
            or attempt == MAX_GITHUB_ATTEMPTS
        ):
            raise RuntimeError(message)

        delay = retry_delay(attempt, message)
        summary = message.splitlines()[-1][:240]
        print(
            f"transient GitHub API failure ({summary}); retrying in "
            f"{delay:g}s ({attempt + 1}/{MAX_GITHUB_ATTEMPTS})",
            file=sys.stderr,
            flush=True,
        )
        time.sleep(delay)

    raise AssertionError("unreachable")


def api_limits() -> dict[str, dict[str, Any]]:
    return run_gh(["rate_limit"], "failed to query API rate limits")["resources"]


def ensure_budget(resource: str, threshold: int) -> dict[str, Any]:
    rate = api_limits()[resource]
    if int(rate["remaining"]) <= threshold:
        reset_at = datetime.fromtimestamp(
            int(rate["reset"]), timezone.utc
        ).isoformat()
        raise RateLimitPause(resource, int(rate["remaining"]), reset_at)
    return rate


def gh_graphql(first: int, after: str | None) -> dict[str, Any]:
    arguments = ["graphql", "-f", f"query={QUERY}", "-F", f"first={first}"]
    if after:
        arguments.extend(["-F", f"after={after}"])
    payload = run_gh(arguments, "gh api graphql failed")
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload


def gh_bootstrap() -> dict[str, Any]:
    payload = run_gh(
        ["graphql", "-f", f"query={BOOTSTRAP_QUERY}"],
        "failed to establish the initial PR snapshot",
    )
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload


def gh_file_page(number: int, after: str | None) -> dict[str, Any]:
    arguments = [
        "graphql",
        "-f",
        f"query={FILES_QUERY}",
        "-F",
        f"number={number}",
    ]
    if after:
        arguments.extend(["-F", f"after={after}"])
    payload = run_gh(arguments, f"failed to paginate files for PR #{number}")
    if payload.get("errors"):
        raise RuntimeError(json.dumps(payload["errors"], indent=2))
    return payload


def gh_all_file_paths(
    number: int, expected: int, graphql_threshold: int
) -> list[str]:
    """Read a PR's complete file connection without REST's 3,000-file cap."""

    paths: list[str] = []
    after: str | None = None
    seen_cursors: set[str] = set()
    while True:
        ensure_budget("graphql", graphql_threshold)
        payload = gh_file_page(number, after)
        pull_request = payload["data"]["repository"]["pullRequest"]
        if pull_request is None:
            raise RuntimeError(f"PR #{number} disappeared while paginating files")
        connection = pull_request["files"]
        current_total = int(connection["totalCount"])
        if current_total != expected:
            raise RuntimeError(
                f"PR #{number}: file connection changed during collection "
                f"(snapshot expected {expected}, now {current_total}); restart with "
                "a fresh audit snapshot"
            )
        paths.extend(node["path"] for node in connection["nodes"])
        page_info = connection["pageInfo"]
        if not page_info["hasNextPage"]:
            break
        next_cursor = page_info["endCursor"]
        if not next_cursor or next_cursor == after or next_cursor in seen_cursors:
            raise RuntimeError(
                f"PR #{number}: repeated or missing cursor while paginating files"
            )
        seen_cursors.add(next_cursor)
        after = next_cursor

    if len(paths) != expected or len(set(paths)) != expected:
        raise RuntimeError(
            f"PR #{number}: expected {expected} distinct file paths, collected "
            f"{len(paths)} rows ({len(set(paths))} distinct)"
        )
    return paths


def gh_rest_pages(endpoint: str) -> list[dict[str, Any]]:
    pages = run_gh(
        ["--paginate", "--slurp", endpoint], f"gh api failed for {endpoint}"
    )
    return [item for page in pages for item in page]


def get_meta(conn: sqlite3.Connection, key: str) -> str | None:
    row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None


def set_meta(conn: sqlite3.Connection, key: str, value: Any) -> None:
    conn.execute(
        "INSERT INTO meta(key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, str(value)),
    )


def author_fields(author: dict[str, Any] | None) -> tuple[str | None, int]:
    if not author:
        return None, 0
    login = author.get("login")
    typename = author.get("__typename") or author.get("type")
    is_bot = typename == "Bot" or bool(login and login.lower().endswith("[bot]"))
    return login, int(is_bot)


def artifact_id(artifact: dict[str, Any], kind: str) -> str:
    # REST's numeric ``id`` values are only unique within an artifact type;
    # ``node_id`` shares GraphQL's globally unique namespace.
    value = artifact.get("node_id") or artifact.get("id")
    if value is not None:
        return str(value)
    database_id = artifact.get("databaseId") or artifact.get("database_id")
    if database_id is None:
        raise RuntimeError(f"{kind} has neither a node ID nor database ID")
    return f"{kind}:{database_id}"


def insert_artifact(
    conn: sqlite3.Connection,
    *,
    artifact: dict[str, Any],
    pr_number: int,
    kind: str,
    observed_at: str,
    parent_review_id: str | None = None,
    state: str | None = None,
    comments_total: int | None = None,
    rest: bool = False,
) -> None:
    author, is_bot = author_fields(artifact.get("user") if rest else artifact.get("author"))
    database_id = artifact.get("id") if rest else artifact.get("databaseId")
    body = artifact.get("body") if rest else artifact.get("bodyText")
    url = artifact.get("html_url") if rest else artifact.get("url")
    author_association = (
        artifact.get("author_association") if rest else artifact.get("authorAssociation")
    )
    created_at = (
        artifact.get("submitted_at") or artifact.get("created_at")
        if rest
        else artifact.get("submittedAt") or artifact.get("createdAt")
    )
    updated_at = artifact.get("updated_at") if rest else artifact.get("updatedAt")
    outdated = artifact.get("outdated")
    if rest and kind == "review_comment":
        outdated = artifact.get("position") is None
    conn.execute(
        """
        INSERT OR REPLACE INTO artifacts(
            id, database_id, pr_number, kind, parent_review_id, url, body, state,
            path, line, original_line, outdated, author, author_association,
            is_bot, created_at, updated_at, observed_at, comments_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            artifact_id(artifact, kind),
            database_id,
            pr_number,
            kind,
            parent_review_id,
            url,
            body or "",
            state,
            artifact.get("path"),
            artifact.get("line"),
            artifact.get("original_line") if rest else artifact.get("originalLine"),
            int(outdated) if outdated is not None else None,
            author,
            author_association,
            is_bot,
            created_at,
            updated_at,
            observed_at,
            comments_total,
        ),
    )


def insert_pr(
    conn: sqlite3.Connection, pr: dict[str, Any], observed_at: str
) -> None:
    number = int(pr["number"])
    author, _ = author_fields(pr.get("author"))
    review_comments_total = sum(
        int(review["comments"]["totalCount"]) for review in pr["reviews"]["nodes"]
    )
    conn.execute(
        """
        INSERT INTO pull_requests(
            number, url, title, body, state, is_draft, author,
            author_association, created_at, updated_at, merged_at, closed_at,
            observed_at, labels_json, labels_total, files_total, reviews_total,
            issue_comments_total, review_comments_total, raw_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(number) DO UPDATE SET
            url = excluded.url,
            title = excluded.title,
            body = excluded.body,
            state = excluded.state,
            is_draft = excluded.is_draft,
            author = excluded.author,
            author_association = excluded.author_association,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            merged_at = excluded.merged_at,
            closed_at = excluded.closed_at,
            observed_at = excluded.observed_at,
            labels_json = excluded.labels_json,
            labels_total = excluded.labels_total,
            files_total = excluded.files_total,
            reviews_total = excluded.reviews_total,
            issue_comments_total = excluded.issue_comments_total,
            review_comments_total = excluded.review_comments_total,
            raw_json = excluded.raw_json
        """,
        (
            number,
            pr["url"],
            pr["title"],
            pr.get("bodyText") or "",
            pr["state"],
            int(pr["isDraft"]),
            author,
            pr.get("authorAssociation"),
            pr["createdAt"],
            pr["updatedAt"],
            pr.get("mergedAt"),
            pr.get("closedAt"),
            observed_at,
            json.dumps([node["name"] for node in pr["labels"]["nodes"]]),
            int(pr["labels"]["totalCount"]),
            int(pr["files"]["totalCount"]),
            int(pr["reviews"]["totalCount"]),
            int(pr["comments"]["totalCount"]),
            review_comments_total,
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
            observed_at=observed_at,
            state=review["state"],
            comments_total=int(review["comments"]["totalCount"]),
        )
        for comment in review["comments"]["nodes"]:
            insert_artifact(
                conn,
                artifact=comment,
                pr_number=number,
                kind="review_comment",
                observed_at=observed_at,
                parent_review_id=review["id"],
                state=review["state"],
            )
    for comment in pr["comments"]["nodes"]:
        insert_artifact(
            conn,
            artifact=comment,
            pr_number=number,
            kind="issue_comment",
            observed_at=observed_at,
        )


def collected_counts(conn: sqlite3.Connection, number: int) -> dict[str, int]:
    row = conn.execute(
        """
        SELECT
          (SELECT COUNT(*) FROM files WHERE pr_number = ?),
          (SELECT COUNT(*) FROM artifacts WHERE pr_number = ? AND kind = 'review'),
          (SELECT COUNT(*) FROM artifacts WHERE pr_number = ? AND kind = 'issue_comment'),
          (SELECT COUNT(*) FROM artifacts WHERE pr_number = ? AND kind = 'review_comment')
        """,
        (number, number, number, number),
    ).fetchone()
    return dict(zip(("files", "reviews", "issue_comments", "review_comments"), row))


def expected_counts(conn: sqlite3.Connection, number: int) -> dict[str, int]:
    row = conn.execute(
        """
        SELECT files_total, reviews_total, issue_comments_total,
               review_comments_total
        FROM pull_requests WHERE number = ?
        """,
        (number,),
    ).fetchone()
    if not row:
        raise RuntimeError(f"missing pull request #{number}")
    return dict(zip(("files", "reviews", "issue_comments", "review_comments"), row))


def verify_count(number: int, kind: str, actual: int, expected: int) -> None:
    if actual != expected:
        raise RuntimeError(
            f"PR #{number}: {kind} connection changed during collection "
            f"(snapshot expected {expected}, paginated API returned {actual}); "
            "this can happen when an OPEN PR is edited during collection—restart "
            "with a fresh audit snapshot"
        )


def replace_review_comments(
    conn: sqlite3.Connection,
    number: int,
    comments: list[dict[str, Any]],
    observed_at: str,
) -> None:
    reviews = {
        row[0]: (row[1], row[2])
        for row in conn.execute(
            "SELECT database_id, id, state FROM artifacts "
            "WHERE pr_number = ? AND kind = 'review'",
            (number,),
        )
    }
    conn.execute(
        "DELETE FROM artifacts WHERE pr_number = ? AND kind = 'review_comment'",
        (number,),
    )
    for comment in comments:
        review_database_id = comment.get("pull_request_review_id")
        parent_id, state = reviews.get(review_database_id, (None, None))
        insert_artifact(
            conn,
            artifact=comment,
            pr_number=number,
            kind="review_comment",
            observed_at=observed_at,
            parent_review_id=parent_id,
            state=state,
            rest=True,
        )


def repair_pr_connections(
    conn: sqlite3.Connection,
    number: int,
    observed_at: str,
    graphql_threshold: int,
    rest_threshold: int,
) -> list[str]:
    """Fully paginate overflowed connections for one PR, returning repaired kinds."""

    expected = expected_counts(conn, number)
    actual = collected_counts(conn, number)
    repaired: list[str] = []

    if actual["files"] < expected["files"]:
        paths = gh_all_file_paths(
            number, expected["files"], graphql_threshold
        )
        conn.execute("DELETE FROM files WHERE pr_number = ?", (number,))
        conn.executemany(
            "INSERT INTO files(pr_number, path) VALUES (?, ?)",
            [(number, path) for path in paths],
        )
        repaired.append("files")

    reviews_replaced = actual["reviews"] < expected["reviews"]
    if reviews_replaced:
        ensure_budget("core", rest_threshold)
        reviews = gh_rest_pages(
            f"repos/{OWNER}/{REPOSITORY}/pulls/{number}/reviews?per_page=100"
        )
        reviews_observed_at = utc_now()
        verify_count(number, "reviews", len(reviews), expected["reviews"])
        conn.execute(
            "DELETE FROM artifacts WHERE pr_number = ? "
            "AND kind IN ('review', 'review_comment')",
            (number,),
        )
        for review in reviews:
            insert_artifact(
                conn,
                artifact=review,
                pr_number=number,
                kind="review",
                observed_at=reviews_observed_at,
                state=(review.get("state") or "").upper() or None,
                rest=True,
            )
        repaired.append("reviews")

    if reviews_replaced or actual["review_comments"] < expected["review_comments"]:
        ensure_budget("core", rest_threshold)
        backfill_observed_at = utc_now()
        comments = gh_rest_pages(
            f"repos/{OWNER}/{REPOSITORY}/pulls/{number}/comments?per_page=100"
        )
        if not reviews_replaced:
            verify_count(
                number, "review comments", len(comments), expected["review_comments"]
            )
        else:
            conn.execute(
                "UPDATE pull_requests SET review_comments_total = ? WHERE number = ?",
                (len(comments), number),
            )
        replace_review_comments(conn, number, comments, backfill_observed_at)
        repaired.append("review_comments")

    if actual["issue_comments"] < expected["issue_comments"]:
        ensure_budget("core", rest_threshold)
        backfill_observed_at = utc_now()
        comments = gh_rest_pages(
            f"repos/{OWNER}/{REPOSITORY}/issues/{number}/comments?per_page=100"
        )
        verify_count(number, "issue comments", len(comments), expected["issue_comments"])
        conn.execute(
            "DELETE FROM artifacts WHERE pr_number = ? AND kind = 'issue_comment'",
            (number,),
        )
        for comment in comments:
            insert_artifact(
                conn,
                artifact=comment,
                pr_number=number,
                kind="issue_comment",
                observed_at=backfill_observed_at,
                rest=True,
            )
        repaired.append("issue_comments")

    return repaired


def truncation_counts(conn: sqlite3.Connection) -> dict[str, int]:
    rows = conn.execute(
        """
        SELECT p.number, p.files_total, p.reviews_total,
               p.issue_comments_total, p.review_comments_total,
               (SELECT COUNT(*) FROM files f WHERE f.pr_number = p.number),
               (SELECT COUNT(*) FROM artifacts a
                WHERE a.pr_number = p.number AND a.kind = 'review'),
               (SELECT COUNT(*) FROM artifacts a
                WHERE a.pr_number = p.number AND a.kind = 'issue_comment'),
               (SELECT COUNT(*) FROM artifacts a
                WHERE a.pr_number = p.number AND a.kind = 'review_comment')
        FROM pull_requests p
        """
    ).fetchall()
    totals = dict.fromkeys(("files", "reviews", "issue_comments", "review_comments"), 0)
    for row in rows:
        expected = row[1:5]
        actual = row[5:9]
        for index, kind in enumerate(totals):
            totals[kind] += int(actual[index] != expected[index])
    return totals


def write_manifest(db_path: Path, conn: sqlite3.Connection) -> None:
    state_counts = {
        state: count
        for state, count in conn.execute(
            "SELECT state, COUNT(*) FROM pull_requests GROUP BY state"
        )
    }
    artifact_counts = {
        kind: count
        for kind, count in conn.execute(
            "SELECT kind, COUNT(*) FROM artifacts GROUP BY kind"
        )
    }
    manifest = {
        "updated_at": utc_now(),
        "repository": f"{OWNER}/{REPOSITORY}",
        "scope": "OPEN, MERGED, and CLOSED PRs ordered by CREATED_AT ascending",
        "audit_started_at": get_meta(conn, "audit_started_at"),
        "status": get_meta(conn, "status") or "collecting",
        "pull_requests": {
            "total": conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0],
            "by_state": state_counts,
            "snapshot_total": int(get_meta(conn, "snapshot_total") or 0),
            "high_water": {
                "number": int(get_meta(conn, "high_water_number") or 0),
                "created_at": get_meta(conn, "high_water_created_at"),
            },
        },
        "artifacts": {
            "total": conn.execute("SELECT COUNT(*) FROM artifacts").fetchone()[0],
            "by_kind": artifact_counts,
            "nonempty_human": conn.execute(
                "SELECT COUNT(*) FROM artifacts WHERE is_bot = 0 AND TRIM(body) != ''"
            ).fetchone()[0],
        },
        "possibly_truncated_connections": truncation_counts(conn),
        "cursor": get_meta(conn, "cursor"),
        "has_next_page": get_meta(conn, "has_next_page") == "True",
        "snapshot_complete": get_meta(conn, "snapshot_complete") == "True",
        "last_rate_limit": json.loads(get_meta(conn, "last_rate_limit") or "{}"),
    }
    destination = db_path.with_name(f"{db_path.stem}.manifest.json")
    with tempfile.NamedTemporaryFile(
        "w", dir=destination.parent, delete=False, encoding="utf-8"
    ) as handle:
        json.dump(manifest, handle, indent=2, sort_keys=True)
        handle.write("\n")
        temporary = Path(handle.name)
    os.replace(temporary, destination)


def initialize_database(
    conn: sqlite3.Connection, requested_cutoff: str | None
) -> datetime:
    conn.executescript(SCHEMA)
    existing_version = get_meta(conn, "schema_version")
    if existing_version and existing_version != SCHEMA_VERSION:
        raise SystemExit(
            f"database schema is {existing_version}; expected {SCHEMA_VERSION}"
        )
    existing_cutoff = get_meta(conn, "audit_started_at")
    if existing_cutoff:
        if requested_cutoff and parse_timestamp(requested_cutoff) != parse_timestamp(
            existing_cutoff
        ):
            raise SystemExit(
                f"database cutoff is {existing_cutoff}; requested {requested_cutoff}"
            )
        return parse_timestamp(existing_cutoff)

    cutoff = requested_cutoff or utc_now()
    parsed_cutoff = parse_timestamp(cutoff)
    with conn:
        set_meta(conn, "schema_version", SCHEMA_VERSION)
        set_meta(conn, "repository", f"{OWNER}/{REPOSITORY}")
        set_meta(conn, "states", "OPEN,MERGED,CLOSED")
        set_meta(conn, "ordering", "CREATED_AT_ASC")
        set_meta(conn, "audit_started_at", parsed_cutoff.isoformat())
        set_meta(
            conn,
            "audit_cutoff_source",
            "explicit" if requested_cutoff else "automatic",
        )
        set_meta(conn, "started_at", utc_now())
        set_meta(conn, "status", "collecting")
    return parsed_cutoff


def establish_snapshot(
    conn: sqlite3.Connection, cutoff: datetime, graphql_threshold: int
) -> datetime:
    """Freeze the population count and newest edge before the oldest-first crawl."""

    stored_total = get_meta(conn, "snapshot_total")
    if stored_total is not None:
        if not get_meta(conn, "high_water_number"):
            raise RuntimeError("snapshot metadata is incomplete; use a fresh database")
        return cutoff
    if conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0]:
        raise RuntimeError(
            "database has PR rows but no initial high-water snapshot; use a fresh database"
        )

    ensure_budget("graphql", graphql_threshold)
    payload = gh_bootstrap()
    repository = payload["data"]["repository"]
    total = int(repository["population"]["totalCount"])
    newest_nodes = repository["newest"]["nodes"]
    if total <= 0 or len(newest_nodes) != 1:
        raise RuntimeError(
            f"cannot establish snapshot: total={total}, newest_edges={len(newest_nodes)}"
        )
    high_water = newest_nodes[0]
    high_water_created = parse_timestamp(high_water["createdAt"])

    # For the normal automatic snapshot, the high-water query is authoritative;
    # move the secondary wall-clock cutoff just after that atomic query.  An
    # explicitly requested cutoff must already include the high-water edge.
    if get_meta(conn, "audit_cutoff_source") == "automatic":
        cutoff = parse_timestamp(utc_now())
    elif high_water_created > cutoff:
        raise RuntimeError(
            "the explicit audit cutoff predates the current newest PR; historical "
            "population snapshots are unsupported"
        )

    with conn:
        set_meta(conn, "audit_started_at", cutoff.isoformat())
        set_meta(conn, "snapshot_total", total)
        set_meta(conn, "high_water_number", int(high_water["number"]))
        set_meta(conn, "high_water_created_at", high_water_created.isoformat())
        set_meta(conn, "snapshot_established_at", utc_now())
        set_meta(conn, "last_rate_limit", json.dumps(payload["data"]["rateLimit"]))
    return cutoff


def repair_all(
    conn: sqlite3.Connection, graphql_threshold: int, rest_threshold: int
) -> None:
    rows = conn.execute(
        "SELECT number, observed_at FROM pull_requests ORDER BY number"
    ).fetchall()
    for number, observed_at in rows:
        if expected_counts(conn, number) != collected_counts(conn, number):
            with conn:
                repaired = repair_pr_connections(
                    conn,
                    number,
                    observed_at,
                    graphql_threshold,
                    rest_threshold,
                )
            if repaired:
                print(f"repaired PR #{number}: {', '.join(repaired)}", flush=True)


def run_self_test() -> int:
    from unittest import mock

    assert is_transient_github_failure("gh: HTTP 502: Bad Gateway")
    assert is_transient_github_failure("read: connection reset by peer")
    assert is_transient_github_failure("net/http: TLS handshake timeout")
    assert is_transient_github_failure("unexpected end of JSON input")
    assert is_transient_github_failure("invalid JSON response from GitHub")
    assert is_transient_github_failure("error connecting to api.github.com")
    assert is_transient_github_failure("check your internet connection")
    assert is_transient_github_failure("could not resolve host: api.github.com")
    assert not is_transient_github_failure("gh: HTTP 422: GraphQL schema error")
    assert retry_after_seconds("gh: HTTP 429\nRetry-After: 17") == 17.0
    assert retry_delay(6, "gh: HTTP 503\nRetry-After: 120") == 60.0
    assert retry_delay(3, "gh: HTTP 503") == 4.0

    transient = subprocess.CompletedProcess(
        args=[], returncode=1, stdout="", stderr="gh: HTTP 502: Bad Gateway"
    )
    success = subprocess.CompletedProcess(
        args=[], returncode=0, stdout='{"ok":true}', stderr=""
    )
    with mock.patch.object(subprocess, "run", side_effect=[transient, success]) as run:
        with mock.patch.object(time, "sleep") as sleep:
            assert run_gh(["example"], "failure") == {"ok": True}
            assert run.call_count == 2
            sleep.assert_called_once_with(1.0)

    truncated = subprocess.CompletedProcess(
        args=[], returncode=0, stdout='{"partial":', stderr=""
    )
    with mock.patch.object(subprocess, "run", side_effect=[truncated, success]) as run:
        with mock.patch.object(time, "sleep") as sleep:
            assert run_gh(["example"], "failure") == {"ok": True}
            assert run.call_count == 2
            sleep.assert_called_once_with(1.0)

    fatal = subprocess.CompletedProcess(
        args=[], returncode=1, stdout="", stderr="gh: HTTP 422: schema error"
    )
    with mock.patch.object(subprocess, "run", return_value=fatal) as run:
        with mock.patch.object(time, "sleep") as sleep:
            try:
                run_gh(["example"], "failure")
            except RuntimeError as error:
                assert "HTTP 422" in str(error)
            else:
                raise AssertionError("deterministic GitHub failure was retried")
            assert run.call_count == 1
            sleep.assert_not_called()

    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "test.sqlite"
        conn = sqlite3.connect(path)
        initialize_database(conn, "2026-01-01T00:00:00Z")
        observed = "2026-01-01T00:00:01+00:00"
        for number, state in enumerate(("OPEN", "MERGED", "CLOSED"), start=1):
            pr = {
                "number": number,
                "url": f"https://example.invalid/{number}",
                "title": state,
                "bodyText": "",
                "state": state,
                "isDraft": state == "OPEN",
                "createdAt": f"2025-01-0{number}T00:00:00Z",
                "updatedAt": f"2025-01-0{number}T01:00:00Z",
                "mergedAt": "2025-01-02T00:00:00Z" if state == "MERGED" else None,
                "closedAt": "2025-01-03T00:00:00Z" if state != "OPEN" else None,
                "authorAssociation": "CONTRIBUTOR",
                "author": {"login": "contributor", "__typename": "User"},
                "labels": {"totalCount": 0, "nodes": []},
                "files": {"totalCount": 1, "nodes": [{"path": "file.txt"}]},
                "reviews": {"totalCount": 0, "nodes": []},
                "comments": {"totalCount": 0, "nodes": []},
            }
            with conn:
                insert_pr(conn, pr, observed)
                insert_pr(conn, pr, observed)
        assert conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0] == 3
        assert conn.execute("SELECT COUNT(*) FROM files").fetchone()[0] == 3
        assert dict(
            conn.execute("SELECT state, COUNT(*) FROM pull_requests GROUP BY state")
        ) == {"OPEN": 1, "MERGED": 1, "CLOSED": 1}
        assert truncation_counts(conn) == {
            "files": 0,
            "reviews": 0,
            "issue_comments": 0,
            "review_comments": 0,
        }
        assert conn.execute(
            "SELECT merged_at IS NULL, closed_at IS NULL FROM pull_requests "
            "WHERE state = 'OPEN'"
        ).fetchone() == (1, 1)
        conn.close()
    print("self-test passed")
    return 0


def main() -> int:
    args = parse_args()
    if args.self_test:
        return run_self_test()
    if not 1 <= args.batch_size <= 20:
        raise SystemExit("batch size must be between 1 and 20")
    if args.graphql_threshold < 0 or args.rest_threshold < 0:
        raise SystemExit("rate-limit thresholds must be nonnegative")
    if args.stop_after_pages is not None and args.stop_after_pages <= 0:
        raise SystemExit("stop-after-pages must be positive")

    args.db.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(args.db)
    cutoff = initialize_database(conn, args.audit_started_at)
    try:
        cutoff = establish_snapshot(conn, cutoff, args.graphql_threshold)
    except RateLimitPause as pause:
        with conn:
            set_meta(conn, "status", "rate_limited")
            set_meta(conn, "rate_limit_resource", pause.resource)
            set_meta(conn, "rate_limit_reset_at", pause.reset_at)
        write_manifest(args.db, conn)
        conn.close()
        print(f"checkpointed: {pause}", file=sys.stderr)
        return 75
    with conn:
        set_meta(conn, "status", "collecting")
    cursor = get_meta(conn, "cursor")
    snapshot_total = int(get_meta(conn, "snapshot_total") or 0)
    high_water_number = int(get_meta(conn, "high_water_number") or 0)
    high_water_created = parse_timestamp(
        get_meta(conn, "high_water_created_at") or ""
    )
    pages = 0

    try:
        while get_meta(conn, "snapshot_complete") != "True":
            ensure_budget("graphql", args.graphql_threshold)
            payload = gh_graphql(args.batch_size, cursor)
            connection = payload["data"]["repository"]["pullRequests"]
            rate = payload["data"]["rateLimit"]
            observed_at = utc_now()
            count_before = conn.execute(
                "SELECT COUNT(*) FROM pull_requests"
            ).fetchone()[0]
            if int(connection["totalCount"]) < snapshot_total:
                raise RuntimeError(
                    "the all-state PR population shrank after the initial snapshot; "
                    "an edge may have been deleted, so a fresh audit snapshot is required"
                )
            eligible: list[dict[str, Any]] = []
            reached_high_water = False
            for pr in connection["nodes"]:
                position = count_before + len(eligible) + 1
                created_at = parse_timestamp(pr["createdAt"])
                if position > snapshot_total:
                    break
                if conn.execute(
                    "SELECT 1 FROM pull_requests WHERE number = ?", (pr["number"],)
                ).fetchone():
                    raise RuntimeError(
                        f"PR #{pr['number']} appeared twice in the cursor traversal"
                    )
                if created_at > cutoff or created_at > high_water_created:
                    raise RuntimeError(
                        f"encountered PR #{pr['number']} beyond the initial high-water "
                        "before collecting the frozen population"
                    )
                if int(pr["number"]) == high_water_number and position != snapshot_total:
                    raise RuntimeError(
                        "the initial high-water edge appeared before the frozen population "
                        "count was reached; CREATED_AT tie ordering changed"
                    )
                if position == snapshot_total:
                    if (
                        int(pr["number"]) != high_water_number
                        or created_at != high_water_created
                    ):
                        raise RuntimeError(
                            "the final frozen-population edge does not match the initial "
                            "high-water identity; restart with a fresh audit snapshot"
                        )
                    reached_high_water = True
                eligible.append(pr)
                if reached_high_water:
                    break

            if not reached_high_water and not connection["pageInfo"]["hasNextPage"]:
                raise RuntimeError(
                    "the PR connection ended before the initial high-water edge was reached"
                )

            with conn:
                for pr in eligible:
                    insert_pr(conn, pr, observed_at)
                    repaired = repair_pr_connections(
                        conn,
                        int(pr["number"]),
                        observed_at,
                        args.graphql_threshold,
                        args.rest_threshold,
                    )
                    if repaired:
                        print(
                            f"repaired PR #{pr['number']}: {', '.join(repaired)}",
                            flush=True,
                        )
                cursor = connection["pageInfo"]["endCursor"]
                set_meta(conn, "cursor", cursor or "")
                set_meta(
                    conn,
                    "has_next_page",
                    connection["pageInfo"]["hasNextPage"],
                )
                set_meta(conn, "last_rate_limit", json.dumps(rate))
                set_meta(conn, "updated_at", observed_at)
                if reached_high_water:
                    final_count = conn.execute(
                        "SELECT COUNT(*) FROM pull_requests"
                    ).fetchone()[0]
                    if final_count != snapshot_total:
                        raise RuntimeError(
                            f"frozen population expected {snapshot_total} PRs, inserted "
                            f"{final_count}"
                        )
                    set_meta(conn, "snapshot_complete", True)
                    set_meta(conn, "snapshot_pr_count", final_count)
            pages += 1
            count = conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0]
            write_manifest(args.db, conn)
            print(
                f"pages={pages} collected={count} page_cost={rate['cost']} "
                f"graphql_remaining={rate['remaining']}",
                flush=True,
            )
            if args.stop_after_pages is not None and pages >= args.stop_after_pages:
                with conn:
                    set_meta(conn, "status", "checkpointed")
                write_manifest(args.db, conn)
                print(f"checkpointed after {pages} page(s): {args.db}")
                return 0

        final_count = conn.execute("SELECT COUNT(*) FROM pull_requests").fetchone()[0]
        if final_count != snapshot_total:
            raise RuntimeError(
                f"snapshot marked complete with {final_count} PRs; expected {snapshot_total}"
            )
        high_water_row = conn.execute(
            "SELECT created_at FROM pull_requests WHERE number = ?",
            (high_water_number,),
        ).fetchone()
        if not high_water_row or parse_timestamp(high_water_row[0]) != high_water_created:
            raise RuntimeError("stored high-water PR does not match the initial snapshot")

        repair_all(conn, args.graphql_threshold, args.rest_threshold)
        truncated = truncation_counts(conn)
        if any(truncated.values()):
            raise RuntimeError(f"collection still has truncated connections: {truncated}")
        with conn:
            set_meta(conn, "status", "complete")
            set_meta(conn, "completed_at", utc_now())
        write_manifest(args.db, conn)
        print(
            "complete: "
            f"{conn.execute('SELECT COUNT(*) FROM pull_requests').fetchone()[0]} PRs "
            f"in {args.db}",
            flush=True,
        )
        return 0
    except RateLimitPause as pause:
        with conn:
            set_meta(conn, "status", "rate_limited")
            set_meta(conn, "rate_limit_resource", pause.resource)
            set_meta(conn, "rate_limit_reset_at", pause.reset_at)
        write_manifest(args.db, conn)
        print(f"checkpointed: {pause}", file=sys.stderr)
        return 75
    finally:
        conn.close()


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("interrupted; the last completed page remains checkpointed", file=sys.stderr)
        sys.exit(130)
