# Block Editor Handbook

Hi! 👋 Welcome to the Block Editor Handbook.

The [**Block editor**](https://wordpress.org/gutenberg/) is a modern and up-to-date paradigm for WordPress site building and publishing. It uses a modular system of **Blocks** to compose and format content, and is designed to create rich and flexible layouts for websites and digital products.

The editor consists of several primary elements, as shown in the following figure:

![Quick view of the block editor](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/assets/overview-block-editor-2023.png)

The elements highlighted in the figure are:

1. **Inserter**: A panel for inserting blocks into the content canvas
2. **Content canvas**: The content editor, which holds content created with blocks
3. **Settings sidebar**: A sidebar panel for configuring a block’s settings (among other things)

Through the Block editor, you create content modularly using Blocks. There are a number of [core blocks](https://developer.wordpress.org/block-editor/reference-guides/core-blocks/) ready to be used, and you can also [create your own custom block](https://developer.wordpress.org/block-editor/getting-started/create-block/).

A [Block](https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/#blocks) is a discrete element such as a Paragraph, Heading, Media element, or Embed. Each block is treated as a separate element with individual editing and format controls. When all these components are pieced together, they make up the content that is then [stored in the WordPress database](https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/#serialization-and-parsing).

The Block Editor is the result of the [work done on the **Gutenberg project**](https://developer.wordpress.org/block-editor/getting-started/faq/#what-is-gutenberg) which is aimed to revolutionize the WordPress editing experience.

Besides offering an [enhanced editing experience](https://wordpress.org/gutenberg/) through visual content creation tools, the Block Editor is also a powerful developer platform with a [rich feature set of APIs](https://developer.wordpress.org/block-editor/reference-guides/) that allow it to be manipulated and extended in a multitude of different ways.

## Navigating this handbook

This handbook is focused on block development and is divided into five sections, each serving a different purpose.


**[Getting Started](https://developer.wordpress.org/block-editor/getting-started/)**

For those just starting out with block development this is where you can get set up with a [development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/) and learn the [fundamentals of block development](https://developer.wordpress.org/block-editor/getting-started/create-block/).


**[How-to Guides](https://developer.wordpress.org/block-editor/how-to-guides/)**

Here you can build on what you learned in the Getting Started section and learn how to solve particular problems that you might encounter. You can also get tutorials, and example code that you can reuse, for projects such as [building a full-featured block](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/) or [working with WordPress’ data](https://developer.wordpress.org/block-editor/how-to-guides/data-basics/). In addition you can learn [How to use JavaScript with the Block Editor](https://developer.wordpress.org/block-editor/how-to-guides/javascript/).


**[Reference Guides](https://developer.wordpress.org/block-editor/reference-guides/)**

This section is the heart of the handbook and is where you can get down to the nitty-gritty and look up the details of the particular API that you’re working with or need information on. Among other things, the [Block API Reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/) covers most of what you will want to do with a block, and each [component](https://developer.wordpress.org/block-editor/reference-guides/components/) and [package](https://developer.wordpress.org/block-editor/reference-guides/packages/) is also documented here. _Components are also documented via [Storybook](https://wordpress.github.io/gutenberg/?path=/story/docs-introduction--page)._


**[Explanations](https://developer.wordpress.org/block-editor/explanations/)**

This section enables you to go deeper and reinforce your practical knowledge with a theoretical understanding of the [Architecture](https://developer.wordpress.org/block-editor/explanations/architecture/) of the block editor. Its [Glossary of terms](https://developer.wordpress.org/block-editor/explanations/glossary/) and [FAQs](https://developer.wordpress.org/block-editor/getting-started/faq/) should answer any outstanding questions you may have.


**[Contributor Guide](https://developer.wordpress.org/block-editor/contributors/)**

Gutenberg is open source software and anyone is welcome to contribute to the project. This section details how to contribute and can help you choose in which way you want to contribute, whether that be with [code](https://developer.wordpress.org/block-editor/contributors/code/), with [design](https://developer.wordpress.org/block-editor/contributors/design/), with [documentation](https://developer.wordpress.org/block-editor/contributors/documentation/), or in some other way.


## Further resources

This handbook should be considered the canonical resource for all things related to block development. However there are other resources that can help you.

- [**WordPress Developer Blog**](https://developer.wordpress.org/news/) - An ever-growing resource of technical articles covering specific topics related to block development and a wide variety of use cases. The blog is also an excellent way to [keep up with the latest developments in WordPress](https://developer.wordpress.org/news/tag/roundup/).
- [**Learn WordPress**](https://learn.wordpress.org/) - The WordPress hub for learning resources where you can find courses like [Introduction to Block Development: Build your first custom block](https://learn.wordpress.org/course/introduction-to-block-development-build-your-first-custom-block/), [Converting a Shortcode to a Block](https://learn.wordpress.org/course/converting-a-shortcode-to-a-block/) or [Using the WordPress Data Layer](https://learn.wordpress.org/course/using-the-wordpress-data-layer/)
- [**WordPress.tv**](https://wordpress.tv/) - A hub of WordPress-related videos (from talks at WordCamps to recordings of online workshops) curated and moderated by the WordPress.org community. You’re sure to find something to aid your learning about [block development](https://wordpress.tv/?s=block%20development&sort=newest) or the [block-editor](https://wordpress.tv/?s=block%20editor&sort=relevance) here.
- [**Gutenberg repository**](https://github.com/WordPress/gutenberg/) - Development of the block editor project is carried out in this GitHub repository. It contains the code of interesting packages such as [`block-library`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src) (core blocks) or [`components`](https://github.com/WordPress/gutenberg/tree/trunk/packages/components) (common UI elements). _The [gutenberg-examples](https://github.com/WordPress/gutenberg-examples) repository is another useful reference._


## Are you in the right place?

[This handbook](https://developer.wordpress.org/block-editor) is targeted at those seeking to develop for the block editor, but several other handbooks exist for WordPress developers under [developer.wordpress.org](http://developer.wordpress.org/):

- [/themes](https://developer.wordpress.org/themes) - Theme Handbook
- [/plugins](https://developer.wordpress.org/plugins) - Plugin Handbook
- [/apis](https://developer.wordpress.org/apis) - Common APIs Handbook
- [/advanced-administration](https://developer.wordpress.org/advanced-administration) - WP Advanced Administration Handbook
- [/rest-api](https://developer.wordpress.org/rest-api/) - REST API Handbook
- [/coding-standards](https://developer.wordpress.org/coding-standards) - Best practices for WordPress developers