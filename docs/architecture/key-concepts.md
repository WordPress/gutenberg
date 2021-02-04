# Key Concepts

## Blocks

Blocks are an abstract unit for organizing and composing content, strung together to create content for a webpage.

Blocks are hierarchical in that a block can be a child of or parent to another block. For example, a two-column Columns block can be the parent block to multiple child blocks in each of its columns.

If it helps, you can think of blocks as a more graceful shortcode, with rich formatting tools for users to compose content. To this point, there is a new Block Grammar. Distilled, the block grammar is an HTML comment, either a self-closing tag or with a beginning tag and ending tag. In the main tag, depending on the block type and user customizations, there can be a JSON object. This raw form of the block is referred to as serialized.

```html
<!-- wp:paragraph {"key": "value"} -->
<p>Welcome to the world of blocks.</p>
<!-- /wp:paragraph -->
```

Blocks can be static or dynamic. Static blocks contain rendered content and an object of Attributes used to re-render based on changes. Dynamic blocks require server-side data and rendering while the post content is being generated (rendering).

Each block contains Attributes or configuration settings, which can be sourced from raw HTML in the content via meta or other customizable origins.

The Paragraph is the default block. Instead of a new line upon typing `return` on a keyboard, try to think of it as an empty Paragraph block (type "/" to trigger an autocompleting Slash Inserter -- "/image" will pull up Images as well as Instagram embeds).

Users insert new blocks by clicking the plus button for the Block Inserter, typing "/" for the Slash Inserter, or typing `return` for a blank Paragraph block.

Blocks can be duplicated within content using the menu from the block's toolbar or via keyboard shortcut.

Blocks can also be made repeatable, allowing them to be shared across posts and post types and/or used multiple times in the same post. If a reusable block is edited in one place, those changes are reflected everywhere that that block is used.

Blocks can be limited or locked-in-place by Templates and custom code.

#### More on Blocks

- **Block API**
- **Block Styles**
- **Tutorial: Building A Custom Block**

## Block Categories

In the Block Inserter (the accordion-sorted, popup modal that shows a site's available blocks to users) each accordion title is a Block Category, which are either the defaults or customized by developers through Plugins or code.

## Reusable blocks

Reusable blocks is a block (or multiple blocks) that you can insert, modify, repeatable piece of content.

The content and style of a reusable block is intended to be consistent wherever it is used. 

Examples of reusable blocks include a block consisting of a heading whose content and a custom color that would be appear on multiple pages of the site and sidebar widgets that would appear on every page (widgets are planned to be available, but not yet possible, in Gutenberg). 

Any edits to a reusable block will appear on every other use of that block, saving time from having to make the same edit on different posts. 

Reusable blocks are stored as a hidden post type (wp_block) and are dynamic blocks that "ref" or reference the post_id and return the post_content for that block. 

The same reusable block can be used across different post types (e.g. post and page). 

If you need to create a structure (a block consisting of heading, paragraph, and list) that is very similar across multiple posts but the content is slightly different across those pages or posts, you can do the following to minimize the amount of duplicate work to do:

1. create a 'skeleton' that will have shared characteristics (e.g. the same color background, font size)
1. save this as a reusable block.
1. Then, on other pages/posts:
1. Within the block editor: insert the reusable block 
1. Open the block's properties (three dots)
and "convert to regular block"; the block is no longer 'reusable' and all edits to this block will only appear on this page/post.
