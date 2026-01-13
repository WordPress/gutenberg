# /report

Summarize reproduction findings in a GitHub-comment-friendly format.

## Usage

This skill can be used in two ways:

1. **As part of triage pipeline:** Automatically called after reproduction completes
2. **Standalone:** Manually invoked to generate a report from existing triage data

**Standalone usage example:**
```
User: "Use the report skill to generate a report for issue 74447"
User: "Generate a report for issue 72364 using existing findings"
```

## Arguments

- `issue` (required): Issue number

## Input

This skill can be used standalone or as part of the triage pipeline.

**Required files:**
- `.triage/<issue>/<issue>.findings.json` - Reproduction results and evidence

**Optional files (enhance the report):**
- `.triage/<issue>/<issue>.parsed.json` - Issue context, labels, environment
- `.triage/<issue>/screenshots/*.png` - Visual evidence

**File locations:**
- All triage data is stored in `.triage/<issue>/` directory
- Issue number can be extracted from file path or provided as argument

**If files don't exist:**
- Inform user that triage data is missing
- Suggest running the triage pipeline first

## Output

Console summary formatted as a GitHub comment (concise, markdown-formatted)

---

## Process

### 1. Load data files

Read the findings file:

```bash
cat .triage/<issue>.findings.json
```

Optionally read parsed issue for context:

```bash
cat .triage/<issue>.parsed.json
```

### 2. Extract key information

From `findings.json`:

- `result`: "reproduced" | "not_reproduced" | "inconclusive"
- `environment`: WordPress, Gutenberg, PHP versions tested
- `steps_executed`: Array of executed steps with success/failure status
- `evidence`: Console errors, screenshots, observations
- `limitations`: Any constraints or issues encountered

From `parsed.json` (if available):

- `issue.title`: Bug title for context
- `issue.url`: Link to original issue
- `reproduction.expected`: Expected behavior
- `reproduction.actual`: Reported actual behavior
- `labels`: Issue labels (e.g., `[Feature] Global Styles`, `[Block] Navigation`)

### 3. Format GitHub comment

Structure the output as a concise GitHub comment with the following sections:

#### Header

```markdown
## 🔍 Automated Triage Report

**Issue:** #<issue>
```

#### Environment Summary

Include a dedicated section summarizing the test environment:

```markdown
### Test Environment

**WordPress:** <version>
**Gutenberg:** <version>
**PHP:** <version>
**Theme:** <theme name> (if available from parsed.json)
**Platform:** WordPress Playground
**Browser:** <browser info if available from evidence>
```

Extract environment details from:

- `findings.json.environment`: WordPress, Gutenberg, PHP versions
- `parsed.json.environment.theme`: Theme name (if available)
- `findings.json.evidence`: Browser/platform info if captured during reproduction

**Example:**

```markdown
### Test Environment

**WordPress:** 6.7
**Gutenberg:** 20.0
**PHP:** 8.2
**Theme:** Twenty Twenty-Five (block theme)
**Platform:** WordPress Playground
```

#### Result Summary

Based on `result` field:

**If `reproduced`:**

```markdown
### ✅ Bug Reproduced

The reported issue was successfully reproduced in the test environment.
```

**If `not_reproduced`:**

```markdown
### ❌ Bug Not Reproduced

Unable to reproduce the reported issue with the provided steps.
```

**If `inconclusive`:**

```markdown
### ⚠️ Inconclusive Results

Could not definitively reproduce or rule out the bug due to limitations.
```

#### Reproduction Details (if reproduced)

```markdown
### Reproduction Steps

<Brief summary of steps that successfully reproduced the bug>

**Observed Behavior:**
<What was actually observed that matches the reported bug>
```

#### Error Logs & Console (if reproduced)

If `evidence.console_errors` has entries:

```markdown
### Console Errors

<details>
<summary>View console errors</summary>

\`\`\`
<Each error on a new line>
\`\`\`

</details>
```

If `evidence.network_errors` or failed network requests exist:

```markdown
### Network Errors

<details>
<summary>View network errors</summary>

- `<method> <url>` - Status: `<status>` - `<error message>`

</details>
```

#### Suspect Code References (if reproduced)

Use Context7 and codebase search to identify likely code locations based on:

- Issue labels (e.g., `[Feature] Global Styles` → search Global Styles code)
- Reproduction steps (e.g., "Additional CSS" → search CSS-related code)
- Error messages (search for error text in codebase)
- Affected features from parsed issue

**Search strategy:**

1. **Use Context7 to understand the feature:**
   - Query for Gutenberg/WordPress documentation about the affected feature
   - Understand the expected behavior and common implementation patterns
   - Learn about related APIs and components

   **Examples:**
   - "How does WordPress Global Styles Additional CSS work?"
   - "WordPress Gutenberg Site Editor error handling patterns"
   - "WordPress REST API global styles endpoint"

2. Extract feature/block names from labels
3. Search for relevant files using semantic search
4. Look for error messages in code
5. Identify save/validation functions based on reproduction steps

