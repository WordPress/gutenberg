# Markup representation of a block

When stored in the database or in templates as HTML files, blocks are represented using a [specific HTML grammar](https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/#data-and-attributes), which is technically valid HTML based on HTML comments that act as explicit block delimiters 

These are some of the rules for the markup used to represent a block:

- All core block comments start with a prefix and the block name: `wp:blockname`
- For custom blocks, `blockname` is `namespace/blockname`
- The comment can be a single line, self-closing, or wrapper for HTML content.
- Custom block settings and attributes are stored as a JSON object inside the block comment.

_Example: Markup representation of an `image` core block_

```
<!-- wp:image -->
<figure class="wp-block-image"><img src="source.jpg" alt="" /></figure>
<!-- /wp:image -->
```

The [markup representation of a block is parsed for the Block Editor](https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/) and the block's output for the front end:

- In the editor, WordPress parses this block markup, captures its data and loads its `edit` version
- In the front end, WordPress parses this block markup, captures its data and generates its final HTML markup

Whenever a block is saved, the `save` function, defined when the [block is registered in the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side), is called to return the markup that will be saved into the database within the block delimiter's comment. If `save` is `null` (common case for blocks with dynamic rendering), only a single line block delimiter's comment is stored, along with any attributes

The Post Editor checks that the markup created by the `save` function is identical to the block's markup saved to the database:

- If there are any differences, the Post Editor triggers a [block validation error](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation).
- Block validation errors usually happen when a block’s `save` function is updated to change the markup produced by the block.
- A block developer can mitigate these issues by adding a [**block deprecation**](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/) to register the change in the block.

The markup of a **block with dynamic rendering** is expected to change so the markup of these blocks is not saved to the database. What is saved in the database as representation of the block, for blocks with dynamic rendering, is a single line of HTML consisting on just the block delimiter's comment (including block attributes values). That HTML is not subject to the Post Editor’s validation.

_Example: Markup representation of a block with dynamic rendering (`save` = `null`) and attributes_

```html
<!-- wp:latest-posts {"postsToShow":4,"displayPostDate":true} /-->
```

## Additional Resources

- [Data Flow and Data Format](https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/)
- [Static vs. dynamic blocks: What’s the difference?](https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/)
- [Block deprecation – a tutorial](https://developer.wordpress.org/news/2023/03/10/block-deprecation-a-tutorial/)
- [Introduction to Templates > Block markup](https://developer.wordpress.org/themes/templates/introduction-to-templates/#block-markup) | Theme Handbook 