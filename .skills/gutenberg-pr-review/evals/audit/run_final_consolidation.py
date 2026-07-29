#!/usr/bin/env python3
"""Continue the final editorial consolidation through three bounded passes."""

from __future__ import annotations

import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FINDINGS = ROOT / "reduction" / "finding-ledger.jsonl"
PROMPT = ROOT / "FINAL_EDITORIAL_PROMPT.md"
STATUS = ROOT / "final-consolidation-status.json"


def atomic_status(value: dict) -> None:
    temporary = STATUS.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    temporary.replace(STATUS)


def expected_batches(source: Path) -> int:
    with (source / "merge-index.jsonl").open(encoding="utf-8") as handle:
        return sum(1 for line in handle if line.strip())


def accepted_results(results: Path) -> int:
    count = 0
    for path in results.glob("*.json"):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if set(payload) == {"decisions", "candidates"}:
                count += 1
        except (OSError, ValueError, json.JSONDecodeError):
            continue
    return count


def wait_for_pass(source: Path, results: Path, label: str) -> None:
    expected = expected_batches(source)
    while True:
        accepted = accepted_results(results)
        summary_path = results.parent / f"{results.name}-attempts" / "run-summary.json"
        summary = None
        if summary_path.exists():
            summary = json.loads(summary_path.read_text(encoding="utf-8"))
        atomic_status(
            {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "phase": label,
                "state": "running",
                "accepted_batches": accepted,
                "expected_batches": expected,
            }
        )
        if (
            summary
            and summary.get("failed") == 0
            and summary.get("selected") == expected
            and accepted == expected
        ):
            return
        if summary and summary.get("failed"):
            raise RuntimeError(f"{label} failed: {summary['failed']} batches")
        time.sleep(30)


def build_source(
    prior_source: Path,
    prior_results: Path,
    output: Path,
    generation: int,
    batch_stage: int,
) -> None:
    command = [
        "python3",
        str(ROOT / "consolidate_editorial.py"),
        "--source",
        str(prior_source),
        "--results",
        str(prior_results),
        "--finding-ledger",
        str(FINDINGS),
        "--output",
        str(output),
        "--generation",
        str(generation),
        "--batch-stage",
        str(batch_stage),
        "--max-clusters",
        "75",
        "--max-candidates",
        "8",
    ]
    subprocess.run(command, check=True)


def run_workers(source: Path, results: Path, log: Path) -> None:
    command = [
        "python3",
        str(ROOT / "run_editorial_workers.py"),
        "--reduction",
        str(source),
        "--output",
        str(results),
        "--prompt",
        str(PROMPT),
        "--concurrency",
        "8",
        "--max-attempts",
        "4",
        "--timeout",
        "1800",
    ]
    with log.open("a", encoding="utf-8") as handle:
        subprocess.run(command, stdout=handle, stderr=subprocess.STDOUT, check=True)


def main() -> int:
    source1 = ROOT / "final-editorial-1-source"
    results1 = ROOT / "final-editorial-1-results"
    wait_for_pass(source1, results1, "cross-batch pass 1 of 3")

    source2 = ROOT / "final-editorial-2-source"
    results2 = ROOT / "final-editorial-2-results"
    build_source(source1, results1, source2, 7, 7)
    run_workers(source2, results2, ROOT / "final_editorial_2_run.log")
    wait_for_pass(source2, results2, "cross-batch pass 2 of 3")

    source3 = ROOT / "final-editorial-3-source"
    results3 = ROOT / "final-editorial-3-results"
    build_source(source2, results2, source3, 8, 8)
    run_workers(source3, results3, ROOT / "final_editorial_3_run.log")
    wait_for_pass(source3, results3, "cross-batch pass 3 of 3")

    final_source = ROOT / "final-shortlist"
    build_source(source3, results3, final_source, 9, 9)
    manifest = json.loads((final_source / "manifest.json").read_text(encoding="utf-8"))
    atomic_status(
        {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "phase": "cross-batch consolidation",
            "state": "complete",
            "final_candidate_count": manifest["candidate_count"],
            "selected_evidence_count": manifest["selected_evidence_count"],
            "rejection_count_last_pass": manifest["rejection_count"],
            "next_phase": "current-trunk validation",
        }
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
