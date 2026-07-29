#!/usr/bin/env python3
"""Forward-test the updated skill on fresh representative Gutenberg commits."""

from __future__ import annotations

import concurrent.futures
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[3]
SKILL = ROOT.parents[1] / "SKILL.md"
OUTPUT = ROOT / "forward-test-results"
ATTEMPTS = ROOT / "forward-test-attempts"

CASES = [
    ("component-api", "839f5c67e0d2a869611c6f5d3f1a9201ffc34ab1"),
    ("scss-migration", "94db96e4ffbbf522efa7daf8269b2b20267abd80"),
    ("richtext-regression", "1cfca19c6b1c763892a7511c3a16219e0be4bc7a"),
    ("keyboard-selection", "c6c8e71cfef82fe01b189ad58b00af4ea921f743"),
    ("theme-css", "02cfe19f92e4fcdb085d1525f24bc4f9b2a2874e"),
    ("workflow-forks", "7546d82f37427d2ca3b4204c9d76641d2012fdb7"),
    ("toolchain-pinning", "658cb29d541b946538231697017b450755a2c209"),
    ("documentation-only", "4fa4b6c05ea8c8f5d6009c5f74191dee6fcef3ac"),
]


def run_case(case: tuple[str, str]) -> dict:
    name, commit = case
    result = OUTPUT / f"{name}.md"
    events = ATTEMPTS / f"{name}.jsonl"
    if result.exists() and result.stat().st_size:
        return {"case": name, "commit": commit, "status": "skipped"}
    prompt = f"""
Use the Gutenberg PR review skill at {SKILL} to independently review the
single commit {commit}, comparing {commit}^..{commit}.

This is a blind forward test. Inspect the raw diff and necessary surrounding
repository context yourself. Do not assume the commit is defective or clean,
and do not infer an intended answer from the test name. Follow the skill's
finding threshold and output format. Do not edit files or use network access.
"""
    command = [
        "codex", "exec", "--sandbox", "read-only", "--ephemeral",
        "--output-last-message", str(result), "--json", "--color", "never",
        "--cd", str(REPO), "-"
    ]
    with events.open("w", encoding="utf-8") as handle:
        completed = subprocess.run(
            command, input=prompt, text=True, stdout=handle,
            stderr=subprocess.PIPE, timeout=1800, check=False
        )
    (ATTEMPTS / f"{name}.stderr.log").write_text(
        completed.stderr or "", encoding="utf-8"
    )
    return {
        "case": name,
        "commit": commit,
        "status": "completed" if completed.returncode == 0 and result.exists() else "failed",
        "returncode": completed.returncode,
    }


def main() -> int:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    ATTEMPTS.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        statuses = list(pool.map(run_case, CASES))
    summary = {
        "skill": str(SKILL),
        "cases": len(CASES),
        "completed": sum(row["status"] in {"completed", "skipped"} for row in statuses),
        "failed": sum(row["status"] == "failed" for row in statuses),
        "statuses": statuses,
    }
    (ROOT / "forward-test-summary.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(summary, indent=2))
    return 1 if summary["failed"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
