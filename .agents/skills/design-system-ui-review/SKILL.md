---
name: design-system-ui-review
description: Use when reviewing a Gutenberg, plugin, or application UI/UX change for correct public WordPress Design System usage and user-facing behaviour, including a component, control, visual styling, token, interaction, layout, overlay, or other user-facing interface; do not use to implement a change or review Design System package source.
---

# Review a WordPress Design System interface

## Start shallow

1. Define the changed user-facing behaviour, affected users, runtime document,
   target versions, and dependency deployment boundary.
2. Scan the complete diff once for semantics and accessibility, interaction
   and focus, styling and tokens, integration, tests, and compatibility.
   Account for every changed file before deep research; finding one defect
   does not end this pass.
3. Choose the narrowest review path:
   - **Lightweight:** copy-only or supported-prop changes with no interaction,
     styling, or setup change.
   - **Standard:** component, custom UI, styling, or interaction changes.
   - **Deep:** migrations, public-contract risk, or separate documents and
     overlays.

On the lightweight path, verify the target runtime API, every changed consumer,
and required changelog coverage. State what the change improves and what
behaviour and semantics remain unchanged, then stop. Do not reopen component selection
without evidence that the existing component is unsuitable.

## Deepen only material questions

Use the recommendation sources in
[Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component)
only when component, package, prop, token, or setup selection is material.
Apply that guide's evidence precedence: treat the supplied diff as the proposed
post-change state, verify availability against the target version, and use MCP
as current-direction context rather than target-version proof.

For standard and deep reviews, investigate only the dimensions made material
by the first pass. Judge custom UI by demonstrated user, accessibility,
consistency, or maintenance impact—not by the mere existence of a public
alternative. For separate documents, verify the applicable package setup in
the document that renders the interface.

When custom UI has a material defect, explicitly decide whether the smallest
coherent fix is to repair it or replace it with a verified public component.
Do not leave the implementation direction implicit.

## Finding evidence gate

Before reporting a finding, establish:

1. the incorrect user-observable behaviour or public contract;
2. the exact changed line that causes it;
3. target-version source or runtime evidence for the expected behaviour; and
4. why the change is required now rather than an optional enhancement.

If any part is missing, resolve it, report a verification gap, or omit the
finding. Treat missing context in a diff excerpt as a gap unless the complete
diff proves an omission. Missing tests alone are not a defect without a
demonstrated regression or repository requirement.

## Output contract

Recheck every finding against the complete diff and source. Classify each
concern as a defect, verification gap, or optional follow-up. Report material
findings with user impact, target evidence, and the smallest coherent
direction, plus focused verification of the affected behaviour. Report no
findings when the evidence exposes none. Do not prescribe package internals in
a consumer review. Route package-source reviews to
`design-system-code-review`, then stop.
