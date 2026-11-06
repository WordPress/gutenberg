# Themes

The block editor provides a number of options for theme designers and developers, to interact with it, including theme-defined color settings, font size control, and much more.

## Types of themes

### Classic theme

In terms of block editor terminology this is any theme that defines its templates in the traditional `.php` file format, and that doesn't have an `index.html` format template in the `/block-templates` or `/templates` folders. A `Classic` theme has the ability to provide configuration and styling options to the block editor, and block content, via [Theme Supports](/docs/how-to-guides/themes/theme-support.md), or by including a [theme.json](/docs/how-to-guides/themes/global-settings-and-styles.md) file. A theme does not have to be a `Block` theme in order to take advantage of some of the flexibility provided by the use of a `theme.json` file.

### Block theme

This is any theme that has, at a minimum, an `index.html` format template in the `/block-templates` or `/templates` folders, and with templates  provided in form of block content markup. While many `Block` themes will make use of a `theme.json` file to provide configuration and styling settings, a `theme.json` is not a requirement of `Block` themes. The advantage of `Block` themes is that the block editor can be used to edit all areas of the site: headers, footers, sidebars, etc.

### Full site editing (FSE)

There isn't an FSE specific theme type. In WordPress > 5.9 FSE is enabled for any `Block` theme, ie. any theme that has an `index.html` format template in the `/block-templates` or `/templates` folders.

**Contents**

- [Global Settings (theme.json)](/docs/how-to-guides/themes/global-settings-and-styles.md)
- [Theme Support](/docs/how-to-guides/themes/theme-support.md)

## Comments in templates and patterns

A plain HTML comment (`<!-- note -->`) inside a block's delimiters in a template, template part, or pattern file makes that block invalid. The editor shows "This block contains unexpected or invalid content" and you can't edit the block visually.

Everything between a block's opening and closing delimiters belongs to that block. The block has no attribute that maps back to the comment, so when the editor serializes the block again the comment is missing and validation fails. A plain comment outside any block doesn't cause this, because the editor loads it as a Custom HTML block.

```html
<!-- wp:group -->
<div class="wp-block-group">
	<!-- This comment makes the Group block invalid. -->
	<!-- wp:heading -->
	<h2>Page not found</h2>
	<!-- /wp:heading -->
</div>
<!-- /wp:group -->
```

The editor keeps the invalid block's original markup, so the front end still renders as expected. "Attempt Block Recovery" removes the comment, so skip it if you want to keep the comment when you save the template or pattern.

To keep notes for yourself or your team, use one of these approaches instead:

-   **Patterns (`patterns/*.php`):** Use a PHP comment. WordPress runs pattern files as PHP, so the comment never reaches the block markup.

    ```php
    <?php
    /**
     * Title: 404 content
     * Slug: my-theme/404-content
     */
    ?>
    <?php /* Keep this heading in sync with the 404 copy. */ ?>
    <!-- wp:group -->
    <div class="wp-block-group">
    	<!-- wp:heading -->
    	<h2>Page not found</h2>
    	<!-- /wp:heading -->
    </div>
    <!-- /wp:group -->
    ```

-   **Templates and template parts (`templates/*.html`, `parts/*.html`):** Keep the note in your source code or documentation, because these files can't contain PHP. Or wrap the comment in a Custom HTML block, which you can place anywhere blocks are allowed, including inside a Group.

    ```html
    <!-- wp:html -->
    <!-- Keep this heading in sync with the 404 copy. -->
    <!-- /wp:html -->
    ```
