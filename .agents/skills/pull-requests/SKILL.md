---
name: pull-requests
description: Use when authoring or updating a pull request description for the Gutenberg repository — the What/Why/How sections, testing instructions, and AI-tools disclosure.
---

# Pull requests

Follow the section structure and comments in `.github/PULL_REQUEST_TEMPLATE.md`.

## Writing style
Be succinct and straightforward. Short, clear, concise sentences. Your audience is developers who need to get up to speed quickly, not wade through long paragraphs. Keep the whole description under 400 words.

## Describe the committed diff

Base the description on what the pull request actually contains, not your local working tree.

## Testing instructions

-   **Name where each result is observable** — a URL, a screen element, a command's output, a file. If a reviewer could ask "confirm it where?", the step is not finished.
-   **Assume the standard reviewer setup** (branch checked out, environment running) and start at the first action specific to the pull request — no setup boilerplate.

## Use of AI Tools

Always fill in the template's "Use of AI Tools" section: one short sentence naming the tooling and model used and to what extent the pull request was authored by AI. If no AI was involved, say so explicitly.
