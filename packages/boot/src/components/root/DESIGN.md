# Site shell: design concepts

This is the design brief for the site shell prototype on `try/site-shell`. The shell is a single admin bar and a site that stays on screen while you browse it, edit it, style it and manage it. The code shows what the shell does; this file says why it is arranged the way it is, so new work follows the same rules. Each section gives the principle, the reason, and where it lives in the code.

## The site is the constant

-   Browsing the site is the default state. Logged in, you land on your site with the admin bar above it, not on a dashboard.
-   Every other mode is arranged around the site rather than replacing it:
    -   **Menu open:** the site scales down beside the menu.
    -   **Styling:** the site sits beside the Styles panel, so changes show on the real site.
    -   **Admin screens:** the site shrinks to a thumbnail, showing what you last viewed or edited, one click from going back.
    -   **Editing:** the editor grows out of the site in the same place.
-   The site moves by scaling, never by reflowing. Its layout stays as it would be at full size, so it reads as the same page in a different place, not a new render.
-   It only scales up once its content has painted, so you never watch a page load inside the transition.
-   Where the site has corners (beside the menu, as a thumbnail, beside Styles), they match the radius of the admin surfaces next to it.

Code: the site layouts (`is-beside-menu`, `is-beside-styles`, `is-thumbnail`) and `--site-shell-pip-scale` in `shell.module.scss`; `waitForSitePaint` and `openFromAdmin` in `shell.tsx`.

## The bar's anatomy

The bar is one dark strip across every mode, in three parts.

-   **Global clusters at the ends.** They belong to the shell, appear on every screen, and never move, so muscle memory holds wherever you are.
    -   **Start:** the menu toggle (the WordPress logo). It opens the admin menu over the site, or hides it on admin screens.
    -   **End:** Add (+), Search, Notifications and Account, in that order. These are things you might want from anywhere: making something new, finding something, seeing what needs attention, and you.
-   **Context in the middle.** Everything that belongs to the current screen sits between the two clusters: the title box, the editor's tools, Save. When you change screens, only this part changes.
-   **Separators mark the boundary.** Each global cluster has a separator on its inner side, between it and the context. It only shows when there are contextual tools beside it; with nothing next to it, a separator would divide the cluster from empty space.

Styles is a borderline case and sits just inside the end cluster, before the separator. It applies to the whole site rather than to one document, so it belongs with the global end, but it is only offered while viewing the site, since styling is part of looking at it.

Code: `.bar-start`, `.bar-context`, `.bar-end` and `.bar-account` in `shell.tsx` and `shell.module.scss`; the separator rules near `.bar-menu-toggle::after` and `.bar-account::after`.

## The title box

The title box replaces both the editor's document title and the header admin screens used to have. There is one answer to "where am I?", in the same place on every screen.

-   **One box, one size.** It is centred in the bar and fixed width (`min(480px, 40vw)`) in every mode, so it carries over as you move between screens instead of resizing with its content. A long title is cut short at its end.
-   **Three parts:**
    -   **Start:** the site icon, as branding. It tells you whose site this is without spending the bar's space on the site name, which lives in the menu instead.
    -   **Middle:** a breadcrumb trail. A document shows its title; an admin screen shows its name, and nested screens show the path to them (Settings › General). Earlier items are links back up the trail.
    -   **End:** one control. For a document, a View | Edit toggle (globe and pencil icons). For an admin screen, the screen's actions.
-   **Its ends are as wide as each other**, so the trail sits in the middle of the bar whatever is at either end.
-   **Controls in it are compact (32px)**, so a View | Edit toggle and an Add button are the same size in the same place.

Code: `shell-document-bar.tsx` (`ShellTitle`, `ShellDocumentBar`, `ShellPageBar`) and `shell-document-bar.module.scss`.

## Contextual controls by mode

| Mode | Title box | Middle of the bar | End, before the cluster |
| --- | --- | --- | --- |
| Site | Document title, View \| Edit | Save, when there are unsaved style changes | Styles |
| Styling | Document title, View \| Edit | Save, when there are unsaved style changes | Styles (pressed) |
| Editing | Document title, View \| Edit | The editor's own tools, either side of the box | — |
| Admin screen | Trail, screen actions | — | — |

-   **The editor's header is laid out in the bar.** Its tools fill the space between the two clusters, around the title box, rather than the editor having a bar of its own beneath the shell's.
-   **Admin screens have no header of their own.** Their name and actions are in the bar, and their content starts at the top of the page.

## Motion

Motion is there to show what changed, so what stays the same doesn't move.

-   **Global controls stay still.** The clusters never animate between modes.
-   **Contextual controls fade.** When the editor's tools arrive or leave, they fade in place. They don't slide, which would suggest they came from somewhere.
-   **The site scales; it doesn't reflow** (see above).
-   **The editor appears once it has rendered.** The site stays visible until the editor's canvas has content, then the editor fades in over it. You never see an empty canvas or a flash of white.
-   **Editing draws the site back slightly.** Once the editor is showing, its canvas eases back to 95% of its size, so the content sits inside the bar's frame and edit mode reads as different from browsing. This is a lighter version of Zoom out, without switching the editor into Zoom out mode.
-   **Reduced motion is respected.** Each transition becomes an immediate change.

Code: `fadeInEditor` and `scaleEditorCanvas` in `shell.tsx`; the `site-shell-fade-in` keyframes in `shell.module.scss`.

## The menu

-   **The site's identity heads the menu:** its name, with its address in smaller muted text beneath. The menu is where you go to move around the site's admin, so that is where the site is named.
-   **Below it, the admin navigation.**
-   **Over the site, the menu pushes the site aside** by scaling it, rather than covering it.

Code: `shell-site-identity.tsx` and the `<nav>` in `shell.tsx`.

## Extensibility

A screen (a route in `routes/*` with `page: site-shell`) can describe itself to the shell. It cannot change the shell's structure.

-   **What a screen provides:**
    -   **Its name:** a `title` in its route config.
    -   **Its trail:** optional `breadcrumbs` in its route config, as `{ label, to? }` items, for screens nested under another.
    -   **Its actions:** a `ShellPageActions` fill, from boot's private APIs. Give it at most the screen's main action as a button (such as Add), with any others in a ⋯ menu after it. The title box has room for one action, not a toolbar.
    -   **Its content:** a `Page` without a header, since the bar names it.
-   **What a screen does not provide:** the global clusters, the title box's shape or position, or the separators. These belong to the shell and are the same everywhere.

`ShellPageActions` is a private API rather than a fill by name because each route bundles its own copy of `@wordpress/components`, and a fill by name from that copy would not reach the shell's slot.

Code: `RouteConfig.breadcrumbs` in `packages/boot/src/store/types.ts`; `shell-page-actions.ts` and `private-apis.ts`; `routes/shell-pages/stage.tsx` as the example of a screen with an action.

## Open questions

These have not been decided. Don't read the current behaviour as a decision.

-   **Narrow windows.** The title box shrinks with the window, but the bar has no plan yet for when the editor's tools and the clusters no longer fit.
-   **The New menu.** Post and Page work; Media and User are placeholders.
-   **Search and Notifications** are placeholders for their design, not finished features.
-   **Moving from one document to another** while editing has no transition of its own.
-   **Plugins in the bar.** There is no way yet for a plugin to add to the bar or its clusters, and it is undecided whether there should be.
-   **Surface tint.** On some admin screens, DataViews renders its surfaces in grey while the rest of the content area is tinted by the theme seed. The cause is in `@wordpress/theme`'s achromatic threshold, not the shell.
