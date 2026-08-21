#!/usr/bin/env python3
"""Run validated, resumable first-stage semantic reduction workers."""

from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import tempfile
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


SCRIPT_DIR = Path(__file__).resolve().parent
DOMAINS = {
    "accessibility",
    "internationalization",
    "security-privacy",
    "performance",
    "testing-tooling",
    "documentation-release",
    "api-compatibility",
    "blocks-content",
    "state-data-runtime",
    "interaction-ux",
    "visual-styles-theme",
    "architecture-code-quality",
}
SEVERITIES = {"critical", "high", "medium", "low", "info"}
UNRESOLVED_REASONS = {"needs-raw-body", "needs-pr-diff", "ambiguous-meaning"}
BATCH_NAME = re.compile(r"^(?:reduce-[a-z0-9-]+|merge-s\d+-[a-z0-9-]+)-\d{4}\.md$")
MEMBER_ID = re.compile(r"^(?:F\d{6}|K[0-9a-f]{16})$")
LOCAL_ID = re.compile(r"^C\d{2}$")
TOPIC = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


@dataclass(frozen=True)
class Plan:
    name: str
    path: Path
    sha256: str
    expected_ids: tuple[str, ...]
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
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number}: expected object")
            yield value


def selected_name(value: str) -> str:
    name = Path(value).name
    if name.endswith(".json"):
        name = name.removesuffix(".json") + ".md"
    elif not name.endswith(".md"):
        name += ".md"
    if not BATCH_NAME.fullmatch(name):
        raise argparse.ArgumentTypeError("invalid reduction batch name")
    return name


def load_plans(
    reduction: Path,
    output: Path,
    index_name: str,
    selected: set[str] | None,
    limit: int | None,
) -> list[Plan]:
    plans: list[Plan] = []
    indexed: set[str] = set()
    for entry in jsonl(reduction / index_name):
        name = entry.get("batch")
        if not isinstance(name, str) or not BATCH_NAME.fullmatch(name):
            raise ValueError(f"invalid indexed batch {name!r}")
        if name in indexed:
            raise ValueError(f"duplicate indexed batch {name}")
        indexed.add(name)
        if selected is not None and name not in selected:
            continue
        path = reduction / "batches" / name
        actual_hash = sha256_path(path)
        if actual_hash != entry.get("sha256"):
            raise ValueError(f"{path}: checksum mismatch")
        ids = entry.get("finding_ids")
        if (
            not isinstance(ids, list)
            or len(ids) != entry.get("finding_count")
            or len(ids) != len(set(ids))
            or not all(isinstance(value, str) and MEMBER_ID.fullmatch(value) for value in ids)
        ):
            raise ValueError(f"{name}: invalid finding index")
        plans.append(
            Plan(
                name=name,
                path=path,
                sha256=actual_hash,
                expected_ids=tuple(ids),
                output=output / f"{name.removesuffix('.md')}.json",
            )
        )
    if selected is not None:
        missing = sorted(selected - indexed)
        if missing:
            raise ValueError(f"unknown selected batches: {', '.join(missing)}")
    plans.sort(key=lambda plan: plan.name)
    if limit is not None:
        plans = plans[:limit]
    if not plans:
        raise ValueError("no batches selected")
    return plans


def require_string(
    record: dict[str, Any],
    field: str,
    context: str,
    minimum: int = 1,
    maximum: int | None = None,
) -> str:
    value = record.get(field)
    if not isinstance(value, str) or len(value) < minimum:
        raise ValueError(f"{context}: invalid {field}")
    if maximum is not None and len(value) > maximum:
        raise ValueError(f"{context}: {field} exceeds {maximum} characters")
    return value


