---
name: defensive-data-design
description: Use when adding or changing a user-facing error message or notice, a destructive or irreversible action, or code that reads data it did not create (REST responses, block attributes, post meta, theme.json, localStorage).
---

# Defensive data design

Safe defaults for code that can lose someone's work or leave them stuck. Apply these checks; do not restate them as intentions.

## Errors the user sees

-   Say the cause, not just the symptom. Where the failure carries a usable message, put it (and its `code` where that helps) in what the user reads, and fall back to your own copy when it does not. A `catch` that receives an error and shows a fixed string is a defect.
-   Mind the rejection shape `apiFetch` uses — see the pitfall in the root `AGENTS.md`. It decides how you read a cause out of a failed request.
-   REST validation failures carry per-field reasons in `error.data.params`. The top-level message only names the field.
-   An error message containing HTML is still useful: strip the tags with `__unstableStripHTML` from `@wordpress/dom` rather than discarding the message.
-   Never swallow. `catch {}` with no logging is only acceptable when the failure is genuinely expected and the fallback is correct; say so in a comment naming the expected failure.
-   Show enough of a failure to act on, and make it copyable where there is room for it. Redact what should not travel: the user's content does not belong in an error payload, and the current URL can carry a nonce.
-   Read the [copy guide's Error Messaging section](../../../docs/contributors/documentation/copy-guide.md#error-messaging) before writing the string. Plain words, name the cause, offer a next step.

## Mutations and destructive actions

Prefer the reversible form of a change, and make both the change and the way back visible. Where a change cannot be reversed, triggering it should cost more than triggering one that can.

-   Before a consequential mutation, show what it targets, who will be able to see the result, and the state it leaves behind. Default to the draft, private or reversible option and make the public or permanent one the deliberate choice.
-   Trash must be cheaper than delete. If both sit in the same menu behind the same confirmation, the confirmation is doing no work.
-   Confirm dialogs echo what is affected: the item's title, or the count for bulk actions.
-   Irreversible confirms use `isDestructive` on the confirm button and say so in the label ("Delete permanently", not "Delete"). Follow the [destructive actions pattern](../../../storybook/stories/design-system/patterns/destructive-actions.mdx).
-   A mutation that succeeds silently is not visible. Announce it, and offer Undo when the prior value is in scope — capture the old value explicitly rather than popping the undo stack, which would also revert unrelated edits.
-   `Snackbar` renders exactly **one** action; more logs a warning and truncates to `actions[0]` (`packages/components/src/snackbar/index.tsx`). Choose between Undo and any other button. It also dismisses itself six seconds after it appears, so keep the text short enough to read in that time, and use `explicitDismiss` or a notice that is not a snackbar for anything the user must finish reading.
-   When a mutation fails, leave the user able to try again: keep their input, restore consistent state, release any control left busy or disabled, and make a second attempt safe to make.
-   `saveEntityRecord` and `deleteEntityRecord` add nothing to the undo stack, so anything already persisted needs its own recovery path. `editEntityRecord` records an undo level unless called with `undoIgnore`.

## Legibility

-   Use the space you have. Where there is room, render the value rather than a label that flattens it — a record's real status, whether a template is customised or came from the theme, which template applies — instead of making someone open a panel to find out.
-   A display that hides a qualifier states something untrue. "Published" on a password-protected post, or a template that reads as the theme's when it carries local edits, both mislead the person deciding what to do next.

## Data you did not create

Guard where untrusted data enters — a REST response, post meta, `theme.json`, an editor setting passed through a filter, a storage read — rather than at every read downstream. Block attributes are only partly covered: `packages/blocks/src/api/parser/get-block-attributes.ts` substitutes the declared default when a parsed value fails its type, but the `blocks.getBlockAttributes` filter runs after that check and `updateBlockAttributes` merges without any check, so a wrongly typed value can still reach a save function or PHP.

-   `JSON.parse` at a boundary goes in a `try`/`catch`, and the result is shape-checked (`Array.isArray`, `is_array`) before it is mapped or iterated: valid JSON of the wrong shape is the common case, not malformed JSON.
-   In PHP the failure mode depends on what you touch. `foreach` over a non-iterable, or reading an offset on `null`, an int, a bool or a float, warns and yields `null` — bad data flows on quietly. Fatal, by contrast: a string offset on a string (`$str['slug']`), an array or object used as an offset, or an object treated as an array. During rendering a fatal is a white screen for every visitor, so guard those three first, and shape-check the quiet cases where a stray `null` would corrupt something downstream.
-   Check where a throw lands. [React error boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) only catch render-phase errors — a throw inside a `registry.subscribe` callback, an async click handler, or a promise chain escapes them entirely and can silently drop the user's edit.
