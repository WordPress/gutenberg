#!/usr/bin/env python3
"""Build current-origin/trunk validation batches for the final rule shortlist."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

import reduce_clusters


def schema(origin_sha: str) -> dict:
    evidence = {
        "type": "object",
        "additionalProperties": False,
        "required": ["path", "line_start", "line_end", "explanation"],
        "properties": {
            "path": {"type": "string", "minLength": 1, "maxLength": 300},
            "line_start": {"type": "integer", "minimum": 1},
            "line_end": {"type": "integer", "minimum": 1},
            "explanation": {"type": "string", "minLength": 1, "maxLength": 500},
        },
    }
    decision = {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "cluster_id",
            "disposition",
            "validated_rule",
            "evidence",
            "rationale",
        ],
        "properties": {
            "cluster_id": {"type": "string", "pattern": "^K[0-9a-f]{16}$"},
            "disposition": {
                "type": "string",
                "enum": ["supported", "revised", "obsolete", "insufficient-context"],
            },
            "validated_rule": {"type": "string", "maxLength": 500},
            "evidence": {"type": "array", "maxItems": 6, "items": evidence},
            "rationale": {"type": "string", "minLength": 1, "maxLength": 1000},
        },
    }
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["origin_sha", "decisions"],
        "properties": {
            "origin_sha": {"type": "string", "const": origin_sha},
            "decisions": {"type": "array", "items": decision},
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shortlist", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--origin-sha", required=True)
    args = parser.parse_args()
    shortlist = args.shortlist.resolve()
    output = args.output.resolve()
    nodes = list(reduce_clusters.jsonl(shortlist / "cluster-ledger.jsonl"))
    ids = [node["cluster_id"] for node in nodes]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate shortlist cluster IDs")
    by_domain: dict[str, list[dict]] = defaultdict(list)
    for node in nodes:
        by_domain[node["domain"]].append(node)

    output.mkdir(parents=True, exist_ok=True)
    batches = output / "batches"
    batches.mkdir(exist_ok=True)
    reduce_clusters.write_json(output / "validation-output.schema.json", schema(args.origin_sha))
    index = []
    for number, (domain, domain_nodes) in enumerate(sorted(by_domain.items()), 1):
        name = f"validate-{number:02d}-{domain}.md"
        path = batches / name
        lines = [
            f"# Current-trunk validation: {domain}",
            "",
            f"Pinned origin/trunk commit: `{args.origin_sha}`",
            f"Candidate count: {len(domain_nodes)}",
            "",
            "Candidates follow as JSON Lines:",
            "",
        ]
        for node in domain_nodes:
            lines.append(
                json.dumps(
                    {
                        "cluster_id": node["cluster_id"],
                        "canonical_rule": node["canonical_rule"],
                        "topic_slug": node["topic_slug"],
                        "severity": node["severity"],
                        "support_count": node["support_count"],
                        "distinct_prs": node["distinct_prs"],
                        "distinct_reviewers": node["distinct_reviewers"],
                        "state_counts": node["state_counts"],
                    },
                    ensure_ascii=False,
                )
            )
        lines.append("")
        path.write_text("\n".join(lines), encoding="utf-8")
        index.append(
            {
                "batch": name,
                "domain": domain,
                "candidate_count": len(domain_nodes),
                "candidate_ids": [node["cluster_id"] for node in domain_nodes],
                "sha256": reduce_clusters.sha256(path),
            }
        )
    reduce_clusters.write_jsonl(output / "validation-index.jsonl", index)
    manifest = {
        "origin_sha": args.origin_sha,
        "candidate_count": len(nodes),
        "batch_count": len(index),
        "domain_counts": dict(Counter(node["domain"] for node in nodes)),
        "shortlist_ledger_sha256": reduce_clusters.sha256(
            shortlist / "cluster-ledger.jsonl"
        ),
        "index_sha256": reduce_clusters.sha256(output / "validation-index.jsonl"),
        "schema_sha256": reduce_clusters.sha256(
            output / "validation-output.schema.json"
        ),
    }
    reduce_clusters.write_json(output / "manifest.json", manifest)
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
