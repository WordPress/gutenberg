# Step 4: Report Findings

Summarize reproduction findings in a GitHub-comment-friendly format.

## 4.1 Load data files

Read the findings file:

```bash
cat /tmp/triage/<issue>/<issue>.findings.json
```

Optionally read parsed issue for context:

```bash
cat /tmp/triage/<issue>/<issue>.parsed.json
```

## 4.2 Extract key information

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

## 4.3 Format GitHub comment

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
**Screenshots:** {count} captured (only if bug reproduced and screenshots exist)

</details>

**Likely affected code:**
- `{file/path}` - {reason}
- `{file/path}` - {reason}

**Suggested fix:** {1-2 sentences on what needs to change}

---
<sub>Automated triage via WordPress Playground</sub>
```

## 4.4 Suspect Code Areas

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

4. **File path patterns**: Based on Gutenberg structure
   - Site Editor: `packages/edit-site/src/**`
   - Blocks: `packages/block-library/src/**/<block-name>/**`
   - Components: `packages/components/src/**`
   - Core Data: `packages/core-data/src/**`

Format code references as:

- File paths relative to Gutenberg repo root
- Brief explanation of why the file is relevant

## Formatting Guidelines

### Keep it concise

- Total length: 15-25 lines maximum
- One summary sentence, not paragraphs
- Bullet points, not prose
- Only essential evidence in collapsible section

### Focus on action

- What's broken (1 sentence)
- Where to look (file paths)
- What to fix (brief suggestion)

### Skip if not helpful

- Don't include empty sections
- Skip console errors if unrelated
- Skip limitations unless critical
- No "Next Steps" or "Impact Assessment" sections

## 4.5 Output to console

Print the formatted markdown to console. Keep the output concise - aim for 50-100 lines maximum for GitHub comment readability.

## 4.6 Post GitHub comment

After generating the findings, post the comment to the GitHub issue:

```bash
gh issue comment <issue_number> --repo aagam-shah/gutenberg --body "$(cat <<'EOF'
<formatted markdown from 4.3>
EOF
)"
```

**Important:**
- Use the exact markdown format from section 4.3
- The comment will be posted under the authenticated user's account
- Confirm successful posting by checking the command output

**Output after posting:**

```
COMMENT POSTED: https://github.com/aagam-shah/gutenberg/issues/<issue>#issuecomment-<id>
```
