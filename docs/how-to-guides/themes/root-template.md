# Root template

A block theme can opt into a single `root.html` template that defines
site-wide chrome (header, footer, sidebars) once. When `root.html` is
present, every other template in the theme renders inside it on the
frontend and in the Site Editor — so theme authors no longer need to
repeat the same header/footer template parts in every template.

## How it works

Add a `root.html` file to your theme's `templates/` directory. Anywhere
inside it, drop the `core/template-content` block:

```html
<!-- wp:group {"tagName":"main"} -->
<div class="wp-block-group">
    <!-- wp:template-part {"slug":"header","tagName":"header"} /-->
    <!-- wp:template-content /-->
    <!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
</div>
<!-- /wp:group -->
```

`core/template-content` is the slot the WordPress template hierarchy
fills at render time. On the frontend, when WordPress would normally
serve `archive.html`, `single.html`, `index.html`, etc., it serves
`root.html` instead and renders the originally-resolved template's
blocks inside `core/template-content`.

`core/template-content` may only be inserted inside `root.html` and may
only appear once per template.

## Authoring inside the Site Editor

Two flows in the editor:

-   **Editing `root.html` directly.** `core/template-content` shows a
    non-interactive preview of the home-hierarchy fallback (front-page →
    home → index) so you can see how the chrome looks around real
    content. A dropdown in the block's inspector switches the preview to
    a different template, and an "Edit template" toolbar action opens
    the previewed template in the regular editor.
-   **Editing any other template** (e.g. archive, single). The Site
    Editor wraps that template inside `root.html`. The inner template's
    blocks are fully editable inside `core/template-content`; the
    surrounding chrome is locked but selectable. Clicking any chrome
    block surfaces an "Edit root template" toolbar action that switches
    you to editing `root.html` itself.

## When to use it

Use `root.html` when your templates are mostly chrome + a single content
slot. Skip it when templates differ in structure beyond their content —
the wrap forces every template through the same outer markup.

## Compatibility

Themes without a `root.html` continue to work exactly as before:
WordPress resolves the template hierarchy normally and serves the
matching template directly. Adding a `root.html` is a strictly opt-in
change.
