# Markup representation of a block

Blocks are stored in the database or within HTML templates using a unique [HTML-based syntax](https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/#data-and-attributes), distinguished by HTML comments that serve as clear block delimiters. This ensures that block markup is technically valid HTML.

Here are a few guidelines for the markup that defines a block:

- Core blocks begin with the `wp:` prefix, followed by the block name (e.g., `wp:image`). Notably, the `core` namespace is omitted.
- Custom blocks begin with the `wp:` prefix, followed by the block namespace and name (e.g., `wp:namespace/name`).
- The comment can be a single line, self-closing, or wrapper for HTML content.
- Block settings and attributes are stored as a JSON object inside the block comment.

The following is the simplified markup representation of an Image block:

```html
<!-- wp:image {"sizeSlug":"large"} -->
<figure class="wp-block-image size-large">
    <img src="source.jpg" alt="" />
</figure>
<!-- /wp:image -->
```

The markup for a block is crucial both in the Block Editor and for displaying the block on the front end:

- WordPress analyzes the block's markup within the Editor to extract its data and present the editable version to the user.
- On the front end, WordPress again parses the markup to extract data and render the final HTML output.

<div class="callout callout-tip">
    Refer to the <a href="https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/">Data Flow</a> article for a more in-depth look at how block data is parsed in WordPress.
</div>

When a block is saved, the `save` function—defined when the [block is registered in the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side)—is executed to generate the markup stored in the database, wrapped in block delimiter comments. For dynamically rendered blocks, which typically set `save` to `null`, only a placeholder comment with block attributes is saved.

Here is the markup representation of a dynamically rendered block (`save` = `null`). Notice there is no HTML markup besides the comment.

```html
<!-- wp:latest-posts {"postsToShow":4,"displayPostDate":true} /-->
```

When a block has a `save` function, the Block Editor checks that the markup created by the `save` function is identical to the block's markup saved to the database:

- Discrepancies will trigger a [validation error](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#validation), often due to changes in the `save` function's output.
- Developers can address potential validation issues by implementing [block deprecations](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-deprecation/) to account for changes.

As the example above shows, the stored markup is minimal for dynamically rendered blocks. Generally, this is just a delimiter comment containing block attributes, which is not subject to the Block Editor's validation. This approach reflects the dynamic nature of these blocks, where the actual HTML is generated server-side and is not stored in the database.

## Additional resources

- [Data Flow and Data Format](https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/)
- [Static vs. dynamic blocks: What’s the difference?](https://developer.wordpress.org/news/2023/02/27/static-vs-dynamic-blocks-whats-the-difference/) | Developer Blog
- [Block deprecation – a tutorial](https://developer.wordpress.org/news/2023/03/10/block-deprecation-a-tutorial/) | Developer Blog
- [Introduction to Templates > Block markup](https://developer.wordpress.org/themes/templates/introduction-to-templates/#block-markup) | Theme Handbook 