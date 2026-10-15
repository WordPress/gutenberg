---
applyTo: "tools/eslint/suppressions.json,tools/stylelint/stylelint-suppressions.json"
---

# Lint suppression files

These files hold bulk lint suppressions. Their purpose is to let us turn on a new or stricter lint rule without fixing every existing violation in the same change. They are not a way to get new code past lint.

When a pull request adds an entry or increases a count, do not comment if one of these is true:

- The same change adds or tightens the rule in the ESLint or Stylelint configuration.
- The entry moves from an old path to a new path with the same rule and count, because a file was renamed or moved.
- The file was copied from elsewhere in the repository, and the source file has the same suppressions. Check the pull request description for this, because the diff can make copied code look new.

In all other cases, ask the author one short question: why does the change not fix the violation? Phrase it as a question, because the author can know things the diff does not show. Suggest one of these alternatives:

- Fix the code so that it passes the rule.
- If the violation is intentional, add an inline `// eslint-disable-next-line <rule> -- <reason>` comment (or `/* stylelint-disable-next-line <rule> -- <reason> */`) where the violation is. The reason then stays next to the code.

Removed entries and lower counts are always good. Do not comment on them.
