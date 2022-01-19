# Full Site Editing Templates

## Template and template part flows

<div class="callout callout-alert">
This documentation is for block templates and template parts, these features are part of the Full Site Editing project releasing in WordPress 5.9.
</div>

This document will explain the internals of how templates and templates parts are rendered in the frontend and edited in the backend. For an introduction about block themes and Full site editing templates, refer to the [block theme documentation](/docs/how-to-guides/themes/block-theme-overview.md).

## Storage

Just like the regular templates, the block templates live initially as files in the theme folder but the main difference is that the user can edit these templates in the UI in the Site Editor.

When a user edits a template (or template-part), the initial theme template file is kept as is but a forked version of the template is saved to the `wp_template` custom post type (or `wp_template_part` for template parts).

These capabilities mean that at any point in time, a mix of template files (from the theme) and CPT templates (the edited templates) are used to render the frontend of the site.

## Synchronization

In order to simplify the algorithm used to edit and render the templates from two different places, we performed an operation called "template synchronization".

The synchronization consists of duplicating the theme templates in the `wp_template` (and `wp_template_part`) custom templates with an `auto-draft` status. When a user edits these templates, the status is updated to `publish`.

This means:

-   The rendering/fetching of templates only need to consider the custom post type templates. It is not necessary to fetch the template files from the theme folder directly. The synchronization will ensure these are duplicated in the CPT.
-   Untouched theme templates have the `auto-draft` status.
-   Edited theme templates have the `publish` status.

The synchronization is important for two different flows:

-   When editing the template and template parts, the site editor frontend fetches the edited and available templates through the REST API. This means that for all `GET` API requests performed to the `wp-templates` and `wp-template-parts` endpoint synchronization is required.
-   When rendering a template (sometimes referred to as "resolving a template"): this is the algorithm that WordPress follows to traverse the template hierarchy and find the right template to render for the current page being loaded.
-   When exporting a block theme, we need to export all its templates back as files. The synchronization is required to simplify the operation and only export the CPT templates.

## Switching themes

Since block themes make use of templates that can refer to each other and that can be saved to a custom post type, it becomes possible to mix templates and template parts from different themes. For example:

-   A user might like the "header" template part of theme A and would like to use it in theme B.
-   A user might like the "contact" template from theme A and would like to use it in theme B.

Enabling these flows will require well thought UIs and experience. For the current phase of Full-site editing, we're starting by forbidding these possibilities and making template and template-parts theme specific.

That said, it is still important to keep track of where the template and template part come from initially. From which theme, it's based. We do so by saving a `theme` post meta containing the theme identifier for each template and template part CPT entry.

In the future, we might consider allowing the user to mix template and template parts with different `theme` post meta values.