def validate_payload(payload: Any, plan: Plan, context: str) -> dict[str, int]:
    if not isinstance(payload, dict) or set(payload) != {"clusters", "unresolved"}:
        raise ValueError(f"{context}: expected only clusters and unresolved")
    clusters = payload["clusters"]
    unresolved = payload["unresolved"]
    if not isinstance(clusters, list) or len(clusters) > 80:
        raise ValueError(f"{context}: clusters must be an array of at most 80")
    if not isinstance(unresolved, list):
        raise ValueError(f"{context}: unresolved must be an array")

    expected = set(plan.expected_ids)
    ordinal = {finding_id: index for index, finding_id in enumerate(plan.expected_ids)}
    covered: list[str] = []
    local_ids: set[str] = set()
    singleton_count = 0
    for index, cluster in enumerate(clusters):
        item_context = f"{context}:clusters[{index}]"
        if not isinstance(cluster, dict) or set(cluster) != {
            "local_id",
            "domain",
            "topic_slug",
            "canonical_rule",
            "severity",
            "needs_current_validation",
            "member_ids",
            "merge_basis",
        }:
            raise ValueError(f"{item_context}: invalid fields")
        local_id = require_string(cluster, "local_id", item_context)
        if not LOCAL_ID.fullmatch(local_id) or local_id in local_ids:
            raise ValueError(f"{item_context}: invalid or duplicate local_id")
        local_ids.add(local_id)
        if cluster["domain"] not in DOMAINS:
            raise ValueError(f"{item_context}: invalid domain")
        topic = require_string(cluster, "topic_slug", item_context, maximum=80)
        if not TOPIC.fullmatch(topic):
            raise ValueError(f"{item_context}: invalid topic_slug")
        require_string(cluster, "canonical_rule", item_context, maximum=360)
        if cluster["severity"] not in SEVERITIES:
            raise ValueError(f"{item_context}: invalid severity")
        if not isinstance(cluster["needs_current_validation"], bool):
            raise ValueError(f"{item_context}: invalid needs_current_validation")
        require_string(cluster, "merge_basis", item_context, maximum=600)
        members = cluster["member_ids"]
        if (
            not isinstance(members, list)
            or not members
            or len(members) != len(set(members))
            or not all(isinstance(value, str) and MEMBER_ID.fullmatch(value) for value in members)
        ):
            raise ValueError(f"{item_context}: invalid member_ids")
        covered.extend(members)
        singleton_count += len(members) == 1

    for index, item in enumerate(unresolved):
        item_context = f"{context}:unresolved[{index}]"
        if not isinstance(item, dict) or set(item) != {"member_id", "reason"}:
            raise ValueError(f"{item_context}: invalid fields")
        member_id = item["member_id"]
        if not isinstance(member_id, str) or not MEMBER_ID.fullmatch(member_id):
            raise ValueError(f"{item_context}: invalid member_id")
        if item["reason"] not in UNRESOLVED_REASONS:
            raise ValueError(f"{item_context}: invalid reason")
        covered.append(member_id)

    if len(covered) != len(set(covered)):
        raise ValueError(f"{context}: duplicate finding membership")
    foreign = sorted(set(covered) - expected)
    missing = sorted(expected - set(covered))
    if foreign or missing or len(covered) != len(plan.expected_ids):
        raise ValueError(
            f"{context}: coverage mismatch; missing={missing[:5]}, foreign={foreign[:5]}"
        )
    return {
        "inputs": len(plan.expected_ids),
        "clusters": len(clusters),
        "singletons": singleton_count,
        "unresolved": len(unresolved),
    }


def normalize_member_order(payload: Any, plan: Plan) -> Any:
    """Repair unambiguous copied IDs and canonicalize member ordering."""
    if not isinstance(payload, dict) or not isinstance(payload.get("clusters"), list):
        return payload
    ordinal = {
        member_id: index for index, member_id in enumerate(plan.expected_ids)
    }
    supplied = [
        member_id
        for cluster in payload["clusters"]
        if isinstance(cluster, dict)
        and isinstance(cluster.get("member_ids"), list)
        for member_id in cluster["member_ids"]
        if isinstance(member_id, str)
    ]
    if isinstance(payload.get("unresolved"), list):
        supplied.extend(
            item["member_id"]
            for item in payload["unresolved"]
            if isinstance(item, dict) and isinstance(item.get("member_id"), str)
        )
    expected = set(plan.expected_ids)
    missing = expected - set(supplied)
    foreign = set(supplied) - expected
    corrections: dict[str, str] = {}
    if len(missing) == len(foreign):
        if len(missing) == 1:
            corrections[next(iter(foreign))] = next(iter(missing))
        candidates: list[tuple[int, str, str]] = []
        for wrong in foreign - set(corrections):
            distances = sorted(
                (
                    sum(left != right for left, right in zip(wrong, right_id))
                    if len(wrong) == len(right_id)
                    else 10**9,
                    right_id,
                )
                for right_id in missing
            )
            if (
                distances
                and distances[0][0] <= 8
                and (len(distances) == 1 or distances[0][0] < distances[1][0])
            ):
                candidates.append((distances[0][0], wrong, distances[0][1]))
        used_targets: set[str] = set()
        for _, wrong, right_id in sorted(candidates):
            if right_id not in used_targets:
                corrections[wrong] = right_id
                used_targets.add(right_id)
    for cluster in payload["clusters"]:
        if not isinstance(cluster, dict) or not isinstance(
            cluster.get("member_ids"), list
        ):
            continue
        cluster["member_ids"] = [
            corrections.get(value, value) for value in cluster["member_ids"]
        ]
        cluster["member_ids"].sort(
            key=lambda value: ordinal.get(value, len(ordinal))
        )
    if isinstance(payload.get("unresolved"), list):
        for item in payload["unresolved"]:
            if isinstance(item, dict) and isinstance(item.get("member_id"), str):
                item["member_id"] = corrections.get(
                    item["member_id"], item["member_id"]
                )
    return payload


