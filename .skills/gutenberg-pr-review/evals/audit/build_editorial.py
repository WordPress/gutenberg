#!/usr/bin/env python3
"""Prepare strict editorial-triage schema and validate its source plan."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import reduce_findings
from reduce_clusters import jsonl, sha256, write_json


def schema() -> dict:
    decision = {
        "type": "object",
        "additionalProperties": False,
        "required": ["cluster_id", "action", "candidate", "reason"],
        "properties": {
            "cluster_id": {"type": "string", "pattern": "^K[0-9a-f]{16}$"},
            "action": {
                "type": "string",
                "enum": [
                    "advance",
                    "reject-too-specific",
                    "reject-preference",
                    "reject-unsupported",
                    "reject-obsolete",
                    "reject-not-operational",
                ],
            },
            "candidate": {"type": "string", "pattern": "^(?:C[0-9]{2}|)$"},
            "reason": {"type": "string", "minLength": 1, "maxLength": 500},
        },
    }
    cluster = reduce_findings.worker_schema()["properties"]["clusters"]["items"]
    cluster = json.loads(json.dumps(cluster))
    cluster["required"] = [
        "local_id",
        "domain",
        "topic_slug",
        "canonical_rule",
        "severity",
        "needs_current_validation",
        "member_ids",
        "merge_basis",
    ]
    cluster["properties"]["member_ids"]["items"]["pattern"] = "^K[0-9a-f]{16}$"
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["decisions", "candidates"],
        "properties": {
            "decisions": {"type": "array", "items": decision},
            "candidates": {
                "type": "array",
                "maxItems": 25,
                "items": cluster,
            },
        },
    }


def prepare(source: Path) -> dict:
    ledger = list(jsonl(source / "cluster-ledger.jsonl"))
    index = list(jsonl(source / "merge-index.jsonl"))
    ids = {row["cluster_id"] for row in ledger}
    indexed = [value for batch in index for value in batch["finding_ids"]]
    if len(ids) != len(ledger) or len(indexed) != len(set(indexed)):
        raise ValueError("duplicate editorial-source IDs")
    if set(indexed) != ids:
        raise ValueError("editorial index does not partition source clusters")
    for batch in index:
        path = source / "batches" / batch["batch"]
        if sha256(path) != batch["sha256"]:
            raise ValueError(f"{path}: checksum mismatch")
    output = source / "editorial-output.schema.json"
    write_json(output, schema())
    result = {
        "source_cluster_count": len(ledger),
        "batch_count": len(index),
        "schema": str(output),
        "schema_sha256": sha256(output),
    }
    write_json(source / "editorial-manifest.json", result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(args.source.resolve()), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
