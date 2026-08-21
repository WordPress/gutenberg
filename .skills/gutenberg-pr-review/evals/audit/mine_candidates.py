#!/usr/bin/env python3
"""Measure focused rule hypotheses against every actionable pilot artifact."""

from __future__ import annotations

import collections
import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).with_name("analysis")

HYPOTHESES: dict[str, dict[str, Any]] = {
    "lifecycle_exit_paths": {
        "rule": "Test pending/debounced/async work across unmount, navigation, close, and cleanup paths.",
        "patterns": [
            r"\bunmount", r"\bcleanup\b", r"debounc", r"pending (?:timer|edit|work|callback)",
            r"navigate away", r"silently lost", r"lost.*edit", r"queued callback",
        ],
    },
    "atomic_shared_state": {
        "rule": "Shared staging layers should commit only the intended change atomically, not unrelated drafts.",
        "patterns": [
            r"shared stag", r"whole staged", r"atomic (?:write|update|commit)",
            r"unrelated.*(?:draft|edit|state)", r"stale closure",
        ],
    },
    "regression_tests_fail_before_fix": {
        "rule": "For regression tests, verify the test fails on trunk and passes with the fix.",
        "patterns": [
            r"fail(?:s|ed|ing)? (?:on|against|with) trunk", r"trunk.*(?:hang|fail)",
            r"regression test", r"before (?:the|this) fix", r"without (?:the|this) (?:change|fix)",
        ],
    },
    "behavior_not_implementation_tests": {
        "rule": "Prefer assertions on observable behavior over implementation details.",
        "patterns": [
            r"implementation detail", r"assert.*(?:computed|visible|output|behavior)",
            r"test.*(?:computed|visible|output|behavior)", r"more robust way to test",
        ],
    },
    "before_after_manual_validation": {
        "rule": "For bug fixes, reproduce on trunk and repeat the same steps on the branch.",
        "patterns": [
            r"tested (?:this )?on (?:both )?trunk and", r"on trunk.*(?:on|fix) branch",
            r"on trunk.*this branch", r"trunk.*before.*after", r"compare the two",
        ],
    },
    "visual_state_evidence": {
        "rule": "Visual changes should include before/after evidence and exercise empty, long, overflow, and narrow states.",
        "patterns": [
            r"screenshot for this visual change", r"before\s*/?\s*after screenshots?",
            r"long string", r"small viewport", r"narrow viewport", r"empty state",
            r"more than ten options", r"(?:title|text|content).*(?:overflow|wrap)",
        ],
    },
    "workflow_preflight": {
        "rule": "Validate permissions and prerequisites before irreversible workflow mutations.",
        "patterns": [
            r"\bpreflight\b", r"before any .*mutation", r"permission.*(?:too|so) late",
            r"fail.*late", r"before .*version[- ]bump", r"before .*push",
        ],
    },
    "workflow_recovery": {
        "rule": "Design release/build workflows for concurrency, partial completion, and idempotent recovery.",
        "patterns": [
            r"half[- ]completed", r"partial(?:ly)? (?:complete|publish)", r"resume from",
            r"recovery", r"concurren", r"cancel-in-progress", r"idempoten",
        ],
    },
    "cache_tool_versions": {
        "rule": "Cache keys must include tool versions that affect generated dependency/build state.",
        "patterns": [
            r"cache key", r"cache hit", r"restore.*(?:npm|node|tool).*version",
            r"tree produced by", r"floating npm",
        ],
    },
    "isolated_resolution": {
        "rule": "Exercise isolated dependency layouts and resolve modules from the package/config that owns them.",
        "patterns": [
            r"isolated (?:dependenc|layout|build)", r"transitive dep", r"hoist",
            r"resolve .* explicitly", r"resolve from this file", r"bare .* fails",
        ],
    },
    "tooltip_equivalent": {
        "rule": "Information available only in a tooltip needs an equivalent for screen-reader and keyboard users.",
        "patterns": [
            r"tooltip.*(?:screen reader|assistive|keyboard|focus)",
            r"screen reader.*tooltip", r"visuallyhidden", r"make .* focusable",
            r"information equivalent to the tooltip",
        ],
    },
    "shortcut_semantics": {
        "rule": "Keyboard shortcuts need aria-keyshortcuts; hide visual hints from AT and preserve LTR key order in RTL.",
        "patterns": [
            r"aria-keyshortcuts", r"visual(?:ly)? .*shortcut", r"shortcut.*assistive",
            r"shortcut.*rtl", r"dir=[\"']ltr", r"displayed shortcut",
        ],
    },
    "avoid_duplicate_announcements": {
        "rule": "Verify native accessibility announcements before adding wp.a11y.speak(), to avoid duplicate output.",
        "patterns": [
            r"screen reader.*(?:twice|duplicate)", r"duplicat.*screen reader",
            r"native api.*(?:communicat|announce)", r"speak.*present in the page twice",
        ],
    },
    "all_input_methods": {
        "rule": "Exercise equivalent pointer, keyboard, clear, and focus/blur paths for interactive controls.",
        "patterns": [
            r"pointer.*keyboard|keyboard.*pointer", r"backspac", r"select-all.*delete",
            r"clear (?:button|press|case)", r"arrow (?:up|down|left|right)",
            r"focus.*blur|blur.*focus", r"keyboard.*(?:case|path|change)",
        ],
    },
    "scss_module_compatibility": {
        "rule": "During SCSS-module migrations, preserve established public class names used by consumers.",
        "patterns": [
            r"preserve.*(?:public|legacy).*class", r"public .*class names",
            r"consumer.*class", r"module\.scss.*(?:legacy|compat)",
        ],
    },
    "runtime_type_boundaries": {
        "rule": "Narrow and validate external/runtime data before accessing union-specific fields.",
        "patterns": [
            r"typeof .*string", r"\bis_string\(", r"\bis_array\(",
            r"instanceof error", r"unexpected (?:shape|type)", r"type guard",
        ],
    },
    "user_facing_errors": {
        "rule": "Error messages should state the actual failure and recovery expectation in user-facing language.",
        "patterns": [
            r"error message.*(?:explicit|clear|human|accurate|actual)",
            r"human[- ]focused", r"notice string", r"recovery command",
            r"expected .*aligns.*automated tests",
        ],
    },
    "docs_match_latest_behavior": {
        "rule": "Keep PR descriptions, comments, and docs synchronized with the final behavior.",
        "patterns": [
            r"update the pr description", r"description to match the latest",
            r"comment.*not accurate", r"no longer accurate", r"docs?.*misleading",
            r"this says .* but", r"documentation.*actual",
        ],
    },
    "options_object_for_many_parameters": {
        "rule": "Prefer an options object once a function accumulates several optional parameters.",
        "patterns": [
            r"optional params?.*options object", r"options or config object",
            r"function signatures?.*hard to read", r"params?.*config object",
        ],
    },
    "icon_viewbox_exceptions": {
        "rule": "Treat 24×24 icon viewBox as the default, not an exceptionless invariant.",
        "patterns": [
            r"non-0 0 24 24", r"view[- ]?box.*intentional", r"viewbox.*exception",
        ],
    },
}


