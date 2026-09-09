---
name: defensive-data-design
description: Use when adding or changing a user-facing error message or notice, a destructive or irreversible action, or code that reads data it did not create (REST responses, block attributes, post meta, theme.json, localStorage).
---

# Defensive data design

Safe defaults for code that can lose someone's work or leave them stuck. Apply them as checks, not intentions.

## Errors the user sees

-   Say the cause, not just the symptom. Where the failure carries a usable message, show it (and its `code` if that helps); fall back to your own copy when it does not. A `catch` that receives an error and shows a fixed string is a defect.
-   Rejection shapes from `apiFetch` vary — see the pitfall in the root `AGENTS.md` before reading a cause from one.
-   REST validation failures carry per-field reasons in `error.data.params`. The top-level message only names the field.
-   Strip tags with `__unstableStripHTML` from `@wordpress/dom` rather than discarding a message that contains HTML.
-   Never swallow. An empty `catch` is acceptable only when the failure is expected and the fallback is correct — say which failure, in a comment.
-   Show enough of a failure to act on, and make it copyable where there is room. Keep the user's content out of the payload, and the current URL too: it can carry a nonce.
-   Read the [copy guide's Error Messaging section](../../../docs/contributors/documentation/copy-guide.md#error-messaging) before writing the string. Plain words, name the cause, offer a next step.

## Mutations and destructive actions

Prefer reversible changes, and make both the change and the way back visible. An irreversible one should be harder to trigger.

-   Before a consequential mutation, show what it targets, who will see the result, and the state it leaves behind. Default to draft, private or reversible; make public or permanent the deliberate choice.
-   Moving something to the trash should be easy; deleting it should be hard. If both sit in the same menu behind the same confirmation, the confirmation is doing no work.
-   Confirm dialogs echo what is affected: the item's title, or the count for bulk actions.
-   Irreversible confirms use `isDestructive` on the confirm button and say so in the label ("Delete permanently", not "Delete"). Follow the [destructive actions pattern](../../../storybook/stories/design-system/patterns/destructive-actions.mdx).
-   Announce a mutation that succeeds, and offer Undo when the prior value is in scope. Capture that value explicitly rather than popping the undo stack, which would revert unrelated edits too.
-   `Snackbar` renders one action only; more logs a warning and truncates to `actions[0]` (`packages/components/src/snackbar/index.tsx`). Undo or another button, not both.
-   A snackbar dismisses itself six seconds after appearing. Keep it readable in that time, and use `explicitDismiss` or a different notice for anything that must be read.
-   When a mutation fails, leave the user able to try again: keep their input, restore consistent state, release any control left busy, and make a retry safe.
-   `saveEntityRecord` and `deleteEntityRecord` add nothing to the undo stack, so anything already persisted needs its own recovery path. `editEntityRecord` records an undo level unless called with `undoIgnore`.

## Legibility

-   Use the space you have: show the value itself rather than a label that flattens it, instead of making someone open a panel to find out.
-   Make sure a label reflects reality, including any qualifier it would otherwise hide. For example:
    -   "Published" on a password-protected post reads as publicly readable when it is not.
    -   A template reads as the theme's when it carries local edits that belong to the site.

## Data you did not create

Guard where untrusted data enters — a REST response, post meta, `theme.json`, a filtered editor setting, a storage read — not at every read downstream. Block attributes are only partly covered: `packages/blocks/src/api/parser/get-block-attributes.ts` substitutes the declared default when a parsed value fails its type, but the `blocks.getBlockAttributes` filter runs after that check and `updateBlockAttributes` does not check at all, so a wrongly typed value still reaches save functions and PHP.

-   `JSON.parse` at a boundary goes in a `try`/`catch`, and the result is shape-checked (`Array.isArray`, `is_array`) before it is mapped or iterated: valid JSON of the wrong shape is the common case, not malformed JSON.
-   In PHP the failure mode depends on what you touch, and a fatal during rendering is a white screen for every visitor:
    -   Warns and yields `null`: `foreach` over a non-iterable; an offset on `null`, an int, a bool or a float. Bad data flows on quietly.
    -   Fatal: a string offset on a string (`$str['slug']`); an array or object used as an offset; an object treated as an array. Guard these first.
-   Check where a throw lands. [React error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) catch render-phase errors only — a throw in a `registry.subscribe` callback, an async click handler or a promise chain escapes them and can silently drop the user's edit.
