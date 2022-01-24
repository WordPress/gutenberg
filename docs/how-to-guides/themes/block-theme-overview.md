# Block Theme

<div class="callout callout-alert">
These features are part of the full site editing project releasing in WordPress 5.9. You can provide feedback in the weekly #core-editor chats, or #fse-outreach-experiment channels, or async using GitHub issues.
</div>

## What is a block theme?

A block theme is a WordPress theme with templates entirely composed of blocks so that in addition to the post content of the different post types (pages, posts, ...), the block editor can also be used to edit all areas of the site: headers, footers, sidebars, etc.

## What is the structure of a block theme?

A very simple block theme is structured like so:

```
theme
|__ style.css
|__ theme.json
|__ functions.php
|__ templates
    |__ index.html
    |__ single.html
    |__ archive.html
    |__ ...
|__ parts
    |__ header.html
    |__ footer.html
    |__ sidebar.html
    |__ ...
```

The difference with existing WordPress themes is that the different templates in the template hierarchy, and template parts, are block templates instead of php files. In addition, this example includes a [`theme.json`](/docs/how-to-guides/themes/theme-json.md) file for some styles.

## What is a block template?

A block template is made up of a list of blocks. Any WordPress block can be used in a template. Templates can also reuse parts of their content using "Template Parts". For example, all the block templates can have the same header included from a separate `header.html` template part.

Here's an example of a block template:

```html
<!-- wp:site-title /-->

<!-- wp:image {"sizeSlug":"large"} -->
<figure class="wp-block-image size-large">
	<img src="https://cldup.com/0BNcqkoMdq.jpg" alt="" />
</figure>
<!-- /wp:image -->

<!-- wp:group -->
<div class="wp-block-group">
	<!-- wp:post-title /-->
	<!-- wp:post-content /-->
</div>
<!-- /wp:group -->

<!-- wp:group -->
<div class="wp-block-group">
	<!-- wp:heading -->
	<h2>Footer</h2>
	<!-- /wp:heading -->
</div>
<!-- /wp:group -->
```

## How to write and edit these templates?

Ultimately, any WordPress user with the correct capabilities (example: `administrator` WordPress role) will be able to access these templates in the WordPress admin, edit them in dedicated views and potentially export them as a theme.

As of Gutenberg 8.5, there are two ways to create and edit templates within Gutenberg.

### Edit templates within The "Appearance" section of WP-Admin

You can navigate to the temporary "Templates" admin menu under "Appearance" `wp-admin/edit.php?post_type=wp_template` and use this as a playground to edit your templates. Add blocks here and switch to the code editor mode to grab the HTML of the template when you are done. Afterwards, you can paste that markup into a file in your theme directory.

Please note that the "Templates" admin menu under "Appearance" will _not_ list templates that are bundled with your theme. It only lists new templates created by the specific WordPress site you're working on.

### Edit Templates within the Full-site Editor

To begin, create a blank template file within your theme. For example: `mytheme/templates/index.html`. Afterwards, open the Full-site editor. Your new template should appear as the active template, and should be blank. Add blocks as you normally would using Gutenberg. You can add and create template parts directly using the "Template Parts" block.

Repeat for any additional templates you'd like to bundle with your theme.

When you're done, click the "Export Theme" option in the "Tools" (ellipsis) menu of the site editor. This will provide you with a ZIP download of all the templates and template parts you've created in the site editor. These new HTML files can be placed directly into your theme.

Note that when you export template parts this way, the template part block markup will include a `postID` attribute that can be safely removed when distributing your theme.

## Templates CPT

If you save the templates directly from the temporary Templates admin menu, you'll be able to override your theme's templates.

Example: By using **single** as the title for your template and saving it, this saved template will take precedence over your theme's `single.html` file.

Note that it won't take precedence over any of your theme's templates with higher specificity in the template hierarchy. Resolution goes from most to least specific, looking first for a CPT post and then for a theme template, at each level.

## Theme Blocks

Some blocks have been made specifically for block themes. For example, you'll most likely use the **Site Title** block in your site's header while your **single** block template will most likely include a **Post Title** and a **Post Content** block.

As we're still early in the process, the number of blocks specifically dedicated to these block templates is relatively small but more will be added as we move forward with the project. As of Gutenberg 8.5, the following blocks are currently available:

-   Site Title
-   Template Part
-   Query
-   Query Loop
-   Query Pagination
-   Pattern
-   Post Title
-   Post Content
-   Post Author
-   Post Comment
-   Post Comment Author
-   Post Comment Date
-   Post Comments
-   Post Comments Count
-   Post Comments Form
-   Post Date
-   Post Excerpt
-   Post Featured Image
-   Post Hierarchical Terms
-   Post Tags

## Styling

One of the most important aspects of themes (if not the most important) is the styling. While initially you'll be able to provide styles and enqueue them using the same hooks themes have always used, the [Global Styles](/docs/how-to-guides/themes/theme-json.md) effort will provide a scaffolding for adding many theme styles in the future.

## Internationalization (i18n)

A pattern block can be used to insert translatable content inside a block template. Since those files are php-based, there is a mechanism to mark strings for translation or supply dynamic URLs.

#### Example

Register a pattern:

```php
<?php
register_block_pattern(
	'myblocktheme/wordpress-credit',
	array(
		'title'      => __( 'Wordpress credit', 'myblocktheme' ),
		'content'    => '
						<!-- wp:paragraph -->
						<p>' .
						sprintf(
							/* Translators: WordPress link. */
							esc_html__( 'Proudly Powered by %s', 'myblocktheme' ),
							'<a href="' . esc_url( __( 'https://wordpress.org', 'myblocktheme' ) ) . '" rel="nofollow">WordPress</a>'
						) . '</p>
						<!-- /wp:paragraph -->',
		'inserter'   => false
	)
);
```

Load the pattern in a template or template part:

```html
<!-- wp:group -->
<div class="wp-block-group">
	<!-- wp:pattern {"slug":"myblocktheme/wordpress-credit"} /-->
</div>
<!-- /wp:group -->
```

You can read more about [internationalization in WordPress here](https://developer.wordpress.org/apis/handbook/internationalization/).

## Classic Themes

Users of classic themes can also build custom block templates and use them in their Pages and Custom Post Types that support Page Templates.

Theme authors can opt-out of this feature by removing the `block-templates` theme support in their `functions.php` file.

```php
remove_theme_support( 'block-templates' );
```

## Accessibility

A [skip to content link](https://make.wordpress.org/accessibility/handbook/markup/skip-links/) is automatically added on the front of the website when a webpage includes a `<main>` HTML element.
The skip link points to the `<main>`.

The group, template part, and query blocks can be changed to use `<main>`. You can find the setting to change the HTML element in the block settings sidebar under Advanced.

## Resources

-   [Full Site Editing](https://github.com/WordPress/gutenberg/labels/%5BFeature%5D%20Full%20Site%20Editing) label.
-   [Theme Experiments](https://github.com/WordPress/theme-experiments) repository, full of block theme examples created by the WordPress community.
