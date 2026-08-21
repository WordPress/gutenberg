#!/usr/bin/env python3
"""Create bounded, evidence-linked analysis inputs from the pilot database."""

from __future__ import annotations

import argparse
import collections
import hashlib
import json
import re
import shutil
import sqlite3
from pathlib import Path
from typing import Any, Iterable


ACTION_MARKERS = re.compile(
    r"\b(should|could|would|please|need(?:s|ed)?|must|consider|prefer|instead|"
    r"missing|incorrect|break|broken|fail|lost|race|regress|bug|issue|error|"
    r"why|what about|how about|can we|do we|is this|nit(?:pick)?|suggest|"
    r"non[- ]?block|blocker|follow[- ]?up|not sure|wonder|avoid|remove|add|"
    r"update|rename|test|document|a11y|accessib|focus|aria|type|token|cache|"
    r"permission|security|validate|sanitize|escape|deprecated|compatib)\b",
    re.IGNORECASE,
)

LOW_SIGNAL = re.compile(
    r"^(?:lgtm|looks good(?: to me)?|approved|ship it|nice|great|thanks!?|"
    r"thank you!?|tested and works|works for me|✅|👍)[.!\s🎉:+-]*$",
    re.IGNORECASE,
)

CATEGORY_PATTERNS: dict[str, tuple[str, ...]] = {
    "scope_simplicity": (
        r"\bscope\b", r"unrelated", r"separate pr", r"follow[- ]?up",
        r"overkill", r"simplif", r"inline this", r"single call",
        r"duplica", r"redundan", r"dead code",
    ),
    "changelog_documentation": (
        r"changelog", r"readme", r"document(?:ation|ed)?", r"docblock",
        r"phpdoc", r"jsdoc", r"pr link", r"comment (?:is|says)",
        r"description", r"example", r"wording", r"typo",
    ),
    "css_design_system": (
        r"\.s?css\b", r"stylesheet", r"class(?:name)?", r"selector",
        r"design token", r"--wpds-", r"base-styles", r"mixin", r"outline",
        r"focus ring", r"hardcoded", r"spacing", r"color", r"module\.scss",
    ),
    "state_lifecycle": (
        r"useeffect", r"usememo", r"usecallback", r"dependency array",
        r"stale", r"race", r"unmount", r"cleanup", r"deboun", r"pending",
        r"derived state", r"controlled", r"uncontrolled", r"onopenchange",
        r"callback ref", r"resizeobserver", r"lost", r"silently",
    ),
    "typescript_types": (
        r"typescript", r"\btype(?:s|d)?\b", r"interface", r"\bany\b",
        r"as const", r"literal", r"return type", r"type guard", r"is_string",
        r"is_array", r"instanceof", r"undefined", r"nullable?",
    ),
    "tests": (
        r"\btests?\b", r"coverage", r"regression", r"storybook", r"e2e",
        r"assert", r"expect\(", r"mock", r"fixture", r"timeout", r"flaky",
        r"implementation detail", r"happy path", r"edge case",
    ),
    "existing_utility_api": (
        r"existing", r"already (?:have|exists)", r"reuse", r"utility",
        r"helper", r"primitive", r"extend .*props", r"public api", r"private api",
        r"export", r"prop name", r"selector", r"action", r"component",
    ),
    "dependencies_build": (
        r"dependenc", r"package\.json", r"node_modules", r"isolated",
        r"hoist", r"resolve .*explicit", r"transitive", r"workspace",
        r"pnpm", r"npm", r"node\.js", r"webpack", r"storybook.*alias",
        r"import", r"require\(", r"build",
    ),
    "ci_release_tooling": (
        r"workflow", r"github action", r"release", r"permission", r"token",
        r"secret", r"cache key", r"cache hit", r"artifact", r"publish",
        r"cherry-pick", r"rollback", r"restore", r"fail fast", r"side effect",
    ),
    "accessibility": (
        r"accessib", r"\ba11y\b", r"screen reader", r"voiceover", r"nvda",
        r"\baria[-_]", r"focus", r"keyboard", r"tooltip", r"visuallyhidden",
        r"announcement", r"speak\(", r"semantic", r"role=", r"assistive",
        r"rtl", r"dir=", r"shortcut",
    ),
    "php_rest_security": (
        r"\bphp\b", r"rest api", r"validate_callback", r"sanitize",
        r"escape", r"nonce", r"capabilit", r"permission_callback",
        r"wp_html_tag_processor", r"wpdb", r"phpcs",
    ),
    "data_validation_errors": (
        r"validat", r"schema", r"data shape", r"malformed", r"corrupt",
        r"error handling", r"throw new error", r"console\.error", r"fallback",
        r"partial", r"atomic", r"rollback", r"unexpected", r"guard",
    ),
    "performance": (
        r"performance", r"expensive", r"memoiz", r"re-render", r"render cycle",
        r"layout thrash", r"query count", r"cache", r"batch", r"worker",
    ),
    "i18n": (
        r"i18n", r"translat", r"localiz", r"__\(", r"_n\(", r"_x\(",
        r"translator comment", r"locale",
    ),
    "compatibility_deprecation": (
        r"back(?:ward|wards)? compat", r"back compat", r"deprecated",
        r"deprecat", r"legacy", r"migration", r"backport", r"wordpress-\d",
        r"minimum required", r"consumer", r"third[- ]party",
    ),
    "icons": (
        r"\bicon\b", r"\bsvg\b", r"viewbox", r"currentcolor", r"path d=",
    ),
}