def read_valid_output(plan: Plan) -> dict[str, int]:
    payload = json.loads(plan.output.read_text(encoding="utf-8"))
    return validate_payload(payload, plan, str(plan.output))


def next_attempt(log_dir: Path, plan: Plan) -> int:
    highest = 0
    pattern = re.compile(rf"^attempt-{re.escape(plan.stem)}-(\d{{3}})\.json$")
    for path in log_dir.glob(f"attempt-{plan.stem}-*.json"):
        match = pattern.fullmatch(path.name)
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def prompt_for(prompt_path: Path, plan: Plan) -> str:
    shared = prompt_path.read_text(encoding="utf-8").strip()
    batch = plan.path.read_text(encoding="utf-8")
    return (
        f"{shared}\n\n"
        "Operational constraints for this invocation:\n\n"
        "- Do not edit files and do not perform repository or network research.\n"
        "- Return the structured JSON object directly; do not use Markdown fences.\n"
        "- Preserve member ordering within each cluster.\n"
        "- The exact input finding IDs are:\n"
        f"  {json.dumps(list(plan.expected_ids))}\n\n"
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
        str(args.reduction),
    ]
    if args.model:
        command.extend(["--model", args.model])
    command.append("-")
    return command


def run_attempt(
    args: argparse.Namespace,
    plan: Plan,
    schema: Path,
    logs: Path,
    attempt: int,
) -> tuple[bool, str | None, dict[str, int] | None]:
    prefix = f"{plan.stem}-{attempt:03d}"
    events_path = logs / f"events-{prefix}.jsonl"
    stderr_path = logs / f"stderr-{prefix}.log"
    metadata_path = logs / f"attempt-{prefix}.json"
    with tempfile.NamedTemporaryFile(
        "w", dir=logs, delete=False, suffix=".response.json", encoding="utf-8"
    ) as handle:
        response_path = Path(handle.name)
    response_path.unlink()
    command = codex_command(args, schema, response_path)
    started = utc_now()
    start_clock = time.monotonic()
    returncode: int | None = None
    stderr = ""
    error: str | None = None
    timed_out = False
    counts: dict[str, int] | None = None
    try:
        if sha256_path(plan.path) != plan.sha256:
            raise ValueError("batch changed after planning")
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
            error = "codex exec did not write a response"
        else:
            payload = normalize_member_order(
                json.loads(response_path.read_text(encoding="utf-8")), plan
            )
            counts = validate_payload(payload, plan, str(response_path))
            atomic_json(plan.output, payload)
    except subprocess.TimeoutExpired as timeout_error:
        timed_out = True
        error = f"codex exec timed out after {args.timeout} seconds"
        if isinstance(timeout_error.stderr, str):
            stderr = timeout_error.stderr
    except (OSError, ValueError, json.JSONDecodeError) as run_error:
        error = str(run_error)
    finally:
        atomic_text(stderr_path, stderr)
        if response_path.exists():
            os.replace(response_path, logs / f"response-{prefix}.json")
        atomic_json(
            metadata_path,
            {
                "batch": plan.name,
                "attempt": attempt,
                "started_at": started,
                "finished_at": utc_now(),
                "duration_seconds": round(time.monotonic() - start_clock, 3),
                "returncode": returncode,
                "timed_out": timed_out,
                "success": error is None,
                "error": error,
                "counts": counts,
                "batch_sha256": plan.sha256,
                "prompt_sha256": sha256_path(args.prompt),
                "schema_sha256": sha256_path(schema),
                "command": command,
            },
        )
    return error is None, error, counts


