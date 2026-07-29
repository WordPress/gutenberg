#!/usr/bin/env python3
"""Build and validate evidence-preserving first-stage finding-reduction batches."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any, Iterable


DOMAINS = (
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
)

DOMAIN_TERMS = {
    "accessibility": (
        "accessibility",
        "a11y",
        "aria",
        "screen reader",
        "accessible name",
        "keyboard",
        "focus management",
        "live region",
        "announcement",
        "semantic html",
        "target size",
        "contrast",
    ),
    "internationalization": (
        "internationalization",
        "localization",
        "i18n",
        "l10n",
        "translatable",
        "translator",
        "translation",
        "locale",
        "rtl",
        "plural",
        "date format",
        "number format",
    ),
    "security-privacy": (
        "security",
        "privacy",
        "authorization",
        "nonce",
        "capability",
        "csrf",
        "xss",
        "injection",
        "secret",
        "permission callback",
        "sanitize",
        "untrusted input",
        "output escaping",
    ),
    "performance": (
        "performance",
        "cache",
        "memoization",
        "latency",
        "memory",
        "bundle size",
        "scalability",
        "benchmark",
        "query count",
        "render performance",
    ),
    "testing-tooling": (
        "test",
        "testing",
        "coverage",
        "regression",
        "e2e",
        "integration",
        "fixture",
        "snapshot",
        "mock",
        "jest",
        "playwright",
        "puppeteer",
        "phpunit",
        "storybook",
        "ci verification",
        "test reliability",
        "test isolation",
        "lint",
        "build tooling",
        "toolchain",
        "workflow",
        "github action",
        "continuous integration",
    ),
    "documentation-release": (
        "documentation",
        "docs",
        "changelog",
        "readme",
        "since annotation",
        "@since",
        "release note",
        "migration note",
        "backport",
        "example",
        "code comment",
        "terminology",
    ),
    "api-compatibility": (
        "api",
        "compatibility",
        "backward compatibility",
        "public api",
        "private api",
        "experimental",
        "extensibility",
        "deprecation",
        "contract",
        "browser compatibility",
        "plugin compatibility",
        "rest api",
        "component api",
        "api naming",
    ),
    "blocks-content": (
        "block",
        "block attribute",
        "block support",
        "block context",
        "block transform",
        "serialization",
        "serialized",
        "saved markup",
        "content preservation",
        "editor frontend",
        "editor-frontend",
        "theme json",
        "theme.json",
        "pattern",
        "template",
        "parser",
    ),
    "state-data-runtime": (
        "state management",
        "state synchronization",
        "state lifecycle",
        "data model",
        "selector",
        "action",
        "dispatch",
        "store",
        "core data",
        "core-data",
        "entity",
        "persistence",
        "save",
        "undo",
        "async",
        "race",
        "lifecycle",
        "effect",
        "event handling",
        "error handling",
        "runtime correctness",
        "input validation",
    ),
    "interaction-ux": (
        "interaction",
        "usability",
        "user experience",
        "workflow",
        "navigation",
        "feedback",
        "discoverability",
        "affordance",
        "empty state",
        "loading state",
        "control",
        "modal",
        "popover",
        "tooltip",
    ),
    "visual-styles-theme": (
        "css",
        "scss",
        "visual",
        "layout",
        "responsive",
        "design token",
        "theme compatibility",
        "specificity",
        "cascade",
        "style",
        "color",
        "spacing",
    ),
    "architecture-code-quality": (
        "architecture",
        "maintainability",
        "package layering",
        "package architecture",
        "dependency management",
        "component architecture",
        "component responsibility",
        "component reuse",
        "code clarity",
        "type safety",
        "typescript",
        "dead code",
        "duplication",
        "change scope",
        "naming",
        "separation of concerns",
    ),
}


def json_files(path: Path) -> list[Path]:
    files = sorted(path.glob("batch-*.json"))
    if not files:
        raise ValueError(f"no audit result files in {path}")
    return files


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def compact(value: str) -> str:
    return " ".join(value.split())


def route(record: dict[str, Any]) -> str:
    fields = (
        (str(record.get("category", "")).lower(), 8),
        (str(record.get("proposed_rule", "")).lower(), 3),
        (str(record.get("rationale", "")).lower(), 1),
    )
    scores = {}
    for domain, terms in DOMAIN_TERMS.items():
        scores[domain] = sum(
            weight * sum(term in text for term in terms) for text, weight in fields
        )
    best = max(scores, key=lambda domain: scores[domain])
    return best if scores[best] else "architecture-code-quality"


def iter_findings(results: Path) -> Iterable[dict[str, Any]]:
    sequence = 0
    seen: set[str] = set()
    for path in json_files(results):
        payload = json.loads(path.read_text(encoding="utf-8"))
        rows = payload.get("results")
        if not isinstance(rows, list):
            raise ValueError(f"{path}: invalid results")
        for record in rows:
            if record.get("assessment") != "finding":
                continue
            artifact_id = record.get("artifact_id")
            if not isinstance(artifact_id, str) or artifact_id in seen:
                raise ValueError(f"{path}: invalid or duplicate finding artifact ID")
            seen.add(artifact_id)
            sequence += 1
            yield {
                "finding_id": f"F{sequence:06d}",
                "artifact_id": artifact_id,
                "source_batch": path.name,
                "pr_number": record["pr_number"],
                "pr_state": record["pr_state"],
                "reviewer": record["reviewer"],
                "url": record["url"],
                "kind": record["kind"],
                "source_category": compact(record["category"]),
                "severity": record["severity"],
                "proposed_rule": compact(record["proposed_rule"]),
                "rationale": compact(record["rationale"]),
                "current_validation_needed": record["current_validation_needed"],
                "routed_domain": route(record),
            }


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")


def worker_schema() -> dict[str, Any]:
    cluster = {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "local_id",
            "domain",
            "topic_slug",
            "canonical_rule",
            "severity",
            "needs_current_validation",
            "member_ids",
            "merge_basis",
        ],
        "properties": {
            "local_id": {"type": "string", "pattern": "^C[0-9]{2}$"},
            "domain": {"type": "string", "enum": list(DOMAINS)},
            "topic_slug": {
                "type": "string",
                "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
                "maxLength": 80,
            },
            "canonical_rule": {"type": "string", "minLength": 1, "maxLength": 360},
            "severity": {
                "type": "string",
                "enum": ["critical", "high", "medium", "low", "info"],
            },
            "needs_current_validation": {"type": "boolean"},
            "member_ids": {
                "type": "array",
                "minItems": 1,
                "items": {"type": "string", "pattern": "^F[0-9]{6}$"},
            },
            "merge_basis": {"type": "string", "minLength": 1, "maxLength": 600},
        },
    }
    unresolved = {
        "type": "object",
        "additionalProperties": False,
        "required": ["member_id", "reason"],
        "properties": {
            "member_id": {"type": "string", "pattern": "^F[0-9]{6}$"},
            "reason": {
                "type": "string",
                "enum": ["needs-raw-body", "needs-pr-diff", "ambiguous-meaning"],
            },
        },
    }
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["clusters", "unresolved"],
        "properties": {
            "clusters": {"type": "array", "maxItems": 60, "items": cluster},
            "unresolved": {"type": "array", "items": unresolved},
        },
    }


def render_batch(name: str, domain: str, rows: list[dict[str, Any]]) -> str:
    prompt_rows = [
        {
            "finding_id": row["finding_id"],
            "pr_number": row["pr_number"],
            "pr_state": row["pr_state"],
            "reviewer": row["reviewer"],
            "source_category": row["source_category"],
            "severity": row["severity"],
            "proposed_rule": row["proposed_rule"],
            "rationale": row["rationale"],
        }
        for row in rows
    ]
    lines = [
        f"# Reduction batch {name}",
        "",
        f"Primary routed domain: `{domain}`",
        f"Finding count: {len(rows)}",
        "",
        "The findings follow as JSON Lines:",
        "",
    ]
    lines.extend(json.dumps(row, ensure_ascii=False) for row in prompt_rows)
    lines.append("")
    return "\n".join(lines)


def build(
    results: Path, output: Path, max_findings: int, max_chars: int
) -> dict[str, Any]:
    rows = list(iter_findings(results))
    if len(rows) != 133_803:
        raise ValueError(f"expected 133803 findings, found {len(rows)}")
    output.mkdir(parents=True, exist_ok=True)
    batches_dir = output / "batches"
    batches_dir.mkdir(exist_ok=True)
    write_jsonl(output / "finding-ledger.jsonl", rows)
    write_json(output / "stage1-output.schema.json", worker_schema())

    grouped: dict[str, list[dict[str, Any]]] = {domain: [] for domain in DOMAINS}
    for row in rows:
        grouped[row["routed_domain"]].append(row)

    index: list[dict[str, Any]] = []
    for domain in DOMAINS:
        pending: list[dict[str, Any]] = []
        pending_chars = 0
        number = 0
        for row in grouped[domain]:
            row_chars = len(
                json.dumps(
                    {
                        key: row[key]
                        for key in (
                            "finding_id",
                            "pr_number",
                            "pr_state",
                            "reviewer",
                            "source_category",
                            "severity",
                            "proposed_rule",
                            "rationale",
                        )
                    },
                    ensure_ascii=False,
                )
            )
            if pending and (
                len(pending) >= max_findings or pending_chars + row_chars > max_chars
            ):
                number += 1
                name = f"reduce-{domain}-{number:04d}.md"
                path = batches_dir / name
                path.write_text(render_batch(name, domain, pending), encoding="utf-8")
                index.append(
                    {
                        "batch": name,
                        "domain": domain,
                        "finding_count": len(pending),
                        "finding_ids": [item["finding_id"] for item in pending],
                        "sha256": sha256(path),
                    }
                )
                pending = []
                pending_chars = 0
            pending.append(row)
            pending_chars += row_chars
        if pending:
            number += 1
            name = f"reduce-{domain}-{number:04d}.md"
            path = batches_dir / name
            path.write_text(render_batch(name, domain, pending), encoding="utf-8")
            index.append(
                {
                    "batch": name,
                    "domain": domain,
                    "finding_count": len(pending),
                    "finding_ids": [item["finding_id"] for item in pending],
                    "sha256": sha256(path),
                }
            )

    write_jsonl(output / "stage1-index.jsonl", index)
    manifest = {
        "source": str(results.resolve()),
        "source_file_count": len(json_files(results)),
        "finding_count": len(rows),
        "domain_counts": dict(Counter(row["routed_domain"] for row in rows)),
        "batch_count": len(index),
        "max_findings": max_findings,
        "max_chars": max_chars,
        "schema_sha256": sha256(output / "stage1-output.schema.json"),
    }
    write_json(output / "manifest.json", manifest)
    return manifest


def jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number}: expected object")
            yield value


def validate(output: Path) -> dict[str, Any]:
    ledger = list(jsonl(output / "finding-ledger.jsonl"))
    index = list(jsonl(output / "stage1-index.jsonl"))
    ids = [row["finding_id"] for row in ledger]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate finding IDs")
    indexed = [finding_id for batch in index for finding_id in batch["finding_ids"]]
    if set(indexed) != set(ids) or len(indexed) != len(ids):
        raise ValueError("batch index coverage differs from finding ledger")
    for batch in index:
        path = output / "batches" / batch["batch"]
        if sha256(path) != batch["sha256"]:
            raise ValueError(f"{path}: checksum mismatch")
        if batch["finding_count"] != len(batch["finding_ids"]):
            raise ValueError(f"{path}: finding count mismatch")
    return {
        "finding_count": len(ledger),
        "batch_count": len(index),
        "domains": dict(Counter(row["routed_domain"] for row in ledger)),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    build_parser = sub.add_parser("build")
    build_parser.add_argument("--results", type=Path, required=True)
    build_parser.add_argument("--output", type=Path, required=True)
    build_parser.add_argument("--max-findings", type=int, default=60)
    build_parser.add_argument("--max-chars", type=int, default=28_000)
    validate_parser = sub.add_parser("validate")
    validate_parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "build":
        result = build(
            args.results.resolve(),
            args.output.resolve(),
            args.max_findings,
            args.max_chars,
        )
    else:
        result = validate(args.output.resolve())
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
