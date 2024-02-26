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

### `settings`

-   **Type:** `Object`
-   **Required** `no`

The settings object to use for the editor. This is optional and can be used to override the default settings.

### `children`

-   **Type:** `Element`
-   **Required** `no`

Children elements for which the BlockEditorProvider context should apply.
