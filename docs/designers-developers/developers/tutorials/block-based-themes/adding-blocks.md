# Adding blocks

Each template or template part contains the [block grammar](https://developer.wordpress.org/block-editor/principles/key-concepts/#blocks), the HTML, for the selected blocks.

There is more than one way to add blocks to the theme files:

- Adding and editing blocks in the site editor and exporting the theme.
- Adding block HTML and comments to the HTML files manually.


## Adding blocks using the site editor

The beta site editor is available from the WordPress admin area when full site editing is enabled.
To use the site editor, a full site editing theme must be installed and active.

The site editor is similar to the block editor, but for the site layout instead of the post and page content.

Two new menus have been added to the top toolbar of the editor:
One that shows a list of posts, pages and categories, and indicates the item that is being edited.
(image)

And a list of templates and template parts. Hovering over the parts will show a preview.
(image)

When the example theme is active and viewed in the site editor, you will see a blank page with a dark grey background,
because the theme has no blocks yet.

Select the header template part in the menu to view and edit it as an individual part.

Add the blocks that you would like in your header, for example a site title block, a navigation block, and an image.
When you have made your changes, click on the **update design** button in the upper right corner,
where you normally publish and update your content.

Next, select the footer template part and add some content, for example a couple of widgets.

Select the index template again to view the temlate parts together in the page context.

To add a post loop to the index template, add a **query** block.

The query block includes the query loop and the query pagination.
The query loop and query pagination are also available as individual blocks.