def main() -> int:
    records = [json.loads(line) for line in (ROOT / "corpus.jsonl").read_text().splitlines()]
    output = [
        "# Candidate rule evidence\n\n",
        "Counts are measured across every actionable pilot artifact. They indicate recurrence, not automatic validity.\n\n",
    ]
    machine: dict[str, Any] = {}
    for name, hypothesis in HYPOTHESES.items():
        patterns = [re.compile(item, re.IGNORECASE | re.DOTALL) for item in hypothesis["patterns"]]
        matches = [
            record for record in records if any(pattern.search(record["body"]) for pattern in patterns)
        ]
        prs = {record["pr_number"] for record in matches}
        authors = {record["author"] for record in matches}
        machine[name] = {
            "rule": hypothesis["rule"],
            "artifacts": len(matches),
            "prs": len(prs),
            "authors": len(authors),
            "evidence_ids": [record["id"] for record in matches],
        }
        output.extend(
            [
                f"## {name}\n\n",
                f"**Hypothesis:** {hypothesis['rule']}\n\n",
                f"Support: {len(matches)} artifacts, {len(prs)} PRs, {len(authors)} reviewers.\n\n",
            ]
        )
        selected: list[dict[str, Any]] = []
        seen_prs: set[int] = set()
        reviewer_counts: collections.Counter[str] = collections.Counter()
        for record in sorted(matches, key=lambda item: len(item["body"]), reverse=True):
            if record["pr_number"] in seen_prs or reviewer_counts[record["author"]] >= 2:
                continue
            selected.append(record)
            seen_prs.add(record["pr_number"])
            reviewer_counts[record["author"]] += 1
            if len(selected) == 10:
                break
        for record in selected:
            body = re.sub(r"\s+", " ", record["body"]).strip()
            if len(body) > 1000:
                body = body[:999] + "…"
            output.append(
                f"- [#{record['pr_number']}]({record['url']}) {record['author']}: {body}\n"
            )
        output.append("\n")
    (ROOT / "candidate-evidence.md").write_text("".join(output), encoding="utf-8")
    (ROOT / "candidate-counts.json").write_text(
        json.dumps(machine, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(machine, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