def run_plan(
    args: argparse.Namespace, plan: Plan, schema: Path, logs: Path
) -> dict[str, Any]:
    errors: list[str] = []
    first_attempt = next_attempt(logs, plan)
    for offset in range(args.max_attempts):
        attempt = first_attempt + offset
        success, error, counts = run_attempt(args, plan, schema, logs, attempt)
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
    with tempfile.TemporaryDirectory(prefix="gutenberg-reducer-test-") as directory:
        root = Path(directory)
        batch = root / "reduce-testing-tooling-0001.md"
        batch.write_text("fixture\n", encoding="utf-8")
        plan = Plan(
            name=batch.name,
            path=batch,
            sha256=sha256_path(batch),
            expected_ids=("F000001", "F000002"),
            output=root / "output.json",
        )
        payload = {
            "clusters": [
                {
                    "local_id": "C01",
                    "domain": "testing-tooling",
                    "topic_slug": "behavioral-regression-tests",
                    "canonical_rule": "Add a behavioral regression test for each bug fix.",
                    "severity": "medium",
                    "needs_current_validation": True,
                    "member_ids": ["F000001", "F000002"],
                    "merge_basis": "Both findings require behavior-level regression coverage.",
                }
            ],
            "unresolved": [],
        }
        counts = validate_payload(payload, plan, "self-test")
        broken = json.loads(json.dumps(payload))
        broken["clusters"][0]["member_ids"].append("F000002")
        try:
            validate_payload(broken, plan, "self-test-broken")
        except ValueError:
            duplicate_rejected = True
        else:
            duplicate_rejected = False
        if not duplicate_rejected:
            raise AssertionError("duplicate membership was accepted")
        return {
            "self_test": "passed",
            "validated_inputs": counts["inputs"],
            "duplicate_membership_rejected": True,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--reduction", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--logs", type=Path)
    parser.add_argument("--prompt", type=Path, default=SCRIPT_DIR / "REDUCER_PROMPT.md")
    parser.add_argument("--index-name", default="stage1-index.jsonl")
    parser.add_argument("--schema-name", default="stage1-output.schema.json")
    parser.add_argument("--codex-bin", default="codex")
    parser.add_argument("--model")
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--max-attempts", type=int, default=3)
    parser.add_argument("--retry-delay", type=float, default=2.0)
    parser.add_argument("--timeout", type=float, default=1800.0)
    parser.add_argument("--batch", action="append", type=selected_name)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.self_test:
        print(json.dumps(self_test(), indent=2))
        return 0
    if args.reduction is None or args.output is None:
        raise SystemExit("--reduction and --output are required")
    if not 1 <= args.concurrency <= 32 or args.max_attempts < 1:
        raise SystemExit("invalid concurrency or max-attempts")
    if args.limit is not None and args.limit < 1:
        raise SystemExit("--limit must be positive")
    args.reduction = args.reduction.resolve()
    args.output = args.output.resolve()
    args.prompt = args.prompt.resolve()
    schema = args.reduction / args.schema_name
    if not schema.is_file() or not args.prompt.is_file():
        raise SystemExit("schema or prompt is missing")
    args.output.mkdir(parents=True, exist_ok=True)
    logs = (
        args.logs.resolve()
        if args.logs
        else args.output.parent / f"{args.output.name}-attempts"
    )
    logs.mkdir(parents=True, exist_ok=True)
    selected = set(args.batch) if args.batch else None
    plans = load_plans(
        args.reduction, args.output, args.index_name, selected, args.limit
    )
    statuses: list[dict[str, Any]] = []
    pending: list[Plan] = []
    for plan in plans:
        if plan.output.exists() and not args.force:
            try:
                counts = read_valid_output(plan)
            except (OSError, ValueError, json.JSONDecodeError) as error:
                statuses.append(
                    {
                        "batch": plan.name,
                        "status": "invalid-existing-output",
                        "error": str(error),
                    }
                )
                pending.append(plan)
            else:
                statuses.append(
                    {"batch": plan.name, "status": "skipped-valid", "counts": counts}
                )
        else:
            pending.append(plan)
    if args.dry_run:
        print(
            json.dumps(
                {
                    "selected": len(plans),
                    "pending": len(pending),
                    "already_valid": len(plans) - len(pending),
                    "concurrency": args.concurrency,
                    "batches": [plan.name for plan in pending],
                },
                indent=2,
            )
        )
        return 0
    if pending:
        with concurrent.futures.ThreadPoolExecutor(
            max_workers=args.concurrency, thread_name_prefix="reducer"
        ) as executor:
            futures = {
                executor.submit(run_plan, args, plan, schema, logs): plan
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
    completed = {item["batch"] for item in statuses if item["status"] == "completed"}
    failed = [
        item
        for item in statuses
        if item["status"] in {"failed", "invalid-existing-output"}
        and item["batch"] not in completed
    ]
    summary = {
        "finished_at": utc_now(),
        "selected": len(plans),
        "completed": len(completed),
        "skipped_valid": sum(item["status"] == "skipped-valid" for item in statuses),
        "failed": len(failed),
        "concurrency": args.concurrency,
        "statuses": statuses,
    }
    atomic_json(logs / "run-summary.json", summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
