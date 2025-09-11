# core/dialog

Introducing, core/dialog. A new block ported from prc-block-library into Gutenberg Core. This block allows users to add a dialog element to their posts and pages. The dialog element is a part of the HTML5 specification and provides a way to create modal dialogs that can be easily styled and controlled with CSS and JavaScript.

This implementation includes three blocks: `core/dialog`, `core/dialog-element`, and `core/dialog-trigger`. The `core/dialog` block serves as the container for the dialog, while the `core/dialog-element` block is used as the actual <dialog/> element with styling and content. The `core/dialog-trigger` block is used to create buttons or links that can open the dialog when clicked.

While `core/dialog-trigger` can be removed by the user, `core/dialog-element` is a required inner block of `core/dialog`. This ensures that the dialog has the necessary structure to function properly.
