## What?

Closes #80513

Selecting text inside an inline note marker now highlights the corresponding note in the Notes sidebar, so the sidebar selection follows the caret.

## Why?

Previously the sidebar selection only updated when clicking a note in the sidebar itself. Moving the caret into noted text in the canvas gave no feedback about which note it belongs to, which made long discussions hard to follow.

## How?

The collab-sidebar format registers a selection listener that resolves the note annotation under the current caret position and dispatches the matching note ID to the sidebar selection store. The block-notes e2e spec is extended to cover caret-driven selection.

## Testing Instructions

1. Open a post that has block notes, or add a note to a paragraph via the block toolbar.
2. Click into the middle of the noted text in the canvas.
3. Confirm the corresponding note is highlighted in the Notes sidebar.
4. Click into text without a note and confirm no note is highlighted.

### Testing Instructions for Keyboard

1. Place the caret before the noted text and use the arrow keys to move into the marker.
2. Confirm the matching note is highlighted in the sidebar as soon as the caret enters the marker.

## Use of AI Tools

This description was drafted with an AI assistant (Claude) and reviewed by a human before submission.
