# Review routing

Decides which teams to ask for review on a pull request. It sends the pull request to a decision model with one yes or no question for each rule, and a team gets a review request when the probability of one of its rules reaches that rule's threshold.

Unlike `.github/CODEOWNERS`, which asks a team about every change under a path, a rule describes the kind of change that a team should review. A dependency update that touches a team's package does not need that team, and a change outside the package can.

## Routing files

Each file in `.github/review-routing/` is one rule. The file name is the rule id, the front matter names the team, and the body is the question that the model answers:

```md
---
team: WordPress/gutenberg-components
threshold: 0.7
---

Does this change add or change a public API of the design system packages? ...
```

`threshold` is optional and defaults to 0.7. Write the body in plain language, and say when to answer no if the boundary is not clear.

Ask about one kind of change in each file. A question that combines several conditions gives a less useful probability, and the model can let one condition hide another. To route several kinds of change to a team, add a file for each kind with the same `team`. The team gets one request if any of its rules passes, and the report shows which rules did. To add a team, add a file.

## What the model reads

Every rule reads the same evidence:

- The title, labels and description, without the template's HTML comments.
- Every changed file, with its added and removed line counts.
- The changed lines of each diff, without context lines.

Files that `.gitattributes` marks as `linguist-generated` stay in the file list, but their diffs are left out. This is the attribute that makes GitHub collapse a diff in a pull request, so a file that is noise for a human reviewer is also left out for the model. To leave out another file, mark it in `.gitattributes`.

Character budgets in `src/evidence.ts` hold the description, the file list, each diff and all diffs together to a fixed size, so a large pull request cannot fill the model's context. The report says how many diffs were generated, trimmed or left out.

## Usage

Run it from the repository root:

```sh
npm run --workspace @wordpress/review-routing-tools route -- --pr 12345
```

It prints a Markdown table of the decisions. `--json` prints them as JSON. `--dry-run` prints the evidence and the questions without calling the model, and needs no credentials: use it to see what the model reads when you change a routing file.

### Credentials

The tool works with any API that accepts [System One](https://docs.typesafe.ai/api/system-one) requests. TypeSafe defined this API for its Jev model, and other providers accept it too, such as Clef on Cloudflare Workers AI. It reads these from the environment:

| Variable           | Required                     | Purpose                                                                                                                                       |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DECISION_API_URL` | Yes, except with `--dry-run` | The endpoint that takes the request.                                                                                                          |
| `DECISION_API_KEY` | Yes, except with `--dry-run` | Sent as a bearer token.                                                                                                                       |
| `DECISION_MODEL`   | Yes, except with `--dry-run` | The model name in the request body.                                                                                                           |
| `GITHUB_TOKEN`     | No                           | Raises the GitHub API rate limit above 60 requests an hour. When it is not set, the tool uses `gh auth token` if the GitHub CLI is signed in. |

To keep them in a file, copy `.env.example` to `.env` in this directory and fill it in. Git ignores `.env`. A variable that is already set in the environment takes precedence over the file. So to keep the key out of the file, use any tool that sets variables for one command. For example, with [1Password secret references](https://developer.1password.com/docs/cli/secret-references/) as values in `.env`:

```sh
op run --env-file=tools/review-routing/.env -- npm run --workspace @wordpress/review-routing-tools route -- --pr 12345
```

`.env.example` is set up for Clef-flash on Cloudflare Workers AI, which has a free plan. Create a Cloudflare API token with the Workers AI template, and use an account that has no other purpose. The free plan allows 10,000 neurons a day, which is about 2.9 million input tokens, or a few hundred runs of this tool. When the allowance runs out, requests fail until 00:00 UTC, and nothing is billed.
