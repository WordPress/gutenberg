#!/usr/bin/env python3
"""Build and validate evidence-preserving recursive cluster-merge batches."""

from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Iterable

import reduce_findings


CLUSTER_ID = re.compile(r"^K[0-9a-f]{16}$")
TOKEN = re.compile(r"[a-z0-9]+")
STOPWORDS = {
    "a",
    "all",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "avoid",
    "be",
    "before",
    "by",
    "check",
    "correct",
    "do",
    "each",
    "ensure",
    "every",
    "for",
    "from",
    "has",
    "have",
    "in",
    "instead",
    "into",
    "is",
    "it",
    "keep",
    "make",
    "new",
    "no",
    "not",
    "of",
    "on",
    "only",
    "or",
    "preserve",
    "prefer",
    "provide",
    "require",
    "review",
    "should",
    "that",
    "the",
    "their",
    "through",
    "to",
    "use",
    "used",
    "using",
    "verify",
    "when",
    "where",
    "with",
    "without",
}
ALIASES = {
    "accessible": "accessibility",
    "a11y": "accessibility",
    "apis": "api",
    "backwards": "backward",
    "compat": "compatibility",
    "compatible": "compatibility",
    "components": "component",
    "dependencies": "dependency",
    "docs": "documentation",
    "effects": "effect",
    "hooks": "hook",
    "internationalisation": "internationalization",
    "localisation": "localization",
    "props": "prop",
    "selectors": "selector",
    "styles": "style",
    "tests": "test",
    "workflows": "workflow",
}


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def stable_id(stage: int, source: str, local_id: str, members: list[str]) -> str:
    value = {
        "stage": stage,
        "source": source,
        "local_id": local_id,
        "members": members,
    }
    return "K" + hashlib.sha256(canonical_json(value)).hexdigest()[:16]


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def jsonl(path: Path) -> Iterable[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, 1):
            if not line.strip():
                continue
            value = json.loads(line)
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number}: expected object")
            yield value


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


def stem(token: str) -> str:
    token = ALIASES.get(token, token)
    if len(token) > 6 and token.endswith("ies"):
        token = token[:-3] + "y"
    elif len(token) > 6 and token.endswith("ing"):
        token = token[:-3]
    elif len(token) > 5 and token.endswith("ed"):
        token = token[:-2]
    elif len(token) > 5 and token.endswith("s") and not token.endswith("ss"):
        token = token[:-1]
    return ALIASES.get(token, token)


def tokens(node: dict[str, Any]) -> tuple[str, ...]:
    text = f"{node['topic_slug']} {node['canonical_rule']}".lower()
    values = {
        stem(value)
        for value in TOKEN.findall(text)
        if value not in STOPWORDS and len(value) > 1
    }
    return tuple(sorted(value for value in values if value not in STOPWORDS))


def finding_authority(path: Path) -> dict[str, dict[str, Any]]:
    authority: dict[str, dict[str, Any]] = {}
    for row in jsonl(path):
        finding_id = row["finding_id"]
        if finding_id in authority:
            raise ValueError(f"duplicate finding {finding_id}")
        authority[finding_id] = row
    return authority


