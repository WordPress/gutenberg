# Adding blocks

Each template or template part contains the [block grammar](https://developer.wordpress.org/block-editor/principles/key-concepts/#blocks), the HTML, for the selected blocks.

There is more than one way to add blocks to the theme files:

- Adding and editing blocks in the site editor and exporting the theme.
- Adding block HTML and comments to the HTML files manually.


## Working with blocks and templates in the site editor

The beta site editor is available from the WordPress admin area when full site editing is enabled.
To use the site editor, a full site editing theme must be installed and active.

The site editor is similar to the block editor, but for the site layout instead of the post and page content.

Two new menus have been added to the top toolbar of the editor:
One that shows a list of posts, pages and categories, and indicates the item that is being edited.

![Site editor toolbar page menu](https://github.com/carolinan/gutenberg/raw/add/docs-block-based-themes/docs/designers-developers/developers/tutorials/block-based-themes/block-based-themes-page-menu.png)

And a list of templates and template parts. Hovering over the parts will show a preview.

![Site editor toolbar template menu](https://github.com/carolinan/gutenberg/raw/add/docs-block-based-themes/docs/designers-developers/developers/tutorials/block-based-themes/block-based-themes-template-menu.png)

Template parts can be selected and edited directly in the site editor, like other blocks:

![A selected template part is highlighted and has a limited set of alignment controls](https://github.com/carolinan/gutenberg/raw/add/docs-block-based-themes/docs/designers-developers/developers/tutorials/block-based-themes/block-based-themes-editor-template-part.png)


Select the header template part in the menu to view and edit it individually.
Add the blocks that you would like in your header, for example a site title block, a navigation block, and an image.

Next, select the footer template part and add some content, for example a couple of widgets.

Select the index template again to view the temlate parts together in the page context.

To add a post loop to the index template, add a **query** block.
The query block includes the query loop and the query pagination.
The query loop and query pagination are also available as individual blocks.


## Saving templates and template part

When you have made your changes, click on the **update design** button in the upper right corner,
where you normally publish and update your content.

Select the templates and template parts that you want to save:

![The save menu displays a list of templates and template parts with checkboxes](https://github.com/carolinan/gutenberg/raw/add/docs-block-based-themes/docs/designers-developers/developers/tutorials/block-based-themes/block-based-themes-save.png)


When you save changes in the site editor, the files in the active theme is not udpated.

Instead, the templates and template parts are saved as custom post types, that are accessed via the appearance menu.
![The template parts view in the admin area displays a list of all saved template parts](https://github.com/carolinan/gutenberg/raw/add/docs-block-based-themes/docs/designers-developers/developers/tutorials/block-based-themes/block-based-themes-appearance-template-parts.png)


## Exporting changes

Saved templates and template parts can be exported as a partial theme from the Tools menu in the site editor.
The block HTML code can then be copied to the theme that you are editing.

