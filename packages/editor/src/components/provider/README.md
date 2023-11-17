# EditorProvider

EditorProvider is a component which establishes a new post editing context, and serves as the entry point for a new post editor (or post with template editor). 

It supports a big number of post types, including post, page, templates, custom post types, patterns, template parts.

All modification and changes are performed to the `@wordpress/core-data` store.

## Props

### `post`

-   **Type:** `Object`
-   **Required** `yes`

The post object to edit

### `__unstableTemplate`

-   **Type:** `Object`
-   **Required** `no`

The template object wrapper the edited post. This is optional and can only be used when the post type supports templates (like posts and pages).

### `mode`

-   **Type:** `String`
-   **Required** `no`
-   **default** `all`

This is the rendering mode of the post editor. We support multiple rendering modes:

-   `all`: This is the default mode. It renders the post editor with all the features available. If a template is provided, it's preferred over the post.
-   `template-only`: This mode renders the editor with only the template blocks visible.
-   `post-only`: This mode extracts the post blocks from the template and renders only those. The idea is to allow the user to edit the post/page in isolation without the wrapping template.
-   `template-locked`: This mode renders both the template and the post blocks but the template blocks are locked and can't be edited. The post blocks are editable.

### `settings`

-   **Type:** `Object`
-   **Required** `no`

The settings object to use for the editor. This is optional and can be used to override the default settings.

### `children`

-   **Type:** `Element`
-   **Required** `no`

Children elements for which the BlockEditorProvider context should apply.