COMPILED_CATEGORIES = {
    name: [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    for name, patterns in CATEGORY_PATTERNS.items()
}

STOPWORDS = {
    "about", "after", "again", "also", "because", "been", "before", "being",
    "between", "both", "could", "does", "doing", "from", "have", "here",
    "into", "just", "like", "looks", "maybe", "more", "most", "need", "only",
    "other", "should", "some", "still", "than", "that", "their", "there",
    "these", "they", "think", "this", "those", "through", "using", "very",
    "want", "when", "where", "which", "while", "with", "would", "your",
    "suggested", "change", "diff", "gutenberg", "packages", "wordpress",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--db", type=Path, default=Path(__file__).with_name("reviews.sqlite")
    )
    parser.add_argument(
        "--output", type=Path, default=Path(__file__).with_name("analysis")
    )
    parser.add_argument("--batch-chars", type=int, default=40000)
    return parser.parse_args()


def actionable(row: sqlite3.Row) -> bool:
    body = row["body"].strip()
    if not body or row["is_bot"] or row["author"] == row["pr_author"]:
        return False
    compact = re.sub(r"\s+", " ", body)
    if LOW_SIGNAL.fullmatch(compact):
        return False
    if row["kind"] == "review_comment":
        return len(compact) >= 12
    if row["kind"] == "review" and row["state"] == "CHANGES_REQUESTED":
        return True
    return bool(ACTION_MARKERS.search(compact))


def categories(body: str) -> list[str]:
    found = [
        name
        for name, patterns in COMPILED_CATEGORIES.items()
        if any(pattern.search(body) for pattern in patterns)
    ]
    return found or ["unclassified"]


def tokens(body: str) -> list[str]:
    body = re.sub(r"https?://\S+|```.*?```", " ", body, flags=re.DOTALL)
    return [
        token
        for token in re.findall(r"[a-z][a-z0-9_-]{2,}", body.lower())
        if token not in STOPWORDS and not token.isdigit()
    ]


def ngrams(items: list[str], size: int) -> Iterable[tuple[str, ...]]:
    for index in range(len(items) - size + 1):
        gram = tuple(items[index : index + size])
        if len(set(gram)) > 1:
            yield gram


def compact_body(body: str, limit: int = 1200) -> str:
    compact = re.sub(r"\s+", " ", body).strip()
    return compact if len(compact) <= limit else compact[: limit - 1] + "…"


def diverse_samples(records: list[dict[str, Any]], limit: int = 12) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    authors: collections.Counter[str] = collections.Counter()
    prs: set[int] = set()
    ranked = sorted(
        records,
        key=lambda record: (
            record["state"] == "CHANGES_REQUESTED",
            record["kind"] == "review_comment",
            min(len(record["body"]), 3000),
        ),
        reverse=True,
    )
    for record in ranked:
        if authors[record["author"] or ""] >= 2 or record["pr_number"] in prs:
            continue
        selected.append(record)
        authors[record["author"] or ""] += 1
        prs.add(record["pr_number"])
        if len(selected) == limit:
            break
    return selected


def write_batches(records: list[dict[str, Any]], output: Path, limit: int) -> int:
    batches_dir = output / "batches"
    if batches_dir.exists():
        shutil.rmtree(batches_dir)
    batches_dir.mkdir(parents=True)
    batch: list[str] = []
    batch_size = 0
    batch_number = 1
    for record in records:
        text = (
            f"## PR #{record['pr_number']} — {record['title']}\n"
            f"- Artifact: {record['kind']} / {record['state'] or 'N/A'}\n"
            f"- Reviewer: {record['author']}\n"
            f"- Path: {record['path'] or 'general discussion'}\n"
            f"- URL: {record['url']}\n"
            f"- Seed categories: {', '.join(record['categories'])}\n\n"
            f"{record['body'].strip()}\n\n"
        )
        if batch and batch_size + len(text) > limit:
            (batches_dir / f"batch-{batch_number:03d}.md").write_text(
                "".join(batch), encoding="utf-8"
            )
            batch_number += 1
            batch = []
            batch_size = 0
        batch.append(text)
        batch_size += len(text)
    if batch:
        (batches_dir / f"batch-{batch_number:03d}.md").write_text(
            "".join(batch), encoding="utf-8"
        )
    return batch_number


def main() -> int:
    args = parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT a.*, p.title, p.author AS pr_author, p.created_at AS pr_created_at,
               p.merged_at, p.labels_json
        FROM artifacts a
        JOIN pull_requests p ON p.number = a.pr_number
        WHERE TRIM(a.body) != ''
        ORDER BY p.number DESC, a.created_at, a.id
        """
    ).fetchall()

    records: list[dict[str, Any]] = []
    for row in rows:
        if not actionable(row):
            continue
        body = row["body"].strip()
        record = {
            "id": row["id"],
            "fingerprint": hashlib.sha256(body.encode()).hexdigest()[:16],
            "pr_number": row["pr_number"],
            "title": row["title"],
            "kind": row["kind"],
            "state": row["state"],
            "author": row["author"],
            "author_association": row["author_association"],
            "url": row["url"],
            "path": row["path"],
            "created_at": row["created_at"],
            "merged_at": row["merged_at"],
            "labels": json.loads(row["labels_json"]),
            "categories": categories(body),
            "body": body,
        }
        records.append(record)

    with (args.output / "corpus.jsonl").open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    category_records: dict[str, list[dict[str, Any]]] = collections.defaultdict(list)
    author_counts: collections.Counter[str] = collections.Counter()
    bigrams: collections.Counter[tuple[str, ...]] = collections.Counter()
    trigrams: collections.Counter[tuple[str, ...]] = collections.Counter()
    code_terms: collections.Counter[str] = collections.Counter()
    kinds: collections.Counter[str] = collections.Counter()
    prs: set[int] = set()
    for record in records:
        prs.add(record["pr_number"])
        kinds[record["kind"]] += 1
        author_counts[record["author"] or "unknown"] += 1
        for category in record["categories"]:
            category_records[category].append(record)
        words = tokens(record["body"])
        bigrams.update(ngrams(words, 2))
        trigrams.update(ngrams(words, 3))
        code_terms.update(re.findall(r"`([^`\n]{2,80})`", record["body"]))

    batch_count = write_batches(records, args.output, args.batch_chars)
    summary: list[str] = [
        "# Pilot analysis summary\n\n",
        f"- Actionable artifacts retained: {len(records)} across {len(prs)} PRs.\n",
        f"- Kinds: {dict(kinds)}.\n",
        f"- Bounded analysis batches: {batch_count} (target {args.batch_chars:,} characters each).\n\n",
        "## Category counts\n\n",
    ]
    for category, items in sorted(
        category_records.items(), key=lambda item: len(item[1]), reverse=True
    ):
        summary.append(f"- `{category}`: {len(items)}\n")
    summary.extend(["\n## Top reviewers\n\n"])
    for author, count in author_counts.most_common(25):
        summary.append(f"- {author}: {count}\n")
    summary.extend(["\n## Recurring phrases\n\n", "### Bigrams\n\n"])
    for gram, count in bigrams.most_common(40):
        summary.append(f"- `{ ' '.join(gram) }`: {count}\n")
    summary.extend(["\n### Trigrams\n\n"])
    for gram, count in trigrams.most_common(30):
        summary.append(f"- `{ ' '.join(gram) }`: {count}\n")
    summary.extend(["\n### Backticked terms\n\n"])
    for term, count in code_terms.most_common(50):
        summary.append(f"- `{term}`: {count}\n")
    summary.extend(["\n## Diverse evidence samples by category\n\n"])
    for category, items in sorted(category_records.items()):
        summary.append(f"### {category} ({len(items)})\n\n")
        for record in diverse_samples(items):
            summary.append(
                f"- [#{record['pr_number']}]({record['url']}) "
                f"{record['author']} — {record['path'] or 'general'}: "
                f"{compact_body(record['body'])}\n"
            )
        summary.append("\n")
    (args.output / "summary.md").write_text("".join(summary), encoding="utf-8")
    print(
        json.dumps(
            {
                "actionable_artifacts": len(records),
                "prs": len(prs),
                "batches": batch_count,
                "categories": {
                    key: len(value)
                    for key, value in sorted(category_records.items())
                },
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