Format as:

```markdown
### Suspect Code Areas

Based on the reproduction steps and error patterns, the following code areas may be relevant:

- `<file path>` - `<brief reason why this file is suspect>`
- `<file path>` - `<brief reason why this file is suspect>`
```

**Example searches:**

- For Global Styles issues: Search "Global Styles save", "theme.json validation"
- For block issues: Search block name + "save" or "render"
- For CSS issues: Search "Additional CSS", "custom CSS", "saveCSS"

#### Not Reproduced Details (if not_reproduced)

```markdown
### What Was Tested

<Summary of steps executed and what was observed>

**Observed Behavior:**
<What actually happened - should match expected behavior>

**Differences from Report:**
<Any differences in environment, steps, or context that might explain why bug wasn't reproduced>
```

#### Suggestions for Additional Context (if not_reproduced)

```markdown
### Additional Information Needed

To help reproduce this issue, please consider providing:

1. **Specific versions**: Exact WordPress and Gutenberg versions (not just "latest")
2. **Browser/OS details**: Browser version and operating system
3. **Console output**: Any console errors or warnings when reproducing
4. **Network tab**: Failed network requests (status codes, error messages)
5. **Screenshots**: Visual evidence of the bug
6. **Step-by-step video**: Screen recording of the reproduction
7. **Plugin conflicts**: List of active plugins (if any)
8. **Custom code**: Any custom PHP/JavaScript that might affect behavior
```

#### Limitations (if present)

If `limitations` field has content:

```markdown
### Limitations

<limitations content>
```

#### Evidence Files (if screenshots exist)

```markdown
### Screenshots

Screenshots captured during reproduction:

- `.triage/<issue>/screenshots/<filename>.png`
```

### 4. Output to console

Print the formatted markdown to console. Keep the output concise - aim for 50-100 lines maximum for GitHub comment readability.

---

## Formatting Guidelines

### Keep it concise

- GitHub comments should be scannable
- Use bullet points and short paragraphs
- Avoid walls of text

### Use markdown effectively

- Headers for structure (`##`, `###`)
- Code blocks for errors/logs
- Details/summary for collapsible sections
- Lists for steps and suggestions

### Be helpful

- Focus on actionable information
- Provide specific file paths for code references
- Suggest concrete next steps
- Be respectful and constructive

### Evidence-based

- Reference specific observations from findings
- Include actual error messages
- Link to screenshots when available
- Cite specific steps that reproduced the issue

---

## Report Template

Use this concise format for GitHub comments:

```markdown
## Triage Results

**Result:** ✅ Reproduced | ❌ Not Reproduced | ⚠️ Inconclusive
**Environment:** WP {version}, Gutenberg {version}, PHP {version}

{1-2 sentence summary of what was tested and the result}

<details>
<summary>Evidence</summary>

**Network:** `{method} {endpoint}` → {status}
**Console:** {key errors if any}
**Screenshots:** {count} captured

</details>

**Likely affected code:**
- `{file/path}` - {reason}
- `{file/path}` - {reason}

**Suggested fix:** {1-2 sentences on what needs to change}

---
<sub>Automated triage via WordPress Playground</sub>
```

## Guidelines

**Keep it short:**
- Total length: 15-25 lines maximum
- One summary sentence, not paragraphs
- Bullet points, not prose
- Only essential evidence in collapsible section

**Focus on action:**
- What's broken (1 sentence)
- Where to look (file paths)
- What to fix (brief suggestion)

**Skip if not helpful:**
- Don't include empty sections
- Skip console errors if unrelated
- Skip limitations unless critical
- No "Next Steps" or "Impact Assessment" sections

---

## Code Reference Extraction Strategy

When bug is reproduced, identify suspect code using:

1. **Label-based search**: Extract feature/block names from labels

   - `[Feature] Global Styles` → Search "Global Styles", "theme.json", "custom CSS"
   - `[Block] Navigation` → Search "Navigation block", "block navigation"

2. **Step-based search**: Analyze reproduction steps

   - "Save" actions → Search save functions, API endpoints
   - "Additional CSS" → Search CSS-related code
   - UI interactions → Search component files

3. **Error-based search**: Use error messages

   - Extract error text → Search codebase for error strings
   - HTTP status codes → Search API error handling

4. **Semantic search**: Use codebase_search tool

   - Query: "How does Additional CSS save work?"
   - Query: "Where are Global Styles validation errors displayed?"
   - Query: "How are save failures handled in Site Editor?"

5. **File path patterns**: Based on Gutenberg structure
   - Site Editor: `packages/edit-site/src/**`
   - Blocks: `packages/block-library/src/**/<block-name>/**`
   - Components: `packages/components/src/**`
   - Core Data: `packages/core-data/src/**`

Format code references as:

- File paths relative to Gutenberg repo root
- Brief explanation of why the file is relevant
- Link to GitHub if possible (optional, Phase 2)
