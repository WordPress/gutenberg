#!/usr/bin/env python3
"""Build and validate bounded, exhaustive Gutenberg review-audit batches.

The pipeline uses four ordered exclusions: bot-authored artifacts, PR-author
follow-ups, empty bodies, and exact low-signal approval/thanks messages. Every
other artifact is assigned to exactly one analysis batch. The ledger records
every collected artifact so coverage can be reconciled exactly with the DB.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import sqlite3
import tempfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator, TextIO


LOW_SIGNAL = re.compile(
    r"^(?:lgtm|looks good(?: to me)?|approved|ship it|nice|great|thanks!?|"
    r"thank you!?|tested and works|works for me|\+1|✅|👍)[.!\s🎉:+-]*$",
    re.IGNORECASE,
)

EXCLUSION_PRECEDENCE = ("bot", "pr_author_followup", "empty", "exact_low_signal")
EXCLUSION_REASONS = set(EXCLUSION_PRECEDENCE)
ASSESSMENTS = {"finding", "no_finding"}
SEVERITIES = {"info", "low", "medium", "high", "critical"}

WORKER_RECORD_SCHEMA: dict[str, Any] = {
    "title": "Gutenberg PR review audit result",
    "type": "object",
    "additionalProperties": False,
    "required": [
        "artifact_id",
        "batch",
        "pr_number",
        "pr_state",
        "reviewer",
        "url",
        "kind",
        "assessment",
        "category",
        "severity",
        "proposed_rule",
        "current_validation_needed",
        "rationale",
    ],
    "properties": {
        "artifact_id": {"type": "string", "minLength": 1},
        "batch": {"type": "string", "pattern": r"^batch-\d{5}\.md$"},
        "pr_number": {"type": "integer", "minimum": 1},
        "pr_state": {"enum": ["MERGED", "OPEN", "CLOSED"]},
        "reviewer": {"type": ["string", "null"]},
        "url": {"type": ["string", "null"]},
        "kind": {"enum": ["review", "review_comment", "issue_comment"]},
        "assessment": {"enum": sorted(ASSESSMENTS)},
        "category": {"type": ["string", "null"]},
        "severity": {"enum": [None, *sorted(SEVERITIES)]},
        "proposed_rule": {"type": ["string", "null"]},
        "current_validation_needed": {"type": "boolean"},
        "rationale": {"type": "string", "minLength": 1},
    },
}

BATCH_WORKER_SCHEMA: dict[str, Any] = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "title": "Gutenberg PR review audit batch results",
    "type": "object",
    "additionalProperties": False,
    "required": ["results"],
    "properties": {
        "results": {
            "type": "array",
            "minItems": 1,
            "items": WORKER_RECORD_SCHEMA,
        }
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", dir=path.parent, delete=False, encoding="utf-8"
    ) as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
        temporary = Path(handle.name)
    os.replace(temporary, path)


def table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table})")}


def source_query(conn: sqlite3.Connection) -> str:
    """Return a query compatible with both the pilot and full-audit schemas."""
    pr_columns = table_columns(conn, "pull_requests")
    if "state" in pr_columns:
        pr_state = "p.state"
    elif "closed_at" in pr_columns:
        pr_state = (
            "CASE WHEN p.merged_at IS NOT NULL THEN 'MERGED' "
            "WHEN p.closed_at IS NOT NULL THEN 'CLOSED' ELSE 'OPEN' END"
        )
    else:
        pr_state = "CASE WHEN p.merged_at IS NOT NULL THEN 'MERGED' ELSE 'OPEN' END"
    observed_at = "p.observed_at" if "observed_at" in pr_columns else "NULL"
    return f"""
        SELECT a.id, a.pr_number, a.kind, a.url, a.body,
               a.state AS review_state, a.path, a.line, a.original_line,
               a.author, a.author_association, a.is_bot, a.created_at,
               p.title, p.author AS pr_author, {pr_state} AS pr_state,
               p.created_at AS pr_created_at, p.merged_at,
               {observed_at} AS observed_at
        FROM artifacts a
        JOIN pull_requests p ON p.number = a.pr_number
        ORDER BY p.number, COALESCE(a.created_at, ''), a.id
    """


def source_rows(conn: sqlite3.Connection) -> Iterator[sqlite3.Row]:
    conn.row_factory = sqlite3.Row
    yield from conn.execute(source_query(conn))


def compact_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def decision(row: sqlite3.Row) -> tuple[str, str | None]:
    if row["is_bot"]:
        return "excluded", "bot"
    author = row["author"]
    pr_author = row["pr_author"]
    if author and pr_author and author.casefold() == pr_author.casefold():
        return "excluded", "pr_author_followup"
    if not row["body"].strip():
        return "excluded", "empty"
    if LOW_SIGNAL.fullmatch(compact_whitespace(row["body"])):
        return "excluded", "exact_low_signal"
    return "assigned", None


def record_text(row: sqlite3.Row) -> str:
    metadata = {
        "artifact_id": row["id"],
        "pr_number": row["pr_number"],
        "pr_state": row["pr_state"],
        "title": row["title"],
        "kind": row["kind"],
        "review_state": row["review_state"],
        "reviewer": row["author"],
        "author_association": row["author_association"],
        "url": row["url"],
        "path": row["path"],
        "line": row["line"],
        "original_line": row["original_line"],
        "created_at": row["created_at"],
    }
    return (
        f"## Artifact `{row['id']}`\n\n"
        f"Metadata: `{json.dumps(metadata, ensure_ascii=False, separators=(',', ':'))}`\n\n"
        "### Review text\n\n"
        f"{row['body'].strip()}\n\n"
    )


def ledger_record(
    row: sqlite3.Row,
    status: str,
    reason: str | None,
    batch: str | None,
) -> dict[str, Any]:
    body = row["body"].strip()
    return {
        "artifact_id": row["id"],
        "fingerprint": hashlib.sha256(body.encode("utf-8")).hexdigest(),
        "pr_number": row["pr_number"],
        "pr_state": row["pr_state"],
        "kind": row["kind"],
        "review_state": row["review_state"],
        "reviewer": row["author"],
        "url": row["url"],
        "status": status,
        "exclusion_reason": reason,
        "batch": batch,
    }


class BatchWriter:
    def __init__(self, batches_dir: Path, index: TextIO, char_limit: int) -> None:
        self.batches_dir = batches_dir
        self.index = index
        self.char_limit = char_limit
        self.number = 1
        self.parts: list[str] = []
        self.ids: list[str] = []
        self.size = 0
        self.written = 0
        self.oversized = 0

    @property
    def filename(self) -> str:
        return f"batch-{self.number:05d}.md"

    def _header(self) -> str:
        return (
            f"# Gutenberg PR review audit — batch {self.number:05d}\n\n"
            "Assess every artifact individually. Return one JSON object whose `results` "
            "array contains exactly one schema-valid record per artifact; do not "
            "deduplicate findings within this pass. `finding` means the review text "
            "contains a credible, generalizable review lesson. Current-trunk validation "
            "happens later.\n\n"
        )

    def add(self, artifact_id: str, text: str) -> str:
        header_size = len(self._header())
        if self.parts and header_size + self.size + len(text) > self.char_limit:
            self.flush()
        filename = self.filename
        self.parts.append(text)
        self.ids.append(artifact_id)
        self.size += len(text)
        return filename

    def flush(self) -> None:
        if not self.parts:
            return
        content = self._header() + "".join(self.parts)
        path = self.batches_dir / self.filename
        path.write_text(content, encoding="utf-8")
        encoded = content.encode("utf-8")
        oversized = len(content) > self.char_limit
        if oversized:
            self.oversized += 1
        entry = {
            "batch": self.filename,
            "sha256": hashlib.sha256(encoded).hexdigest(),
            "characters": len(content),
            "bytes": len(encoded),
            "artifact_count": len(self.ids),
            "artifact_ids": self.ids,
            "oversized_single_artifact": oversized and len(self.ids) == 1,
        }
        self.index.write(json.dumps(entry, ensure_ascii=False) + "\n")
        self.written += 1
        self.number += 1
        self.parts = []
        self.ids = []
        self.size = 0


def prepare_output(output: Path) -> tuple[Path, Path, Path]:
    output.mkdir(parents=True, exist_ok=True)
    batches = output / "batches"
    if batches.exists():
        shutil.rmtree(batches)
    batches.mkdir()
    ledger = output / "ledger.jsonl"
    index = output / "batch-index.jsonl"
    for path in (
        ledger,
        index,
        output / "manifest.json",
        output / "batch-worker-output.schema.json",
        output / "worker-output.schema.json",
    ):
        if path.exists():
            path.unlink()
    return batches, ledger.with_suffix(".jsonl.tmp"), index.with_suffix(".jsonl.tmp")


def build(db_path: Path, output: Path, batch_chars: int) -> dict[str, Any]:
    if batch_chars < 1000:
        raise ValueError("--batch-chars must be at least 1000")
    conn = sqlite3.connect(f"file:{db_path.resolve()}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    batches_dir, ledger_tmp, index_tmp = prepare_output(output)
    counts: Counter[str] = Counter()
    states: Counter[str] = Counter()
    kinds: Counter[str] = Counter()
    prs: set[int] = set()
    try:
        with ledger_tmp.open("w", encoding="utf-8") as ledger_handle, index_tmp.open(
            "w", encoding="utf-8"
        ) as index_handle:
            writer = BatchWriter(batches_dir, index_handle, batch_chars)
            for row in source_rows(conn):
                counts["artifacts"] += 1
                status, reason = decision(row)
                batch = None
                if status == "assigned":
                    batch = writer.add(row["id"], record_text(row))
                    counts["assigned"] += 1
                    states[row["pr_state"]] += 1
                    kinds[row["kind"]] += 1
                    prs.add(row["pr_number"])
                else:
                    counts[f"excluded_{reason}"] += 1
                ledger_handle.write(
                    json.dumps(
                        ledger_record(row, status, reason, batch), ensure_ascii=False
                    )
                    + "\n"
                )
            writer.flush()
        ledger = output / "ledger.jsonl"
        index = output / "batch-index.jsonl"
        os.replace(ledger_tmp, ledger)
        os.replace(index_tmp, index)
        atomic_json(output / "batch-worker-output.schema.json", BATCH_WORKER_SCHEMA)
        manifest = {
            "format_version": 1,
            "created_at": utc_now(),
            "source_db": str(db_path.resolve()),
            "policy": {
                "scope": "every collected review, review comment, and issue comment",
                "assigned": "all artifacts except the deterministic exclusions",
                "exclusion_precedence": list(EXCLUSION_PRECEDENCE),
            },
            "batch_target_characters": batch_chars,
            "counts": {
                **dict(counts),
                "assigned_prs": len(prs),
                "batches": writer.written,
                "oversized_single_artifact_batches": writer.oversized,
            },
            "assigned_by_pr_state": dict(sorted(states.items())),
            "assigned_by_kind": dict(sorted(kinds.items())),
            "files": {
                "ledger.jsonl": sha256_path(ledger),
                "batch-index.jsonl": sha256_path(index),
                "batch-worker-output.schema.json": sha256_path(
                    output / "batch-worker-output.schema.json"
                ),
            },
        }
        atomic_json(output / "manifest.json", manifest)
        return manifest
    except BaseException:
        for path in (ledger_tmp, index_tmp):
            if path.exists():
                path.unlink()
        raise
    finally:
        conn.close()


def jsonl(path: Path) -> Iterator[tuple[int, dict[str, Any]]]:
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"{path}:{line_number}: invalid JSON: {error}") from error
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number}: expected a JSON object")
            yield line_number, value


def require_keys(record: dict[str, Any], required: set[str], context: str) -> None:
    missing = sorted(required - record.keys())
    if missing:
        raise ValueError(f"{context}: missing keys: {', '.join(missing)}")


def validate_analysis(output: Path, db_path: Path | None = None) -> dict[str, int]:
    manifest_path = output / "manifest.json"
    ledger_path = output / "ledger.jsonl"
    index_path = output / "batch-index.jsonl"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for name, expected in manifest["files"].items():
        actual = sha256_path(output / name)
        if actual != expected:
            raise ValueError(f"{name}: checksum mismatch")

    audit = sqlite3.connect(":memory:")
    audit.executescript(
        """
        CREATE TABLE ledger (
            id TEXT PRIMARY KEY, status TEXT NOT NULL, reason TEXT, batch TEXT,
            pr_number INTEGER NOT NULL, pr_state TEXT NOT NULL, kind TEXT NOT NULL,
            reviewer TEXT, url TEXT, fingerprint TEXT NOT NULL
        );
        CREATE TABLE batched (
            id TEXT PRIMARY KEY, batch TEXT NOT NULL
        );
        """
    )
    ledger_counts: Counter[str] = Counter()
    required_ledger = {
        "artifact_id", "pr_number", "pr_state", "kind", "reviewer", "url",
        "status", "exclusion_reason", "batch", "fingerprint",
    }
    for line, record in jsonl(ledger_path):
        require_keys(record, required_ledger, f"{ledger_path}:{line}")
        status = record["status"]
        reason = record["exclusion_reason"]
        batch = record["batch"]
        if status == "assigned":
            if reason is not None or not isinstance(batch, str):
                raise ValueError(f"{ledger_path}:{line}: invalid assigned decision")
            ledger_counts["assigned"] += 1
        elif status == "excluded":
            if reason not in EXCLUSION_REASONS or batch is not None:
                raise ValueError(f"{ledger_path}:{line}: invalid exclusion decision")
            ledger_counts[f"excluded_{reason}"] += 1
        else:
            raise ValueError(f"{ledger_path}:{line}: invalid status {status!r}")
        try:
            audit.execute(
                "INSERT INTO ledger VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    record["artifact_id"], status, reason, batch,
                    record["pr_number"], record["pr_state"], record["kind"],
                    record["reviewer"], record["url"], record["fingerprint"],
                ),
            )
        except sqlite3.IntegrityError as error:
            raise ValueError(f"{ledger_path}:{line}: duplicate artifact ID") from error
        ledger_counts["artifacts"] += 1

    batches = 0
    indexed_artifacts = 0
    for line, entry in jsonl(index_path):
        require_keys(
            entry,
            {"batch", "sha256", "characters", "bytes", "artifact_count", "artifact_ids"},
            f"{index_path}:{line}",
        )
        batch_path = output / "batches" / entry["batch"]
        # Hash the exact bytes written by BatchWriter. Text-mode reads perform
        # universal-newline conversion, which changes CRLF sequences preserved
        # inside historical review bodies and produces a false checksum failure.
        encoded = batch_path.read_bytes()
        content = encoded.decode("utf-8")
        if hashlib.sha256(encoded).hexdigest() != entry["sha256"]:
            raise ValueError(f"{batch_path}: checksum mismatch")
        if len(content) != entry["characters"] or len(encoded) != entry["bytes"]:
            raise ValueError(f"{batch_path}: size mismatch")
        ids = entry["artifact_ids"]
        if not isinstance(ids, list) or len(ids) != entry["artifact_count"]:
            raise ValueError(f"{index_path}:{line}: artifact count mismatch")
        for artifact_id in ids:
            try:
                audit.execute(
                    "INSERT INTO batched VALUES (?, ?)", (artifact_id, entry["batch"])
                )
            except sqlite3.IntegrityError as error:
                raise ValueError(f"artifact {artifact_id}: assigned to multiple batches") from error
        indexed_artifacts += len(ids)
        batches += 1

    missing = audit.execute(
        "SELECT id FROM ledger WHERE status = 'assigned' "
        "EXCEPT SELECT id FROM batched LIMIT 1"
    ).fetchone()
    extra = audit.execute(
        "SELECT id FROM batched EXCEPT "
        "SELECT id FROM ledger WHERE status = 'assigned' LIMIT 1"
    ).fetchone()
    mismatch = audit.execute(
        "SELECT l.id FROM ledger l JOIN batched b ON b.id = l.id "
        "WHERE l.batch != b.batch LIMIT 1"
    ).fetchone()
    if missing or extra or mismatch:
        raise ValueError(
            f"batch coverage mismatch: missing={missing}, extra={extra}, mismatch={mismatch}"
        )
    actual_batch_files = {path.name for path in (output / "batches").glob("batch-*.md")}
    indexed_batch_files = {
        row[0] for row in audit.execute("SELECT DISTINCT batch FROM batched")
    }
    if actual_batch_files != indexed_batch_files:
        raise ValueError("batch-index.jsonl does not exactly match the batch files")

    expected_counts = manifest["counts"]
    for key, actual in ledger_counts.items():
        if expected_counts.get(key, 0) != actual:
            raise ValueError(f"manifest count mismatch for {key}: {expected_counts.get(key)} != {actual}")
    if expected_counts["batches"] != batches or expected_counts["assigned"] != indexed_artifacts:
        raise ValueError("manifest batch totals do not match the index")

    if db_path is not None:
        source = sqlite3.connect(f"file:{db_path.resolve()}?mode=ro", uri=True)
        source.row_factory = sqlite3.Row
        source_count = 0
        try:
            for row in source_rows(source):
                source_count += 1
                expected_status, expected_reason = decision(row)
                found = audit.execute(
                    "SELECT status, reason, pr_number, pr_state, kind, reviewer, url, fingerprint "
                    "FROM ledger WHERE id = ?",
                    (row["id"],),
                ).fetchone()
                body_fingerprint = hashlib.sha256(
                    row["body"].strip().encode("utf-8")
                ).hexdigest()
                expected = (
                    expected_status, expected_reason, row["pr_number"], row["pr_state"],
                    row["kind"], row["author"], row["url"], body_fingerprint,
                )
                if found is None or tuple(found) != expected:
                    raise ValueError(f"source reconciliation failed for artifact {row['id']}")
        finally:
            source.close()
        if source_count != ledger_counts["artifacts"]:
            raise ValueError("source DB has artifacts missing from the ledger")

    audit.close()
    return {
        "artifacts": ledger_counts["artifacts"],
        "assigned": ledger_counts["assigned"],
        "excluded": ledger_counts["artifacts"] - ledger_counts["assigned"],
        "batches": batches,
    }


def worker_files(path: Path) -> Iterable[Path]:
    if path.is_file():
        yield path
    else:
        yield from sorted(
            [*path.rglob("batch-*.json"), *path.rglob("batch-*.jsonl")]
        )


def worker_records(path: Path) -> Iterator[tuple[str, dict[str, Any]]]:
    """Read one structured batch object, with legacy JSONL compatibility."""
    if path.suffix == ".jsonl":
        for line, record in jsonl(path):
            yield f"{path}:{line}", record
        return
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"{path}: invalid JSON: {error}") from error
    if not isinstance(payload, dict) or set(payload) != {"results"}:
        raise ValueError(f"{path}: expected one object containing only `results`")
    results = payload["results"]
    if not isinstance(results, list) or not results:
        raise ValueError(f"{path}: results must be a nonempty array")
    for index, record in enumerate(results):
        if not isinstance(record, dict):
            raise ValueError(f"{path}:results[{index}]: expected an object")
        yield f"{path}:results[{index}]", record


def validate_worker_record(record: dict[str, Any], context: str) -> None:
    required = set(WORKER_RECORD_SCHEMA["required"])
    require_keys(record, required, context)
    extra = sorted(record.keys() - required)
    if extra:
        raise ValueError(f"{context}: unexpected keys: {', '.join(extra)}")
    if record["assessment"] not in ASSESSMENTS:
        raise ValueError(f"{context}: invalid assessment")
    if not isinstance(record["artifact_id"], str) or not record["artifact_id"]:
        raise ValueError(f"{context}: artifact_id must be a nonempty string")
    if not isinstance(record["batch"], str) or not re.fullmatch(
        r"batch-\d{5}\.md", record["batch"]
    ):
        raise ValueError(f"{context}: invalid batch name")
    if type(record["pr_number"]) is not int or record["pr_number"] < 1:
        raise ValueError(f"{context}: pr_number must be a positive integer")
    if record["pr_state"] not in {"MERGED", "OPEN", "CLOSED"}:
        raise ValueError(f"{context}: invalid PR state")
    if record["kind"] not in {"review", "review_comment", "issue_comment"}:
        raise ValueError(f"{context}: invalid artifact kind")
    for field in ("reviewer", "url"):
        if record[field] is not None and not isinstance(record[field], str):
            raise ValueError(f"{context}: {field} must be a string or null")
    if record["severity"] not in SEVERITIES | {None}:
        raise ValueError(f"{context}: invalid severity")
    if type(record["current_validation_needed"]) is not bool:
        raise ValueError(f"{context}: current_validation_needed must be boolean")
    if not isinstance(record["rationale"], str) or not record["rationale"].strip():
        raise ValueError(f"{context}: rationale must be nonempty")
    if record["assessment"] == "finding":
        for field in ("category", "severity", "proposed_rule"):
            if not isinstance(record[field], str) or not record[field].strip():
                raise ValueError(f"{context}: finding requires nonempty {field}")
    elif any(record[field] not in (None, "") for field in ("category", "severity", "proposed_rule")):
        raise ValueError(f"{context}: no_finding must not supply finding fields")


def validate_workers(analysis: Path, workers: Path) -> dict[str, int]:
    audit = sqlite3.connect(":memory:")
    audit.executescript(
        """
        CREATE TABLE expected (
            id TEXT PRIMARY KEY, batch TEXT NOT NULL, pr_number INTEGER NOT NULL,
            pr_state TEXT NOT NULL, reviewer TEXT, url TEXT, kind TEXT NOT NULL
        );
        CREATE TABLE seen (id TEXT PRIMARY KEY, assessment TEXT NOT NULL);
        """
    )
    for _, record in jsonl(analysis / "ledger.jsonl"):
        if record["status"] == "assigned":
            audit.execute(
                "INSERT INTO expected VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    record["artifact_id"], record["batch"], record["pr_number"],
                    record["pr_state"], record["reviewer"], record["url"],
                    record["kind"],
                ),
            )
    files = list(worker_files(workers))
    if not files:
        raise ValueError(f"no batch worker JSON files found at {workers}")
    counts: Counter[str] = Counter()
    processed_batches: set[str] = set()
    for path in files:
        filename_match = re.fullmatch(r"(batch-\d{5})\.(?:json|jsonl)", path.name)
        if not filename_match:
            raise ValueError(f"{path}: expected a batch-NNNNN.json filename")
        expected_batch = f"{filename_match.group(1)}.md"
        if expected_batch in processed_batches:
            raise ValueError(f"{path}: duplicate output file for {expected_batch}")
        processed_batches.add(expected_batch)
        expected_ids = {
            row[0]
            for row in audit.execute(
                "SELECT id FROM expected WHERE batch = ?", (expected_batch,)
            )
        }
        if not expected_ids:
            raise ValueError(f"{path}: no ledger batch named {expected_batch}")
        file_ids: set[str] = set()
        for context, record in worker_records(path):
            validate_worker_record(record, context)
            if record["batch"] != expected_batch:
                raise ValueError(
                    f"{context}: record batch does not match output filename"
                )
            expected = audit.execute(
                "SELECT batch, pr_number, pr_state, reviewer, url, kind "
                "FROM expected WHERE id = ?",
                (record["artifact_id"],),
            ).fetchone()
            actual = tuple(
                record[field]
                for field in ("batch", "pr_number", "pr_state", "reviewer", "url", "kind")
            )
            if expected is None:
                raise ValueError(f"{context}: unknown or excluded artifact")
            if tuple(expected) != actual:
                raise ValueError(f"{context}: metadata does not match the ledger")
            try:
                audit.execute(
                    "INSERT INTO seen VALUES (?, ?)",
                    (record["artifact_id"], record["assessment"]),
                )
            except sqlite3.IntegrityError as error:
                raise ValueError(f"{context}: duplicate worker result") from error
            file_ids.add(record["artifact_id"])
            counts[record["assessment"]] += 1
        if file_ids != expected_ids:
            missing_ids = sorted(expected_ids - file_ids)
            extra_ids = sorted(file_ids - expected_ids)
            raise ValueError(
                f"{path}: expected artifact set mismatch; "
                f"missing={missing_ids[:3]}, extra={extra_ids[:3]}"
            )
    missing = audit.execute(
        "SELECT id FROM expected EXCEPT SELECT id FROM seen LIMIT 1"
    ).fetchone()
    if missing:
        total = audit.execute(
            "SELECT COUNT(*) FROM expected WHERE id NOT IN (SELECT id FROM seen)"
        ).fetchone()[0]
        raise ValueError(f"worker results missing {total} artifacts; first is {missing[0]}")
    counts["total"] = audit.execute("SELECT COUNT(*) FROM seen").fetchone()[0]
    audit.close()
    return dict(counts)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    build_parser = subparsers.add_parser("build", help="build ledger and batches")
    build_parser.add_argument("--db", type=Path, required=True)
    build_parser.add_argument("--output", type=Path, required=True)
    build_parser.add_argument("--batch-chars", type=int, default=40000)

    validate_parser = subparsers.add_parser("validate", help="validate analysis coverage")
    validate_parser.add_argument("--output", type=Path, required=True)
    validate_parser.add_argument("--db", type=Path)

    workers_parser = subparsers.add_parser(
        "validate-workers", help="validate exhaustive per-batch worker JSON results"
    )
    workers_parser.add_argument("--analysis", type=Path, required=True)
    workers_parser.add_argument("--workers", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "build":
        result = build(args.db, args.output, args.batch_chars)
    elif args.command == "validate":
        result = validate_analysis(args.output, args.db)
    else:
        result = validate_workers(args.analysis, args.workers)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