def load_stage1(
    results: Path, findings_path: Path
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    findings = finding_authority(findings_path)
    nodes: list[dict[str, Any]] = []
    ids: set[str] = set()
    covered: set[str] = set()
    for path in sorted(results.glob("reduce-*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("unresolved"):
            raise ValueError(f"{path}: unresolved stage-one members remain")
        for cluster in payload["clusters"]:
            evidence_ids = cluster["member_ids"]
            if any(value not in findings for value in evidence_ids):
                raise ValueError(f"{path}: foreign evidence ID")
            if covered.intersection(evidence_ids):
                raise ValueError(f"{path}: duplicate evidence coverage")
            covered.update(evidence_ids)
            cluster_id = stable_id(
                1, path.name, cluster["local_id"], evidence_ids
            )
            if cluster_id in ids:
                raise ValueError(f"stable ID collision {cluster_id}")
            ids.add(cluster_id)
            prs = {findings[value]["pr_number"] for value in evidence_ids}
            reviewers = {findings[value]["reviewer"] for value in evidence_ids}
            states = Counter(findings[value]["pr_state"] for value in evidence_ids)
            nodes.append(
                {
                    "cluster_id": cluster_id,
                    "stage": 1,
                    "source": path.name,
                    "local_id": cluster["local_id"],
                    "domain": cluster["domain"],
                    "topic_slug": cluster["topic_slug"],
                    "canonical_rule": cluster["canonical_rule"],
                    "severity": cluster["severity"],
                    "needs_current_validation": cluster[
                        "needs_current_validation"
                    ],
                    "merge_basis": cluster["merge_basis"],
                    "direct_member_ids": evidence_ids,
                    "evidence_ids": evidence_ids,
                    "support_count": len(evidence_ids),
                    "distinct_prs": len(prs),
                    "distinct_reviewers": len(reviewers),
                    "state_counts": dict(states),
                }
            )
    if covered != set(findings):
        raise ValueError(
            f"stage-one coverage mismatch: {len(covered)} != {len(findings)}"
        )
    return nodes, findings


def grouping_keys(nodes: list[dict[str, Any]]) -> dict[str, str]:
    """Choose a reproducible association-based lexical bucket per node."""
    by_domain: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        by_domain[node["domain"]].append(node)
    result: dict[str, str] = {}
    for domain, domain_nodes in by_domain.items():
        token_map = {node["cluster_id"]: tokens(node) for node in domain_nodes}
        document_frequency: Counter[str] = Counter()
        pair_frequency: Counter[tuple[str, str]] = Counter()
        for values in token_map.values():
            document_frequency.update(values)
            pair_frequency.update(itertools.combinations(values, 2))
        for node in domain_nodes:
            values = token_map[node["cluster_id"]]
            candidates = [
                pair
                for pair in itertools.combinations(values, 2)
                if pair_frequency[pair] >= 2
            ]
            if candidates:
                pair = max(
                    candidates,
                    key=lambda value: (
                        pair_frequency[value]
                        / math.sqrt(
                            document_frequency[value[0]]
                            * document_frequency[value[1]]
                        ),
                        pair_frequency[value],
                        value,
                    ),
                )
                key = "+".join(pair)
            else:
                repeated = [
                    value for value in values if document_frequency[value] >= 2
                ]
                if repeated:
                    value = min(
                        repeated,
                        key=lambda item: (document_frequency[item], item),
                    )
                    key = value
                else:
                    key = "long-tail"
            result[node["cluster_id"]] = f"{domain}:{key}"
    return result


def merge_schema() -> dict[str, Any]:
    schema = reduce_findings.worker_schema()
    cluster = schema["properties"]["clusters"]
    cluster["maxItems"] = 80
    cluster["items"]["properties"]["member_ids"]["items"]["pattern"] = (
        "^K[0-9a-f]{16}$"
    )
    schema["properties"]["unresolved"]["items"]["properties"]["member_id"][
        "pattern"
    ] = "^K[0-9a-f]{16}$"
    return schema


def render_batch(
    name: str, domain: str, bucket: str, nodes: list[dict[str, Any]]
) -> str:
    rows = [
        {
            "cluster_id": node["cluster_id"],
            "topic_slug": node["topic_slug"],
            "canonical_rule": node["canonical_rule"],
            "severity": node["severity"],
            "needs_current_validation": node["needs_current_validation"],
            "support_count": node["support_count"],
            "distinct_prs": node["distinct_prs"],
            "distinct_reviewers": node["distinct_reviewers"],
            "state_counts": node["state_counts"],
        }
        for node in nodes
    ]
    lines = [
        f"# Cluster merge batch {name}",
        "",
        f"Primary domain: `{domain}`",
        f"Lexical bucket: `{bucket}`",
        f"Input cluster count: {len(nodes)}",
        "",
        "The input microclusters follow as JSON Lines:",
        "",
    ]
    lines.extend(json.dumps(row, ensure_ascii=False) for row in rows)
    lines.append("")
    return "\n".join(lines)


def build_stage2(
    results: Path,
    findings: Path,
    output: Path,
    max_clusters: int,
    max_chars: int,
) -> dict[str, Any]:
    nodes, finding_rows = load_stage1(results, findings)
    keys = grouping_keys(nodes)
    output.mkdir(parents=True, exist_ok=True)
    batches_dir = output / "batches"
    batches_dir.mkdir(exist_ok=True)
    write_jsonl(output / "cluster-ledger.jsonl", nodes)
    write_json(output / "merge-output.schema.json", merge_schema())

    buckets: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        buckets[(node["domain"], keys[node["cluster_id"]])].append(node)

    index: list[dict[str, Any]] = []
    domain_numbers: Counter[str] = Counter()
    domain_buckets: dict[str, list[tuple[str, list[dict[str, Any]]]]] = (
        defaultdict(list)
    )
    for (domain, bucket), bucket_nodes in buckets.items():
        domain_buckets[domain].append((bucket, bucket_nodes))

    def flush(
        domain: str,
        pending: list[dict[str, Any]],
        labels: list[str],
    ) -> None:
        domain_numbers[domain] += 1
        name = f"merge-s2-{domain}-{domain_numbers[domain]:04d}.md"
        label = labels[0] if len(set(labels)) == 1 else (
            f"mixed:{labels[0]}..{labels[-1]}"
        )
        path = batches_dir / name
        path.write_text(
            render_batch(name, domain, label, pending), encoding="utf-8"
        )
        index.append(
            {
                "batch": name,
                "stage": 2,
                "domain": domain,
                "bucket": label,
                "finding_count": len(pending),
                "finding_ids": [item["cluster_id"] for item in pending],
                "sha256": sha256(path),
            }
        )

    for domain, ordered_buckets in sorted(domain_buckets.items()):
        pending: list[dict[str, Any]] = []
        pending_labels: list[str] = []
        pending_chars = 0
        for bucket, bucket_nodes in sorted(ordered_buckets):
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
                    flush(domain, pending, pending_labels)
                    pending = []
                    pending_labels = []
                    pending_chars = 0
                pending.append(node)
                pending_labels.append(bucket)
                pending_chars += row_chars
        if pending:
            flush(domain, pending, pending_labels)

    write_jsonl(output / "merge-index.jsonl", index)
    manifest = {
        "stage": 2,
        "source_results": str(results.resolve()),
        "source_findings": str(findings.resolve()),
        "source_cluster_count": len(nodes),
        "source_evidence_count": len(finding_rows),
        "batch_count": len(index),
        "bucket_count": len(buckets),
        "domain_counts": dict(Counter(node["domain"] for node in nodes)),
        "max_clusters": max_clusters,
        "max_chars": max_chars,
        "ledger_sha256": sha256(output / "cluster-ledger.jsonl"),
        "index_sha256": sha256(output / "merge-index.jsonl"),
        "schema_sha256": sha256(output / "merge-output.schema.json"),
    }
    write_json(output / "manifest.json", manifest)
    return manifest


def load_previous_stage(
    previous_plan: Path,
    previous_results: Path,
    findings_path: Path,
    source_stage: int,
) -> tuple[list[dict[str, Any]], dict[str, dict[str, Any]]]:
    findings = finding_authority(findings_path)
    children = {
        row["cluster_id"]: row
        for row in jsonl(previous_plan / "cluster-ledger.jsonl")
    }
    if len(children) != sum(
        1 for _ in jsonl(previous_plan / "cluster-ledger.jsonl")
    ):
        raise ValueError("duplicate previous-stage cluster IDs")
    nodes: list[dict[str, Any]] = []
    covered_children: set[str] = set()
    generated_ids: set[str] = set()
    for path in sorted(previous_results.glob(f"merge-s{source_stage}-*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("unresolved"):
            raise ValueError(f"{path}: unresolved previous-stage members remain")
        for cluster in payload["clusters"]:
            direct_ids = cluster["member_ids"]
            if any(value not in children for value in direct_ids):
                raise ValueError(f"{path}: foreign child cluster ID")
            if covered_children.intersection(direct_ids):
                raise ValueError(f"{path}: duplicate child coverage")
            covered_children.update(direct_ids)
            evidence_ids: list[str] = []
            for child_id in direct_ids:
                evidence_ids.extend(children[child_id]["evidence_ids"])
            if len(evidence_ids) != len(set(evidence_ids)):
                raise ValueError(f"{path}: child evidence closures overlap")
            cluster_id = stable_id(
                source_stage, path.name, cluster["local_id"], direct_ids
            )
            if cluster_id in generated_ids:
                raise ValueError(f"stable ID collision {cluster_id}")
            generated_ids.add(cluster_id)
            prs = {findings[value]["pr_number"] for value in evidence_ids}
            reviewers = {findings[value]["reviewer"] for value in evidence_ids}
            states = Counter(findings[value]["pr_state"] for value in evidence_ids)
            nodes.append(
                {
                    "cluster_id": cluster_id,
                    "stage": source_stage,
                    "source": path.name,
                    "local_id": cluster["local_id"],
                    "domain": cluster["domain"],
                    "topic_slug": cluster["topic_slug"],
                    "canonical_rule": cluster["canonical_rule"],
                    "severity": cluster["severity"],
                    "needs_current_validation": cluster[
                        "needs_current_validation"
                    ],
                    "merge_basis": cluster["merge_basis"],
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
            "previous results do not partition previous cluster ledger: "
            f"{len(covered_children)} != {len(children)}"
        )
    return nodes, findings


def build_recursive(
    previous_plan: Path,
    previous_results: Path,
    findings: Path,
    output: Path,
    stage: int,
    max_clusters: int,
    max_chars: int,
) -> dict[str, Any]:
    if stage < 3:
        raise ValueError("recursive stage must be at least 3")
    nodes, finding_rows = load_previous_stage(
        previous_plan, previous_results, findings, stage - 1
    )
    keys = grouping_keys(nodes)
    output.mkdir(parents=True, exist_ok=True)
    batches_dir = output / "batches"
    batches_dir.mkdir(exist_ok=True)
    write_jsonl(output / "cluster-ledger.jsonl", nodes)
    write_json(output / "merge-output.schema.json", merge_schema())

    buckets: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        buckets[(node["domain"], keys[node["cluster_id"]])].append(node)
    domain_buckets: dict[str, list[tuple[str, list[dict[str, Any]]]]] = (
        defaultdict(list)
    )
    for (domain, bucket), bucket_nodes in buckets.items():
        domain_buckets[domain].append((bucket, bucket_nodes))

    index: list[dict[str, Any]] = []
    domain_numbers: Counter[str] = Counter()

    def flush(
        domain: str,
        pending: list[dict[str, Any]],
        labels: list[str],
    ) -> None:
        domain_numbers[domain] += 1
        name = f"merge-s{stage}-{domain}-{domain_numbers[domain]:04d}.md"
        label = labels[0] if len(set(labels)) == 1 else (
            f"mixed:{labels[0]}..{labels[-1]}"
        )
        path = batches_dir / name
        path.write_text(
            render_batch(name, domain, label, pending), encoding="utf-8"
        )
        index.append(
            {
                "batch": name,
                "stage": stage,
                "domain": domain,
                "bucket": label,
                "finding_count": len(pending),
                "finding_ids": [item["cluster_id"] for item in pending],
                "sha256": sha256(path),
            }
        )

    for domain, ordered_buckets in sorted(domain_buckets.items()):
        pending: list[dict[str, Any]] = []
        labels: list[str] = []
        pending_chars = 0
        for bucket, bucket_nodes in sorted(ordered_buckets):
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
                    pending = []
                    labels = []
                    pending_chars = 0
                pending.append(node)
                labels.append(bucket)
                pending_chars += row_chars
        if pending:
            flush(domain, pending, labels)

    write_jsonl(output / "merge-index.jsonl", index)
    evidence = [value for node in nodes for value in node["evidence_ids"]]
    if len(evidence) != len(finding_rows) or len(set(evidence)) != len(finding_rows):
        raise ValueError("recursive source clusters do not partition evidence")
    manifest = {
        "stage": stage,
        "source_stage": stage - 1,
        "source_plan": str(previous_plan.resolve()),
        "source_results": str(previous_results.resolve()),
        "source_findings": str(findings.resolve()),
        "source_cluster_count": len(nodes),
        "source_evidence_count": len(finding_rows),
        "batch_count": len(index),
        "bucket_count": len(buckets),
        "domain_counts": dict(Counter(node["domain"] for node in nodes)),
        "max_clusters": max_clusters,
        "max_chars": max_chars,
        "ledger_sha256": sha256(output / "cluster-ledger.jsonl"),
        "index_sha256": sha256(output / "merge-index.jsonl"),
        "schema_sha256": sha256(output / "merge-output.schema.json"),
    }
    write_json(output / "manifest.json", manifest)
    return manifest


def validate(output: Path) -> dict[str, Any]:
    nodes = list(jsonl(output / "cluster-ledger.jsonl"))
    index = list(jsonl(output / "merge-index.jsonl"))
    node_ids = [node["cluster_id"] for node in nodes]
    if len(node_ids) != len(set(node_ids)):
        raise ValueError("duplicate cluster IDs")
    if not all(CLUSTER_ID.fullmatch(value) for value in node_ids):
        raise ValueError("invalid cluster ID")
    indexed = [value for batch in index for value in batch["finding_ids"]]
    if len(indexed) != len(set(indexed)) or set(indexed) != set(node_ids):
        raise ValueError("merge index does not partition the cluster ledger")
    evidence = [value for node in nodes for value in node["evidence_ids"]]
    if len(evidence) != 133_803 or len(set(evidence)) != 133_803:
        raise ValueError("cluster ledger does not partition source evidence")
    for batch in index:
        path = output / "batches" / batch["batch"]
        if sha256(path) != batch["sha256"]:
            raise ValueError(f"{path}: checksum mismatch")
        if batch["finding_count"] != len(batch["finding_ids"]):
            raise ValueError(f"{path}: member count mismatch")
    return {
        "cluster_count": len(nodes),
        "evidence_count": len(evidence),
        "batch_count": len(index),
        "bucket_count": len({batch["bucket"] for batch in index}),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    build = sub.add_parser("build-stage2")
    build.add_argument("--stage1-results", type=Path, required=True)
    build.add_argument("--finding-ledger", type=Path, required=True)
    build.add_argument("--output", type=Path, required=True)
    build.add_argument("--max-clusters", type=int, default=80)
    build.add_argument("--max-chars", type=int, default=28_000)
    recursive = sub.add_parser("build-recursive")
    recursive.add_argument("--previous-plan", type=Path, required=True)
    recursive.add_argument("--previous-results", type=Path, required=True)
    recursive.add_argument("--finding-ledger", type=Path, required=True)
    recursive.add_argument("--output", type=Path, required=True)
    recursive.add_argument("--stage", type=int, required=True)
    recursive.add_argument("--max-clusters", type=int, default=80)
    recursive.add_argument("--max-chars", type=int, default=28_000)
    validate_parser = sub.add_parser("validate")
    validate_parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.command == "build-stage2":
        result = build_stage2(
            args.stage1_results.resolve(),
            args.finding_ledger.resolve(),
            args.output.resolve(),
            args.max_clusters,
            args.max_chars,
        )
    elif args.command == "build-recursive":
        result = build_recursive(
            args.previous_plan.resolve(),
            args.previous_results.resolve(),
            args.finding_ledger.resolve(),
            args.output.resolve(),
            args.stage,
            args.max_clusters,
            args.max_chars,
        )
    else:
        result = validate(args.output.resolve())
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
