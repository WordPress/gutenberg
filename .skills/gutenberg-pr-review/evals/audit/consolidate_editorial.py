#!/usr/bin/env python3
"""Materialize editorial candidates and build evidence-preserving cross-batch plans."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import build_editorial
import reduce_clusters


def load_unique(path: Path, key: str) -> dict[str, dict[str, Any]]:
    rows = list(reduce_clusters.jsonl(path))
    result = {row[key]: row for row in rows}
    if len(result) != len(rows):
        raise ValueError(f"{path}: duplicate {key}")
    return result


def materialize(
    source: Path,
    results: Path,
    findings_path: Path,
    output: Path,
    generation: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    children = load_unique(source / "cluster-ledger.jsonl", "cluster_id")
    findings = load_unique(findings_path, "finding_id")
    index = list(reduce_clusters.jsonl(source / "merge-index.jsonl"))
    expected_by_result = {
        Path(row["batch"]).with_suffix(".json").name: row["finding_ids"]
        for row in index
    }
    result_paths = sorted(results.glob("merge-s*-*.json"))
    if {path.name for path in result_paths} != set(expected_by_result):
        missing = sorted(set(expected_by_result) - {path.name for path in result_paths})
        extra = sorted({path.name for path in result_paths} - set(expected_by_result))
        raise ValueError(f"result partition mismatch; missing={missing[:5]}, extra={extra[:5]}")

    candidates: list[dict[str, Any]] = []
    rejections: list[dict[str, Any]] = []
    covered_children: set[str] = set()
    generated_ids: set[str] = set()
    for path in result_paths:
        payload = json.loads(path.read_text(encoding="utf-8"))
        decisions = payload["decisions"]
        expected = expected_by_result[path.name]
        decision_ids = [row["cluster_id"] for row in decisions]
        if decision_ids != expected:
            raise ValueError(f"{path}: decisions differ from indexed order")
        if covered_children.intersection(decision_ids):
            raise ValueError(f"{path}: duplicate source decisions")
        covered_children.update(decision_ids)
        decisions_by_id = {row["cluster_id"]: row for row in decisions}

        advanced: list[str] = []
        for decision in decisions:
            child = children.get(decision["cluster_id"])
            if child is None:
                raise ValueError(f"{path}: foreign child {decision['cluster_id']}")
            if decision["action"] == "advance":
                advanced.append(decision["cluster_id"])
            else:
                rejections.append(
                    {
                        "generation": generation,
                        "source": path.name,
                        "cluster_id": decision["cluster_id"],
                        "action": decision["action"],
                        "reason": decision["reason"],
                        "canonical_rule": child["canonical_rule"],
                        "domain": child["domain"],
                        "evidence_ids": child["evidence_ids"],
                        "support_count": child["support_count"],
                        "distinct_prs": child["distinct_prs"],
                        "distinct_reviewers": child["distinct_reviewers"],
                        "state_counts": child["state_counts"],
                    }
                )

        declared = [
            member
            for candidate in payload["candidates"]
            for member in candidate["member_ids"]
        ]
        if len(declared) != len(set(declared)) or set(declared) != set(advanced):
            raise ValueError(f"{path}: candidates do not partition advances")
        for candidate in payload["candidates"]:
            direct_ids = candidate["member_ids"]
            for member in direct_ids:
                decision = decisions_by_id[member]
                if decision["candidate"] != candidate["local_id"]:
                    raise ValueError(f"{path}: decision/candidate mismatch for {member}")
            evidence_ids = [
                evidence_id
                for member in direct_ids
                for evidence_id in children[member]["evidence_ids"]
            ]
            if len(evidence_ids) != len(set(evidence_ids)):
                raise ValueError(f"{path}: overlapping evidence in candidate")
            cluster_id = reduce_clusters.stable_id(
                generation, path.name, candidate["local_id"], direct_ids
            )
            if cluster_id in generated_ids:
                raise ValueError(f"stable ID collision {cluster_id}")
            generated_ids.add(cluster_id)
            prs = {findings[value]["pr_number"] for value in evidence_ids}
            reviewers = {findings[value]["reviewer"] for value in evidence_ids}
            states = Counter(findings[value]["pr_state"] for value in evidence_ids)
            candidates.append(
                {
                    "cluster_id": cluster_id,
                    "stage": generation,
                    "source": path.name,
                    "local_id": candidate["local_id"],
                    "domain": candidate["domain"],
                    "topic_slug": candidate["topic_slug"],
                    "canonical_rule": candidate["canonical_rule"],
                    "severity": candidate["severity"],
                    "needs_current_validation": candidate["needs_current_validation"],
                    "merge_basis": candidate["merge_basis"],
                    "direct_member_ids": direct_ids,
                    "evidence_ids": evidence_ids,
                    "support_count": len(evidence_ids),
                    "distinct_prs": len(prs),
                    "distinct_reviewers": len(reviewers),
                    "state_counts": dict(states),
                }
            )

    if covered_children != set(children):
        raise ValueError(
            f"editorial results do not partition source: "
            f"{len(covered_children)} != {len(children)}"
        )
    selected_evidence = [
        evidence for candidate in candidates for evidence in candidate["evidence_ids"]
    ]
    rejected_evidence = [
        evidence for rejection in rejections for evidence in rejection["evidence_ids"]
    ]
    if set(selected_evidence).intersection(rejected_evidence):
        raise ValueError("selected and rejected evidence overlap")
    if len(selected_evidence) != len(set(selected_evidence)):
        raise ValueError("selected candidate evidence overlaps")
    if len(rejected_evidence) != len(set(rejected_evidence)):
        raise ValueError("rejected candidate evidence overlaps")
    source_evidence = [
        evidence for child in children.values() for evidence in child["evidence_ids"]
    ]
    if set(source_evidence) != set(selected_evidence).union(rejected_evidence):
        raise ValueError("editorial disposition does not preserve evidence closure")

    output.mkdir(parents=True, exist_ok=True)
    reduce_clusters.write_jsonl(output / "cluster-ledger.jsonl", candidates)
    reduce_clusters.write_jsonl(output / "rejection-ledger.jsonl", rejections)
    summary = {
        "generation": generation,
        "source": str(source.resolve()),
        "results": str(results.resolve()),
        "source_cluster_count": len(children),
        "candidate_count": len(candidates),
        "rejection_count": len(rejections),
        "selected_evidence_count": len(selected_evidence),
        "rejected_evidence_count": len(rejected_evidence),
        "rejection_actions": dict(Counter(row["action"] for row in rejections)),
        "candidate_ledger_sha256": reduce_clusters.sha256(
            output / "cluster-ledger.jsonl"
        ),
        "rejection_ledger_sha256": reduce_clusters.sha256(
            output / "rejection-ledger.jsonl"
        ),
    }
    return candidates, rejections, summary


def build_plan(
    nodes: list[dict[str, Any]],
    output: Path,
    batch_stage: int,
    max_clusters: int,
    max_chars: int,
    max_candidates: int,
) -> dict[str, Any]:
    keys = reduce_clusters.grouping_keys(nodes)
    buckets: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        buckets[(node["domain"], keys[node["cluster_id"]])].append(node)
    by_domain: dict[str, list[tuple[str, list[dict[str, Any]]]]] = defaultdict(list)
    for (domain, bucket), bucket_nodes in buckets.items():
        by_domain[domain].append((bucket, bucket_nodes))

    batches_dir = output / "batches"
    batches_dir.mkdir(exist_ok=True)
    schema = build_editorial.schema()
    schema["properties"]["candidates"]["maxItems"] = max_candidates
    reduce_clusters.write_json(output / "editorial-output.schema.json", schema)
    index: list[dict[str, Any]] = []
    domain_numbers: Counter[str] = Counter()

    def flush(domain: str, pending: list[dict[str, Any]], labels: list[str]) -> None:
        domain_numbers[domain] += 1
        name = f"merge-s{batch_stage}-{domain}-{domain_numbers[domain]:04d}.md"
        label = (
            labels[0]
            if len(set(labels)) == 1
            else f"mixed:{labels[0]}..{labels[-1]}"
        )
        path = batches_dir / name
        path.write_text(
            reduce_clusters.render_batch(name, domain, label, pending),
            encoding="utf-8",
        )
        index.append(
            {
                "batch": name,
                "stage": batch_stage,
                "domain": domain,
                "bucket": label,
                "finding_count": len(pending),
                "finding_ids": [node["cluster_id"] for node in pending],
                "sha256": reduce_clusters.sha256(path),
            }
        )

    for domain, domain_buckets in sorted(by_domain.items()):
        pending: list[dict[str, Any]] = []
        labels: list[str] = []
        pending_chars = 0
        for bucket, bucket_nodes in sorted(domain_buckets):
            for node in bucket_nodes:
                prompt_row = {
                    key: node[key]
                    for key in (
                        "cluster_id",
                        "topic_slug",
                        "canonical_rule",
                        "severity",
                        "needs_current_validation",
                        "support_count",
                        "distinct_prs",
                        "distinct_reviewers",
                        "state_counts",
                    )
                }
                row_chars = len(json.dumps(prompt_row, ensure_ascii=False))
                if pending and (
                    len(pending) >= max_clusters
                    or pending_chars + row_chars > max_chars
                ):
                    flush(domain, pending, labels)
                    pending, labels, pending_chars = [], [], 0
                pending.append(node)
                labels.append(bucket)
                pending_chars += row_chars
        if pending:
            flush(domain, pending, labels)

    reduce_clusters.write_jsonl(output / "merge-index.jsonl", index)
    return {
        "batch_stage": batch_stage,
        "batch_count": len(index),
        "bucket_count": len(buckets),
        "max_clusters": max_clusters,
        "max_chars": max_chars,
        "max_candidates": max_candidates,
        "index_sha256": reduce_clusters.sha256(output / "merge-index.jsonl"),
        "schema_sha256": reduce_clusters.sha256(
            output / "editorial-output.schema.json"
        ),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--results", type=Path, required=True)
    parser.add_argument("--finding-ledger", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--generation", type=int, required=True)
    parser.add_argument("--batch-stage", type=int, required=True)
    parser.add_argument("--max-clusters", type=int, default=75)
    parser.add_argument("--max-chars", type=int, default=28_000)
    parser.add_argument("--max-candidates", type=int, default=8)
    args = parser.parse_args()
    output = args.output.resolve()
    candidates, _, summary = materialize(
        args.source.resolve(),
        args.results.resolve(),
        args.finding_ledger.resolve(),
        output,
        args.generation,
    )
    summary.update(
        build_plan(
            candidates,
            output,
            args.batch_stage,
            args.max_clusters,
            args.max_chars,
            args.max_candidates,
        )
    )
    reduce_clusters.write_json(output / "manifest.json", summary)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
