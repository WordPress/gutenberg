# Step 1: Parse Issue

Parse a WordPress Gutenberg bug report into structured reproduction data.

## 1.1 Fetch the issue and comments

```bash
gh issue view <number> --repo aagam-shah/gutenberg --json title,body,labels,state,comments,author
```

Fetches issue body AND all comments (often contain critical context).

## 1.2 Validate it's a bug report

Check that:

- Issue has the `[Type] Bug` label
- Issue state is `open` (warn if closed but continue)

If not a bug report, stop and inform the user.

## 1.3 Parse and understand labels

Gutenberg uses a structured label taxonomy. Extract ALL labels for context.

**Label prefixes:**

| Prefix      | Purpose          | Example                  |
| ----------- | ---------------- | ------------------------ |
| `[Type]`    | Issue type       | `[Type] Bug`             |
| `[Status]`  | Workflow state   | `[Status] Needs Testing` |
| `[Block]`   | Affected block   | `[Block] Navigation`     |
| `[Feature]` | Affected feature | `[Feature] Patterns`     |
| `[Package]` | npm package      | `[Package] Components`   |
| `[Focus]`   | Area of focus    | `[Focus] Accessibility`  |

**Use labels to disambiguate steps:**

- If `[Block] More` is present and steps mention "the block", it's the More block
- If `[Feature] Block Visibility` is present and steps say "set to Hide", it's the visibility toggle
- Label descriptions often contain helpful context

## 1.4 Extract context from comments

Comments often contain critical information missing from the original report.

**Look for:**

- **Feature names**: Maintainers often name the specific feature
- **Technical explanations**: How the feature works
- **Clarifications**: Reporter or maintainers clarifying steps
- **Related issues/PRs**: Links to context
- **Reproduction confirmations**: Others confirming the bug

**Comment signals:**

- Comments from `MEMBER` or `CONTRIBUTOR` carry more weight
- "This is related to..." or "This happens because..." explains root cause

## 1.5 Parse template sections

Gutenberg bug template sections (identified by `### ` headings):

| Section                                           | Required | Content               |
| ------------------------------------------------- | -------- | --------------------- |
| `### Description`                                 | Yes      | What the bug is       |
| `### Step-by-step reproduction instructions`      | Yes      | Numbered steps        |
| `### Screenshots, screen recording, code snippet` | No       | Visual evidence       |
| `### Environment info`                            | Yes      | WP/Gutenberg versions |
| `### Please confirm...`                           | No       | Checkboxes, ignore    |

## 1.6 Extract environment details

From `### Environment info`:

- **WordPress version**: `WordPress 6.9`, `WP 6.8`, `6.7.1`
- **Gutenberg version**: `Gutenberg trunk`, `Gutenberg 20.0`, `built-in/core`
- **Theme type**: Block, Classic, or Hybrid

If missing, note as `unknown`.

## 1.7 Parse reproduction steps

From `### Step-by-step reproduction instructions`:

- Extract numbered steps (1., 2., 3.)
- Preserve exact wording
- Flag ambiguous steps

**Ambiguity indicators:**

- Vague actions: "click around", "navigate somewhere"
- Missing specifics: "click the button" (which button?)
- Assumes context: "in the editor" (which editor?)
- External dependencies: "install plugin X"

## 1.8 Identify expected vs actual

Extract from `### Description` or explicit sections:

- What should happen (expected)
- What actually happens (actual)

## 1.9 Check if triage is needed

Before proceeding with triage, check if maintainers have already confirmed and investigated the issue:

**Skip triage if ANY of these conditions are met:**

1. **Status indicates work in progress:**

   - Has `[Status] In Progress` label
   - Has `[Status] LGTM` label
   - Has linked PR (check for "linked a pull request" in timeline)

2. **Maintainers have confirmed the bug:**

   - Comments from MEMBER or OWNER confirming reproduction
   - Comments identifying specific code location (file paths, line numbers)
   - Comments with "reproduced", "confirmed", "I can reproduce"

3. **Technical details already provided:**
   - Code file/location mentioned in comments
   - Root cause identified
   - Fix approach discussed

**Set in parsed JSON:**

```json
{
  "needs_triage": false,
  "skip_reason": "maintainers_confirmed | in_progress | has_pr | code_identified"
}
```

If issue needs triage (none of above conditions met):

```json
{
  "needs_triage": true
}
```

## 1.10 Write parsed data

Write to `/tmp/triage/<issue>/<issue>.parsed.json`:

```json
{
  "issue": {
    "number": 74447,
    "title": "...",
    "state": "OPEN",
    "author": "username",
    "url": "https://github.com/..."
  },
  "labels": [
    { "name": "[Type] Bug", "description": "..." },
    { "name": "[Block] Navigation", "description": "..." }
  ],
  "affected": {
    "blocks": ["Navigation"],
    "features": ["Site Editor"]
  },
  "environment": {
    "wordpress": "latest",
    "gutenberg": "latest",
    "theme": "block",
    "plugins": ["gutenberg"]
  },
  "reproduction": {
    "steps": ["Step 1", "Step 2"],
    "expected": "What should happen",
    "actual": "What actually happens"
  },
  "context": {
    "related_issues": [12345],
    "comments_count": 5,
    "reproduction_confirmed": true,
    "feature_names": ["block visibility"]
  },
  "parseable": true,
  "ambiguities": ["Step 3 unclear: which button?"]
}
```

## 1.11 Output summary

```
ISSUE PARSED: #<number>
Title: <title>
State: <open/closed>

TRIAGE NEEDED: <Yes/No>
<If No: REASON: <skip_reason>>

LABELS:
- [Type] Bug: An existing feature does not function as intended
- [Feature] Site Editor: Related to the Site Editor
...

AFFECTED:
- Blocks: <list>
- Features: <list>

ENVIRONMENT:
- WordPress: <version>
- Gutenberg: <version>
- Theme: <type>

REPRODUCTION STEPS:
1. <step>
2. <step>
...

EXPECTED: <what should happen>
ACTUAL: <what happens instead>

AMBIGUITIES:
- <any unclear steps>

OUTPUT: /tmp/triage/<issue>/<issue>.parsed.json
```

## Early Exit Conditions

Triage will exit early without running reproduction steps if:

- Issue has `[Status] In Progress` label
- Maintainers (MEMBER/OWNER) have confirmed the bug in comments
- Code location already identified
- Issue has linked PR

**Early exit message format:**
```
TRIAGE NOT NEEDED: Issue #<number>

REASON: <explanation>

DETAILS:
- <specific reasons why triage was skipped>

The issue has been parsed and saved to /tmp/triage/<issue>/<issue>.parsed.json
```

## Fallback: Non-template issues

If issue doesn't follow template:

1. Attempt best-effort extraction
2. Look for keywords: "steps", "reproduce", "expected", "actual", "version"
3. Flag as `parseable: false` with notes on what's missing

## Error Cases

- **Not a bug**: Lacks `[Type] Bug` label → inform user, stop
- **Empty body**: No content → inform user, stop
- **No steps found**: Can't identify steps → flag, ask user for guidance
