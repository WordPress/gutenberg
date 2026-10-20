# Block toolbar redesign

An experiment, behind `gutenberg-block-toolbar-redesign` (Gutenberg > Experiments > Block toolbar redesign). It sets `window.__experimentalBlockToolbarRedesign`, and `isBlockToolbarRedesign()` from `./utils` reads it.

## Design principles

-   **Style goes in the menu; structure stays top-level.** Style choices that usually come from Global Styles (text alignment, typography, block width) live in the options menu. Choices made for each block on its own (container layout, adding blocks inside) keep a place on the toolbar.
-   **Icons are recognizable or labelled.** Icon-only buttons are for icons people know from across the web (bold, link, arrows, `+`, trash), and they still get a tooltip. Everything else has a visible text label.
-   **The toolbar is always in the same place,** whatever the block hierarchy. The parent selector sits outside it.
-   **Block tools and text tools are separate.** Block tools act on the block. Formatting appears with a text selection.

## Toolbar groups

The toolbar is a fixed sequence of groups. This is the guide for block authors, plugin authors and agents deciding where a control goes.

| Group | What goes here | Who fills it |
| --- | --- | --- |
| Parent selector | The nearest parent block; its menu lists every parent up to the top of the page. Sits outside the toolbar, to its left (or first, in the top toolbar). | Core |
| Block name | `Paragraph ⌄`: transforms, the block's own variations (heading levels) and style presets. The only place for these; ad hoc transform controls such as a heading level dropdown don't belong on the toolbar. | Core, from transforms, `transform` scoped variations and block styles |
| Movers | Drag handle, move up, move down (left and right in a row). | Core |
| Primary actions | The few structural actions a block keeps on top. For containers: a labelled `Layout ⌄` button (layout variations, justification, vertical alignment) and a `+` that adds a block inside. For sections (patterns): `Edit pattern` and the section style switcher. Most atomic blocks leave it empty. | Core, from the `layout` support, inner blocks and sections |
| Block controls | Controls registered with `BlockControls`. In the redesign core no longer puts alignment, layout or formatting controls here, so what's left is block-specific (Replace on an image) and third-party controls. See open questions. | Blocks and plugins |
| Options | `⋮`: one searchable menu with labelled flyouts. Align (Text, Block), Format, Styles (copy and paste), Insert (inline image, footnote, math, block before and after), Copy, Cut, Duplicate, Group, and More (Lock, Rename, Hide, Edit as HTML, plugin items). | Core, plus `BlockSettingsMenuControls` fills under More |
| Delete | Trash button, on every block that can be removed. | Core |

Text has its own toolbar, the **selection toolbar**, which appears just below selected text (so it never covers the block toolbar above the block) with Bold, Italic, Link and a More menu of other formats. It builds on the inline toolbar image captions use.

### Where should my control go?

-   It changes how the block's text or box looks, and a theme could set it for every block of this type: **options menu**. Today that means registering a block support rather than a toolbar control.
-   It formats or links selected text: a `RichTextToolbarButton`, which shows in the **selection toolbar**.
-   It inserts something inline in the text (an image, a footnote): a `RichTextToolbarButton` with `group="insert"`, which shows in **Insert** in the options menu.
-   It changes what the block is: a transform or a `transform` scoped variation, which shows under the **block name**.
-   It's a structural action people take often on this block, and it has a short text label: **primary actions**. Only core fills this for now.
-   Anything else: `BlockSettingsMenuControls`, under **More** in the options menu.

## Open questions

-   **Third-party toolbar controls.** `BlockControls` fills still render in the toolbar, unlabelled. They could move into the options menu, a block's primary actions, or both, and they'd need a migration path and a way to declare a label.
-   **Keyboard and mobile access to the selection toolbar.** It shows for a pointer or keyboard text selection, but there's no shortcut to move focus into it yet, and touch selection hasn't been tried.
-   **Where the parent selector sits.** To the left of the toolbar for now; above it is the other option. A long chain is in its menu, not on the toolbar.
-   **A preference to hide the movers,** and whether "Show button text labels" is still needed once every non-standard icon has a label.
-   **Search** finds items in the flyouts, but not Copy and Cut (the clipboard needs the click on the item itself) or plugin items.
-   Content-only blocks (most of what can be edited inside a pattern) use the redesign too, with what the current toolbar allows there: the block name offers style presets but no transforms, alignment is left out, and a section keeps its labelled **Edit pattern** button among the primary actions. Zoomed out and placeholder toolbars keep the current design.
-   A synced pattern's overrides keep their current menu in place of the block name.
