# Writing Flow

This hook handles selection across blocks.

## Partial multi-block selection

Selecting across blocks is possible by temporarily setting the `contentEditable`
attribute to `true`. This sounds scary, but we prevent all default behaviours
except for selection, so don't worry. :)

* For selection by mouse, we make everything editable when the mouse leaves an
  editable field.
* For Shift+Click selection, we do it on `mousedown`.
* For keyboard selection we do it when the selection reaches the edge of an
  editable field.

In the future, we should consider using the `contentEditable` attribute for
arrow key navigation as well.

Now that it's possible to select across blocks, we need to sync this state to
the block editor store. We can do this by listening to the `selectionchange`
event. In writing flow, we can sync the selected block client ID, but when the
selection starts or ends in a rich text field, it will be rich text that sync a
more precise position (the block attribute key and offset in addition to the
client ID).

With the selection state in the block editor store, we can now handle things
like Backspace, Delete, and Enter.
