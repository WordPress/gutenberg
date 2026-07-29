#!/usr/bin/env python3
"""Run resumable current-trunk validation workers."""

from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import reduce_clusters
import run_reduction_workers as base


@dataclass(frozen=True)
class Plan:
    name: str
    path: Path
    sha256: str
    ids: tuple[str, ...]
    output: Path


def validate(payload: Any, plan: Plan, origin_sha: str) -> dict[str, int]:
    if not isinstance(payload, dict) or set(payload) != {"origin_sha", "decisions"}:
        raise ValueError("expected origin_sha and decisions")
    if payload["origin_sha"] != origin_sha:
        raise ValueError("origin SHA mismatch")
    decisions = payload["decisions"]
    if not isinstance(decisions, list) or len(decisions) != len(plan.ids):
        raise ValueError("decision count mismatch")
    counts: dict[str, int] = {}
    for expected, decision in zip(plan.ids, decisions, strict=True):
        if not isinstance(decision, dict) or set(decision) != {
            "cluster_id", "disposition", "validated_rule", "evidence", "rationale"
        }:
            raise ValueError("invalid decision fields")
        decision["cluster_id"] = expected
        disposition = decision["disposition"]
        if disposition not in {
            "supported", "revised", "obsolete", "insufficient-context"
        }:
            raise ValueError("invalid disposition")
        counts[disposition] = counts.get(disposition, 0) + 1
        rule = decision["validated_rule"]
        evidence = decision["evidence"]
        if not isinstance(rule, str) or not isinstance(evidence, list):
            raise ValueError("invalid rule or evidence")
        if disposition in {"supported", "revised"} and (not rule or not evidence):
            raise ValueError("supported/revised decision lacks rule or evidence")
        if disposition in {"obsolete", "insufficient-context"} and rule:
            raise ValueError("rejected decision must have empty rule")
        if not isinstance(decision["rationale"], str) or not decision["rationale"]:
            raise ValueError("missing rationale")
        for citation in evidence:
            if not isinstance(citation, dict) or set(citation) != {
                "path", "line_start", "line_end", "explanation"
            }:
                raise ValueError("invalid citation")
            if (
                not isinstance(citation["path"], str)
                or not citation["path"]
                or not isinstance(citation["line_start"], int)
                or not isinstance(citation["line_end"], int)
                or citation["line_start"] < 1
                or citation["line_end"] < citation["line_start"]
                or not isinstance(citation["explanation"], str)
                or not citation["explanation"]
            ):
                raise ValueError("invalid citation values")
    return counts


def run_one(args: argparse.Namespace, plan: Plan, origin_sha: str, schema: Path) -> dict:
    if plan.output.exists():
        try:
            payload = json.loads(plan.output.read_text(encoding="utf-8"))
            return {"batch": plan.name, "status": "skipped", "counts": validate(payload, plan, origin_sha)}
        except Exception:
            pass
    prompt = (
        args.prompt.read_text(encoding="utf-8")
        + "\n\nExact candidate order:\n"
        + json.dumps(list(plan.ids))
        + "\n\n"
        + plan.path.read_text(encoding="utf-8")
    )
    errors = []
    logs = args.output.parent / f"{args.output.name}-attempts"
    logs.mkdir(parents=True, exist_ok=True)
    for attempt in range(1, args.max_attempts + 1):
        with tempfile.NamedTemporaryFile(dir=logs, delete=False, suffix=".json") as handle:
            response = Path(handle.name)
        response.unlink()
        command = [
            args.codex_bin, "exec", "--sandbox", "read-only", "--ephemeral",
            "--output-schema", str(schema), "--output-last-message", str(response),
            "--json", "--color", "never", "--cd", str(args.repo), "-"
        ]
        events = logs / f"events-{plan.path.stem}-{attempt:03d}.jsonl"
        completed = subprocess.run(
            command, input=prompt, text=True, stdout=events.open("w"),
            stderr=subprocess.PIPE, timeout=args.timeout, check=False
        )
        (logs / f"stderr-{plan.path.stem}-{attempt:03d}.log").write_text(
            completed.stderr or "", encoding="utf-8"
        )
        try:
            if completed.returncode:
                raise ValueError(f"codex exec exited {completed.returncode}")
            payload = json.loads(response.read_text(encoding="utf-8"))
            counts = validate(payload, plan, origin_sha)
            base.atomic_json(plan.output, payload)
            response.replace(logs / f"response-{plan.path.stem}-{attempt:03d}.json")
            return {"batch": plan.name, "status": "completed", "counts": counts}
        except Exception as error:
            errors.append(str(error))
            if response.exists():
                response.replace(logs / f"response-{plan.path.stem}-{attempt:03d}.json")
    return {"batch": plan.name, "status": "failed", "errors": errors}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--prompt", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--concurrency", type=int, default=4)
    parser.add_argument("--max-attempts", type=int, default=3)
    parser.add_argument("--timeout", type=int, default=1800)
    parser.add_argument("--codex-bin", default="codex")
    args = parser.parse_args()
    args.plan, args.output, args.prompt, args.repo = (
        args.plan.resolve(), args.output.resolve(), args.prompt.resolve(), args.repo.resolve()
    )
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((args.plan / "manifest.json").read_text(encoding="utf-8"))
    origin_sha = manifest["origin_sha"]
    schema = args.plan / "validation-output.schema.json"
    plans = []
    for row in reduce_clusters.jsonl(args.plan / "validation-index.jsonl"):
        path = args.plan / "batches" / row["batch"]
        if reduce_clusters.sha256(path) != row["sha256"]:
            raise ValueError(f"{path}: checksum mismatch")
        plans.append(Plan(row["batch"], path, row["sha256"], tuple(row["candidate_ids"]),
                          args.output / f"{path.stem}.json"))
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        statuses = list(pool.map(lambda plan: run_one(args, plan, origin_sha, schema), plans))
    failed = [row for row in statuses if row["status"] == "failed"]
    summary = {
        "origin_sha": origin_sha,
        "selected": len(plans),
        "completed": sum(row["status"] == "completed" for row in statuses),
        "skipped": sum(row["status"] == "skipped" for row in statuses),
        "failed": len(failed),
        "statuses": statuses,
    }
    base.atomic_json(args.output.parent / f"{args.output.name}-attempts" / "run-summary.json", summary)
    print(json.dumps(summary, indent=2))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
