#!/usr/bin/env python3
"""Run validated, resumable editorial triage workers."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Any

import run_reduction_workers as base


ACTIONS = {
    "advance",
    "reject-too-specific",
    "reject-preference",
    "reject-unsupported",
    "reject-obsolete",
    "reject-not-operational",
}


def validate(payload: Any, plan: base.Plan, context: str) -> dict[str, int]:
    if not isinstance(payload, dict) or set(payload) != {"decisions", "candidates"}:
        raise ValueError(f"{context}: expected decisions and candidates")
    decisions = payload["decisions"]
    candidates = payload["candidates"]
    if not isinstance(decisions, list) or len(decisions) != len(plan.expected_ids):
        raise ValueError(f"{context}: decision count mismatch")
    if not isinstance(candidates, list) or len(candidates) > 25:
        raise ValueError(f"{context}: invalid candidate array")
    candidate_ids: set[str] = set()
    candidate_members: dict[str, list[str]] = {}
    for index, candidate in enumerate(candidates):
        where = f"{context}:candidates[{index}]"
        if not isinstance(candidate, dict) or set(candidate) != {
            "local_id",
            "domain",
            "topic_slug",
            "canonical_rule",
            "severity",
            "needs_current_validation",
            "member_ids",
            "merge_basis",
        }:
            raise ValueError(f"{where}: invalid fields")
        local_id = candidate["local_id"]
        if (
            not isinstance(local_id, str)
            or not base.LOCAL_ID.fullmatch(local_id)
            or local_id in candidate_ids
        ):
            raise ValueError(f"{where}: invalid local_id")
        candidate_ids.add(local_id)
        members = candidate["member_ids"]
        if not isinstance(members, list) or not members or len(members) != len(set(members)):
            raise ValueError(f"{where}: invalid member_ids")
        candidate_members[local_id] = members
        if candidate["domain"] not in base.DOMAINS:
            raise ValueError(f"{where}: invalid domain")
        if candidate["severity"] not in base.SEVERITIES:
            raise ValueError(f"{where}: invalid severity")
        if not isinstance(candidate["needs_current_validation"], bool):
            raise ValueError(f"{where}: invalid validation flag")
        base.require_string(candidate, "topic_slug", where, maximum=80)
        base.require_string(candidate, "canonical_rule", where, maximum=360)
        base.require_string(candidate, "merge_basis", where, maximum=600)

    advanced: list[str] = []
    rejected = 0
    for index, (decision, expected_id) in enumerate(
        zip(decisions, plan.expected_ids, strict=True)
    ):
        where = f"{context}:decisions[{index}]"
        if not isinstance(decision, dict) or set(decision) != {
            "cluster_id",
            "action",
            "candidate",
            "reason",
        }:
            raise ValueError(f"{where}: invalid fields")
        if decision["cluster_id"] != expected_id:
            raise ValueError(f"{where}: expected {expected_id}")
        if decision["action"] not in ACTIONS:
            raise ValueError(f"{where}: invalid action")
        base.require_string(decision, "reason", where, maximum=500)
        if decision["action"] == "advance":
            if decision["candidate"] not in candidate_ids:
                raise ValueError(f"{where}: missing candidate")
            advanced.append(expected_id)
        else:
            if decision["candidate"] != "":
                raise ValueError(f"{where}: rejection must have empty candidate")
            rejected += 1
    declared = [
        member for members in candidate_members.values() for member in members
    ]
    if len(declared) != len(set(declared)) or set(declared) != set(advanced):
        raise ValueError(f"{context}: candidate membership differs from advances")
    decision_candidate = {
        decision["cluster_id"]: decision["candidate"]
        for decision in decisions
        if decision["action"] == "advance"
    }
    for candidate_id, members in candidate_members.items():
        if any(decision_candidate.get(member) != candidate_id for member in members):
            raise ValueError(f"{context}: decision/candidate mismatch")
    return {
        "inputs": len(decisions),
        "advanced": len(advanced),
        "rejected": rejected,
        "candidates": len(candidates),
    }


def normalize(payload: Any, plan: base.Plan) -> Any:
    if not isinstance(payload, dict):
        return payload
    decisions = payload.get("decisions")
    if isinstance(decisions, list) and len(decisions) == len(plan.expected_ids):
        for decision, expected_id in zip(
            decisions, plan.expected_ids, strict=True
        ):
            if isinstance(decision, dict):
                decision["cluster_id"] = expected_id
    assigned: dict[str, list[str]] = {}
    if isinstance(decisions, list):
        for decision in decisions:
            if (
                isinstance(decision, dict)
                and decision.get("action") == "advance"
                and isinstance(decision.get("candidate"), str)
            ):
                assigned.setdefault(decision["candidate"], []).append(
                    decision.get("cluster_id")
                )
    for candidate in payload.get("candidates", []):
        if isinstance(candidate, dict) and isinstance(candidate.get("member_ids"), list):
            candidate["member_ids"] = assigned.get(candidate.get("local_id"), [])
    return payload


def prompt_for(prompt: Path, plan: base.Plan) -> str:
    return (
        prompt.read_text(encoding="utf-8").strip()
        + "\n\nOperational constraints:\n\n"
        + "- Do not edit files or perform repository/network research.\n"
        + "- Return JSON only.\n"
        + "- Preserve the exact decision order. Input IDs:\n  "
        + json.dumps(list(plan.expected_ids))
        + "\n\n"
        + plan.path.read_text(encoding="utf-8")
    )


def run_one(
    args: argparse.Namespace,
    plan: base.Plan,
    schema: Path,
    logs: Path,
) -> dict[str, Any]:
    errors: list[str] = []
    first = base.next_attempt(logs, plan)
    for offset in range(args.max_attempts):
        attempt = first + offset
        prefix = f"{plan.stem}-{attempt:03d}"
        response = Path(tempfile.mktemp(dir=logs, suffix=".response.json"))
        command = base.codex_command(args, schema, response)
        started = base.utc_now()
        clock = time.monotonic()
        error = None
        counts = None
        stderr = ""
        returncode = None
        try:
            with (logs / f"events-{prefix}.jsonl").open("w", encoding="utf-8") as events:
                result = subprocess.run(
                    command,
                    input=prompt_for(args.prompt, plan),
                    text=True,
                    stdout=events,
                    stderr=subprocess.PIPE,
                    timeout=args.timeout,
                    check=False,
                )
            returncode = result.returncode
            stderr = result.stderr or ""
            if returncode:
                error = f"codex exec exited {returncode}"
            elif not response.exists():
                error = "codex exec did not write a response"
            else:
                payload = normalize(
                    json.loads(response.read_text(encoding="utf-8")), plan
                )
                counts = validate(payload, plan, str(response))
                base.atomic_json(plan.output, payload)
        except (OSError, ValueError, json.JSONDecodeError, subprocess.TimeoutExpired) as exc:
            error = str(exc)
        base.atomic_text(logs / f"stderr-{prefix}.log", stderr)
        if response.exists():
            os.replace(response, logs / f"response-{prefix}.json")
        base.atomic_json(
            logs / f"attempt-{prefix}.json",
            {
                "batch": plan.name,
                "attempt": attempt,
                "started_at": started,
                "finished_at": base.utc_now(),
                "duration_seconds": round(time.monotonic() - clock, 3),
                "returncode": returncode,
                "success": error is None,
                "error": error,
                "counts": counts,
            },
        )
        if error is None:
            return {
                "batch": plan.name,
                "status": "completed",
                "attempt": attempt,
                "counts": counts,
            }
        errors.append(error)
    return {
        "batch": plan.name,
        "status": "failed",
        "attempts": args.max_attempts,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reduction", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--prompt", type=Path, required=True)
    parser.add_argument("--concurrency", type=int, default=6)
    parser.add_argument("--max-attempts", type=int, default=3)
    parser.add_argument("--timeout", type=float, default=1800)
    parser.add_argument("--limit", type=int)
    parser.add_argument("--codex-bin", default="codex")
    parser.add_argument("--model")
    args = parser.parse_args()
    args.reduction = args.reduction.resolve()
    args.output = args.output.resolve()
    args.prompt = args.prompt.resolve()
    args.output.mkdir(parents=True, exist_ok=True)
    logs = args.output.parent / f"{args.output.name}-attempts"
    logs.mkdir(parents=True, exist_ok=True)
    schema = args.reduction / "editorial-output.schema.json"
    plans = base.load_plans(
        args.reduction, args.output, "merge-index.jsonl", None, args.limit
    )
    pending = []
    for plan in plans:
        if plan.output.exists():
            try:
                validate(
                    json.loads(plan.output.read_text(encoding="utf-8")),
                    plan,
                    str(plan.output),
                )
                continue
            except (OSError, ValueError, json.JSONDecodeError):
                pass
        pending.append(plan)
    statuses = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        futures = {
            pool.submit(run_one, args, plan, schema, logs): plan for plan in pending
        }
        for future in concurrent.futures.as_completed(futures):
            status = future.result()
            statuses.append(status)
            print(json.dumps(status, ensure_ascii=False), flush=True)
    failed = [item for item in statuses if item["status"] == "failed"]
    summary = {
        "finished_at": base.utc_now(),
        "selected": len(plans),
        "completed": sum(item["status"] == "completed" for item in statuses),
        "skipped_valid": len(plans) - len(pending),
        "failed": len(failed),
        "statuses": sorted(statuses, key=lambda item: item["batch"]),
    }
    base.atomic_json(logs / "run-summary.json", summary)
    print(json.dumps(summary, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
