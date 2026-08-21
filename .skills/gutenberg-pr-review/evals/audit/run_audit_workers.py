#!/usr/bin/env python3
"""Run one validated, resumable Codex audit worker per Markdown batch.

The runner never trusts a model response merely because `codex exec` exited
successfully.  Each batch result is checked against the analyzer ledger for
exact artifact order and metadata before it is atomically installed as a final
`batch-NNNNN.json` file.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import full_analyze  # noqa: E402  (the sibling module is the schema authority)


RESULT_METADATA = ("batch", "pr_number", "pr_state", "reviewer", "url", "kind")
BATCH_NAME = re.compile(r"^batch-\d{5}\.md$")


@dataclass(frozen=True)
class BatchPlan:
    name: str
    path: Path
    sha256: str
    expected: tuple[dict[str, Any], ...]
    output: Path

    @property
    def stem(self) -> str:
        return self.name.removesuffix(".md")


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


def atomic_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", dir=path.parent, delete=False, encoding="utf-8"
    ) as handle:
        handle.write(value)
        temporary = Path(handle.name)
    os.replace(temporary, path)


def jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"{path}:{line_number}: invalid JSON: {error}") from error
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number}: expected an object")
            yield value


def selected_name(value: str) -> str:
    name = Path(value).name
    if name.endswith(".json"):
        name = name.removesuffix(".json") + ".md"
    elif not name.endswith(".md"):
        name += ".md"
    if not BATCH_NAME.fullmatch(name):
        raise argparse.ArgumentTypeError("batch must look like batch-00001 or batch-00001.md")
    return name


def load_plans(
    analysis: Path,
    output: Path,
    selected: set[str] | None = None,
    limit: int | None = None,
) -> list[BatchPlan]:
    """Load a reconciled index and immutable expected metadata for each batch."""
    full_analyze.validate_analysis(analysis)
    ledger: dict[str, dict[str, Any]] = {}
    for record in jsonl(analysis / "ledger.jsonl"):
        if record.get("status") == "assigned":
            artifact_id = record["artifact_id"]
            if artifact_id in ledger:
                raise ValueError(f"duplicate assigned ledger ID {artifact_id}")
            ledger[artifact_id] = record

    plans: list[BatchPlan] = []
    indexed_names: set[str] = set()
    for entry in jsonl(analysis / "batch-index.jsonl"):
        name = entry.get("batch")
        if not isinstance(name, str) or not BATCH_NAME.fullmatch(name):
            raise ValueError(f"invalid batch-index name: {name!r}")
        if name in indexed_names:
            raise ValueError(f"duplicate batch-index entry {name}")
        indexed_names.add(name)
        if selected is not None and name not in selected:
            continue
        batch_path = analysis / "batches" / name
        expected_hash = entry.get("sha256")
        actual_hash = sha256_path(batch_path)
        if actual_hash != expected_hash:
            raise ValueError(f"{batch_path}: checksum mismatch")
        ids = entry.get("artifact_ids")
        if not isinstance(ids, list) or len(ids) != entry.get("artifact_count"):
            raise ValueError(f"{name}: invalid artifact index")
        expected: list[dict[str, Any]] = []
        for artifact_id in ids:
            record = ledger.get(artifact_id)
            if record is None:
                raise ValueError(f"{name}: ID {artifact_id} is absent or excluded in ledger")
            if record.get("batch") != name:
                raise ValueError(f"{name}: ledger batch mismatch for {artifact_id}")
            expected.append(record)
        plans.append(
            BatchPlan(
                name=name,
                path=batch_path,
                sha256=actual_hash,
                expected=tuple(expected),
                output=output / f"{name.removesuffix('.md')}.json",
            )
        )

    if selected is not None:
        missing = sorted(selected - indexed_names)
        if missing:
            raise ValueError(f"unknown selected batches: {', '.join(missing)}")
    plans.sort(key=lambda plan: plan.name)
    if limit is not None:
        plans = plans[:limit]
    if not plans:
        raise ValueError("no batches selected")
    return plans


def validate_payload(payload: Any, plan: BatchPlan, context: str) -> dict[str, int]:
    """Require exact ordered coverage and ledger metadata for one batch."""
    if not isinstance(payload, dict) or set(payload) != {"results"}:
        raise ValueError(f"{context}: expected an object containing only `results`")
    results = payload["results"]
    if not isinstance(results, list):
        raise ValueError(f"{context}: results must be an array")
    if len(results) != len(plan.expected):
        raise ValueError(
            f"{context}: expected {len(plan.expected)} results, received {len(results)}"
        )

    counts = {"finding": 0, "no_finding": 0}
    seen: set[str] = set()
    for index, (record, expected) in enumerate(zip(results, plan.expected, strict=True)):
        item_context = f"{context}:results[{index}]"
        if not isinstance(record, dict):
            raise ValueError(f"{item_context}: expected an object")
        full_analyze.validate_worker_record(record, item_context)
        artifact_id = record["artifact_id"]
        if artifact_id in seen:
            raise ValueError(f"{item_context}: duplicate artifact ID {artifact_id}")
        seen.add(artifact_id)
        if artifact_id != expected["artifact_id"]:
            raise ValueError(
                f"{item_context}: expected ordered ID {expected['artifact_id']}, got {artifact_id}"
            )
        for field in RESULT_METADATA:
            if record[field] != expected[field]:
                raise ValueError(
                    f"{item_context}: {field} disagrees with ledger "
                    f"({record[field]!r} != {expected[field]!r})"
                )
        counts[record["assessment"]] += 1
    counts["total"] = len(results)
    return counts


def read_valid_output(plan: BatchPlan) -> dict[str, int]:
    try:
        payload = json.loads(plan.output.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError(f"{plan.output}: invalid JSON: {error}") from error
    return validate_payload(payload, plan, str(plan.output))


def next_attempt(log_dir: Path, plan: BatchPlan) -> int:
    highest = 0
    pattern = re.compile(rf"^attempt-{re.escape(plan.stem)}-(\d{{3}})\.json$")
    for path in log_dir.glob(f"attempt-{plan.stem}-*.json"):
        match = pattern.fullmatch(path.name)
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def prompt_for(prompt_path: Path, plan: BatchPlan) -> str:
    shared = prompt_path.read_text(encoding="utf-8").strip()
    batch = plan.path.read_text(encoding="utf-8")
    ids = [record["artifact_id"] for record in plan.expected]
    return (
        f"{shared}\n\n"
        "Operational constraints for this invocation:\n\n"
        "- Do not edit files and do not perform repository or network research.\n"
        "- Return the structured JSON object directly; do not use Markdown fences.\n"
        f"- Set every result's `batch` to `{plan.name}`.\n"
        "- Preserve the supplied artifact order exactly. The expected ordered IDs are:\n"
        f"  {json.dumps(ids, ensure_ascii=False)}\n\n"
        "The batch follows. Return the one JSON object required by the supplied "
        "batch schema.\n\n"
        f"{batch}"
    )


def codex_command(args: argparse.Namespace, schema: Path, response: Path) -> list[str]:
    command = [
        args.codex_bin,
        "exec",
        "--sandbox",
        "read-only",
        "--ephemeral",
        "--skip-git-repo-check",
        "--output-schema",
        str(schema),
        "--output-last-message",
        str(response),
        "--json",
        "--color",
        "never",
        "--cd",
        str(args.analysis),
    ]
    if args.model:
        command.extend(["--model", args.model])
    command.append("-")
    return command


def preserve_response(response: Path, destination: Path) -> None:
    if not response.exists():
        return
    destination.parent.mkdir(parents=True, exist_ok=True)
    os.replace(response, destination)


def run_attempt(
    args: argparse.Namespace,
    plan: BatchPlan,
    schema: Path,
    log_dir: Path,
    attempt: int,
) -> tuple[bool, str | None, dict[str, int] | None]:
    if sha256_path(plan.path) != plan.sha256:
        return False, "batch changed after planning", None

    prefix = f"{plan.stem}-{attempt:03d}"
    events_path = log_dir / f"events-{prefix}.jsonl"
    stderr_path = log_dir / f"stderr-{prefix}.log"
    metadata_path = log_dir / f"attempt-{prefix}.json"
    with tempfile.NamedTemporaryFile(
        "w", dir=log_dir, delete=False, suffix=".response.json", encoding="utf-8"
    ) as handle:
        response_path = Path(handle.name)
    response_path.unlink()
    command = codex_command(args, schema, response_path)
    started = utc_now()
    started_monotonic = time.monotonic()
    returncode: int | None = None
    error: str | None = None
    stderr = ""
    timed_out = False
    counts: dict[str, int] | None = None
    try:
        with events_path.open("w", encoding="utf-8") as events:
            completed = subprocess.run(
                command,
                input=prompt_for(args.prompt, plan),
                text=True,
                stdout=events,
                stderr=subprocess.PIPE,
                timeout=args.timeout,
                check=False,
            )
        returncode = completed.returncode
        stderr = completed.stderr or ""
        if returncode:
            error = f"codex exec exited {returncode}"
        elif not response_path.exists():
            error = "codex exec did not write --output-last-message"
        else:
            try:
                payload = json.loads(response_path.read_text(encoding="utf-8"))
                counts = validate_payload(payload, plan, str(response_path))
            except (OSError, ValueError, json.JSONDecodeError) as validation_error:
                error = str(validation_error)
            else:
                atomic_json(plan.output, payload)
    except subprocess.TimeoutExpired as timeout_error:
        timed_out = True
        error = f"codex exec timed out after {args.timeout} seconds"
        if isinstance(timeout_error.stderr, str):
            stderr = timeout_error.stderr
    except OSError as process_error:
        error = f"could not run codex exec: {process_error}"
    finally:
        atomic_text(stderr_path, stderr)
        if response_path.exists():
            preserve_response(response_path, log_dir / f"response-{prefix}.json")
        atomic_json(
            metadata_path,
            {
                "batch": plan.name,
                "attempt": attempt,
                "started_at": started,
                "finished_at": utc_now(),
                "duration_seconds": round(time.monotonic() - started_monotonic, 3),
                "returncode": returncode,
                "timed_out": timed_out,
                "success": error is None,
                "error": error,
                "counts": counts,
                "batch_sha256": plan.sha256,
                "schema_sha256": sha256_path(schema),
                "command": command,
            },
        )
    return error is None, error, counts


def run_plan(
    args: argparse.Namespace, plan: BatchPlan, schema: Path, log_dir: Path
) -> dict[str, Any]:
    first_attempt = next_attempt(log_dir, plan)
    errors: list[str] = []
    for offset in range(args.max_attempts):
        attempt = first_attempt + offset
        success, error, counts = run_attempt(args, plan, schema, log_dir, attempt)
        if success:
            return {
                "batch": plan.name,
                "status": "completed",
                "attempt": attempt,
                "counts": counts,
            }
        errors.append(error or "unknown worker failure")
        if offset + 1 < args.max_attempts and args.retry_delay:
            time.sleep(min(args.retry_delay * (2**offset), 60))
    return {
        "batch": plan.name,
        "status": "failed",
        "attempts": args.max_attempts,
        "errors": errors,
    }


def self_test() -> dict[str, Any]:
    """Exercise validation and atomic output without invoking Codex."""
    expected = {
        "artifact_id": "artifact-1",
        "batch": "batch-00001.md",
        "pr_number": 42,
        "pr_state": "CLOSED",
        "reviewer": "reviewer",
        "url": "https://example.invalid/comment/1",
        "kind": "review_comment",
    }
    record = {
        **expected,
        "assessment": "finding",
        "category": "testing",
        "severity": "medium",
        "proposed_rule": "Exercise the failure path.",
        "current_validation_needed": True,
        "rationale": "The comment identifies a missing failure-path test.",
    }
    with tempfile.TemporaryDirectory(prefix="gutenberg-worker-self-test-") as directory:
        root = Path(directory)
        batch = root / "batch-00001.md"
        batch.write_text("fixture\n", encoding="utf-8")
        plan = BatchPlan(
            name="batch-00001.md",
            path=batch,
            sha256=sha256_path(batch),
            expected=(expected,),
            output=root / "batch-00001.json",
        )
        payload = {"results": [record]}
        counts = validate_payload(payload, plan, "self-test")
        atomic_json(plan.output, payload)
        resumed = read_valid_output(plan)
        broken = json.loads(json.dumps(payload))
        broken["results"][0]["pr_number"] = 43
        try:
            validate_payload(broken, plan, "self-test-broken")
        except ValueError:
            mismatch_rejected = True
        else:
            mismatch_rejected = False
        if not mismatch_rejected or counts != resumed:
            raise AssertionError("self-test validation failed")
    return {
        "self_test": "passed",
        "codex_calls": 0,
        "validated_records": counts["total"],
        "metadata_mismatch_rejected": mismatch_rejected,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--self-test", action="store_true", help="run local tests; never invoke Codex"
    )
    parser.add_argument("--analysis", type=Path, help="full_analyze output directory")
    parser.add_argument("--output", type=Path, help="directory for final batch JSON files")
    parser.add_argument(
        "--logs",
        type=Path,
        help="attempt log directory (default: a sibling of --output)",
    )
    parser.add_argument(
        "--prompt",
        type=Path,
        default=SCRIPT_DIR / "AUDITOR_PROMPT.md",
        help="common audit prompt prepended to each batch",
    )
    parser.add_argument("--codex-bin", default="codex")
    parser.add_argument("--model", help="optional Codex model override")
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--max-attempts", type=int, default=3)
    parser.add_argument("--retry-delay", type=float, default=2.0)
    parser.add_argument("--timeout", type=float, default=1800.0)
    parser.add_argument(
        "--batch",
        action="append",
        type=selected_name,
        help="run only this batch (repeatable; accepts batch-00001 or .md)",
    )
    parser.add_argument("--limit", type=int, help="cap selected batches for a bounded smoke run")
    parser.add_argument("--force", action="store_true", help="rerun already-valid final outputs")
    parser.add_argument(
        "--dry-run", action="store_true", help="validate and print the execution plan only"
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        print(json.dumps(self_test(), indent=2))
        return 0
    if args.analysis is None or args.output is None:
        raise SystemExit("--analysis and --output are required unless --self-test is used")
    if not 1 <= args.concurrency <= 32:
        raise SystemExit("--concurrency must be between 1 and 32")
    if args.max_attempts < 1:
        raise SystemExit("--max-attempts must be positive")
    if args.retry_delay < 0 or args.timeout <= 0:
        raise SystemExit("--retry-delay must be nonnegative and --timeout must be positive")
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be positive")

    args.analysis = args.analysis.resolve()
    args.output = args.output.resolve()
    args.prompt = args.prompt.resolve()
    if not args.prompt.is_file():
        raise SystemExit(f"prompt does not exist: {args.prompt}")
    schema = args.analysis / "batch-worker-output.schema.json"
    if not schema.is_file():
        raise SystemExit(f"worker schema does not exist: {schema}")
    args.output.mkdir(parents=True, exist_ok=True)
    log_dir = (
        args.logs.resolve()
        if args.logs
        else args.output.parent / f"{args.output.name}-attempts"
    )
    log_dir.mkdir(parents=True, exist_ok=True)

    selected = set(args.batch) if args.batch else None
    plans = load_plans(args.analysis, args.output, selected, args.limit)
    pending: list[BatchPlan] = []
    statuses: list[dict[str, Any]] = []
    for plan in plans:
        if plan.output.exists() and not args.force:
            try:
                counts = read_valid_output(plan)
            except (OSError, ValueError) as error:
                statuses.append(
                    {
                        "batch": plan.name,
                        "status": "invalid_existing_output",
                        "error": str(error),
                    }
                )
                pending.append(plan)
            else:
                statuses.append(
                    {"batch": plan.name, "status": "skipped_valid", "counts": counts}
                )
        else:
            pending.append(plan)

    if args.dry_run:
        print(
            json.dumps(
                {
                    "dry_run": True,
                    "selected": len(plans),
                    "pending": len(pending),
                    "already_valid": sum(
                        item["status"] == "skipped_valid" for item in statuses
                    ),
                    "concurrency": args.concurrency,
                    "schema": str(schema),
                    "prompt": str(args.prompt),
                    "batches": [plan.name for plan in pending],
                    "existing": statuses,
                },
                indent=2,
            )
        )
        return 0

    if pending:
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=args.concurrency, thread_name_prefix="audit-worker"
        ) as executor:
            futures = {
                executor.submit(run_plan, args, plan, schema, log_dir): plan
                for plan in pending
            }
            for future in concurrent.futures.as_completed(futures):
                plan = futures[future]
                try:
                    status = future.result()
                except BaseException as error:
                    status = {
                        "batch": plan.name,
                        "status": "failed",
                        "errors": [f"runner exception: {error}"],
                    }
                statuses.append(status)
                print(json.dumps(status, ensure_ascii=False), flush=True)

    statuses.sort(key=lambda item: item["batch"])
    failed = [item for item in statuses if item["status"] in {"failed", "invalid_existing_output"}]
    # An invalid old output is healed when a later status for the same batch completed.
    completed_names = {
        item["batch"] for item in statuses if item["status"] == "completed"
    }
    failed = [item for item in failed if item["batch"] not in completed_names]
    summary = {
        "finished_at": utc_now(),
        "selected": len(plans),
        "completed": len(completed_names),
        "skipped_valid": sum(item["status"] == "skipped_valid" for item in statuses),
        "failed": len(failed),
        "concurrency": args.concurrency,
        "statuses": statuses,
    }
    atomic_json(log_dir / "run-summary.json", summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
