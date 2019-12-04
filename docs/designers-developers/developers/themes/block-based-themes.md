# Block-based Themes (Experimental)

> This is the documentation for the current implementation of block-based themes, also known as Full Site Editing or Block Content Areas. These features are still experimental in the plugin. “Experimental” means this is just an early implementation that is subject to potential drastic and breaking changes in iterations based on feedback from users, contributors and theme authors.

> Documentation has been shared early to surface what’s being worked on and invite feedback from those experimenting with the APIs. You can provide feedback in the weekly #core-editor chats where the latest progress of this effort will be shared and discussed, or async via Github issues.

## What is a block-based theme?

A block-based theme is a WordPress theme that is entirely composed of blocks. In addition to the post content of the different Post Types (pages, posts, ...), the block editor can also be used to edit all areas of the site: headers, footers, sidebars,...

## What is the structure of a block-based theme?

A very simple block-based theme is structured like so:

```
theme
|__ style.css
|__ functions.php
|__ block-templates
    |__ index.html
    |__ single.html
    |__ archive.html
    |__ ...
|__ block-template-parts
    |__ header.html
    |__ footer.html
    |__ sidebar.html
    |__ ...
```

The difference with existing WordPress themes is that the different templates in the template hierarchy are block templates instead of php files.

## What is a block template?

A block template is made a list of blocks. Any WordPress block can be used in a template. Templates can also reuse parts of their content using "Template Parts". For example, all the block templates can have the same header included from a separate `header.html` template part.

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
	<div class="wp-block-group__inner-container">
		<!-- wp:post-title /-->
		<!-- wp:post-content /-->
	</div>
</div>
<!-- /wp:group -->

<!-- wp:group -->
<div class="wp-block-group">
	<div class="wp-block-group__inner-container">
		<!-- wp:heading -->
		<h2>Footer</h2>
		<!-- /wp:heading -->
	</div>
</div>
<!-- /wp:group -->
```

## How to write and edit these templates?

Ultimately, any WordPress user with the correct capabilities (example: `administrator` WordPress role) will be able to access these templates in the WordPress admin, edit them in dedicated views and potentially export the templates as a theme.

In the current iteration (at the time of writing this doc), you can navigate to the temporary "Templates" admin menu under "Appearance" `wp-admin/edit.php?post_type=wp_template` and use this as a playground to edit your templates.

Once ready, switch to the "Code editor" mode and grab the HTML of the template from there and put it in the right file of your theme directory.

## Templates CPT

If you save the templates directly from the temporary Templates admin menu, you'd be able to override your theme's templates. Example: By using **single** as a title for your template and saving it, this saved template will take precedence over your block theme's `single.html` file.

## Theme Blocks

Some blocks have been made specifically for block-based themes. For example, you'll most likely use the **Site Title** block in your site's header while your **single** block template will most likely include a **Post Title** and a **Post Content** block.

As we're still early in the process, the number of blocks specifically dedicated to these block templates is relatively small but more will be added as we move forward with the project.

## Styling

One of the most important aspects of themes (if not the most important) is the styles. While initially you'll be able to provide styles and enqueue them using the same hooks themes have always used, this is something that is still being explored.

## Resources

- [Full Site Editing](https://github.com/WordPress/gutenberg/labels/%5BFeature%5D%20Full%20Site%20Editing) label.
