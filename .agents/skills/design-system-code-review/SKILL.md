---
name: design-system-code-review
description: Perform a read-only, evidence-based review of a Gutenberg change to a WordPress Design System package or its public contract. Use for review requests affecting `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme`; do not use to implement the change or review a consumer-only application.
---

# Review a WordPress Design System contribution

## Authority and scope

- Keep the review read-only. Do not modify source or generated files, commit,
  push, post review comments, or update pull-request metadata.
- Review a diff that changes `packages/components`, `packages/ui`, or
  `packages/theme`. Require the target Gutenberg checkout or a complete diff.
- Treat the target checkout's code, package documentation, and compatibility
  policy as authoritative. Do not apply package-private conventions to an
  external consumer.

## Review method

1. Define the changed public surface and the user-visible behaviour in scope.
2. Inspect the diff, package source, exports, types, tests, stories, generated
   output, and meaningful Gutenberg and external consumers.
3. Read [Working with WordPress Design System packages](../../docs/contributors/design/design-system-packages.md)
   and the applicable package contribution guide.
4. Use an available MCP server only as supplementary current-design context;
   verify the target branch's contract from the checkout.
5. Resolve uncertainty through source, consumers, browser behaviour, and tests
   before reporting it.

## Assess the change

Check the concrete behaviour and contract rather than applying a static source
checklist. Cover, as applicable:

- existing consumers and external package consumers separately;
- public API, type, token, and theming compatibility;
- semantics, keyboard/focus behaviour, visible states, motion, and styling
  behaviour in a real browser when source-order or geometry matters;
- package conventions, tests, stories, documentation, generated output, and
  release impact.

## Output contract

Start with a short scope assessment. For each material finding, state the
affected contract or behaviour, target-source or consumer evidence, concrete
impact, and smallest coherent direction. Keep severity proportional to the
demonstrated risk. Separate verification gaps from findings, distinguish a
required change from an optional precedent or follow-up, and report no findings
when the evidence exposes none.
