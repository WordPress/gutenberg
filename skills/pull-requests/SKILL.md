---
name: pull-requests
description: Use when authoring or updating a pull request description for the Gutenberg repository — the What/Why/How sections, testing instructions, and AI-tools disclosure.
---

# Pull requests

Follow the section structure and comments in `.github/PULL_REQUEST_TEMPLATE.md`.

## Describe the committed diff

Base the description on what the pull request actually contains, not your local working tree.

## Testing instructions

-   **Name where each result is observable** — a URL, a screen element, a command's output, a file. If a reviewer could ask "confirm it where?", the step is not finished.
-   **Assume the standard reviewer setup** (branch checked out, environment running) and start at the first action specific to the pull request — no setup boilerplate.
