# Block Editor Handbook

Welcome to the Block Editor Handbook.

The [**Block Editor**](https://wordpress.org/gutenberg/) is a modern paradigm for WordPress site building and publishing. It uses a modular system of **blocks** to compose and format content and is designed to create rich and flexible layouts for websites and digital products.

The Block Editor consists of several primary elements, as shown in the following figure:

![Quick view of the Block Editor](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/assets/overview-block-editor-2023.png)

The elements highlighted are:

1. **Inserter:** A panel for inserting blocks into the content canvas
2. **Content canvas:** The content editor, which holds content created with blocks
3. **Settings Panel** A panel for configuring a block’s settings when selected or the settings of the post

Through the Block Editor, you create content modularly using blocks. Many [blocks](https://developer.wordpress.org/block-editor/reference-guides/core-blocks/) are available in WordPress by default, and you can also [create your own](https://developer.wordpress.org/block-editor/getting-started/create-block/).

A [block](https://developer.wordpress.org/block-editor/explanations/architecture/key-concepts/#blocks) is a discrete element such as a Paragraph, Heading, Media, or Embed. Each block is treated as a separate element with individual editing and format controls. When all these components are pieced together, they make up the content of the page or post, which is then [stored in the WordPress database](https://developer.wordpress.org/block-editor/explanations/architecture/data-flow/#serialization-and-parsing).

The Block Editor is the result of the work done on the [**Gutenberg project**](https://developer.wordpress.org/block-editor/getting-started/faq/#what-is-gutenberg), which aims to revolutionize the WordPress editing experience.

Besides offering an [enhanced editing experience](https://wordpress.org/gutenberg/) through visual content creation tools, the Block Editor is also a powerful developer platform with a [rich feature set of APIs](https://developer.wordpress.org/block-editor/reference-guides/) that allow it to be manipulated and extended in countless ways.

## Navigating this handbook

This handbook is focused on block development and is divided into five major sections.

- **[Getting Started](https://developer.wordpress.org/block-editor/getting-started/):** For those just starting out with block development, this is where you can get set up with a [development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/) and learn the [fundamentals of block development](https://developer.wordpress.org/block-editor/getting-started/fundamentals/). Its [Quick Start Guide](https://developer.wordpress.org/block-editor/getting-started/quick-start-guide/) and [Tutorial: Build your first block](https://developer.wordpress.org/block-editor/getting-started/tutorial/) are great places to start learning block development.

- **[How-to Guides](https://developer.wordpress.org/block-editor/how-to-guides/):** Here, you can build on what you learned in the Getting Started section and learn how to solve particular problems. You will also find tutorials and example code to reuse in your own projects, such as [working with WordPress data](https://developer.wordpress.org/block-editor/how-to-guides/data-basics/) or [Curating the Editor Experience](https://developer.wordpress.org/block-editor/how-to-guides/curating-the-editor-experience/).

- **[Reference Guides](https://developer.wordpress.org/block-editor/reference-guides/):** This section is the heart of the handbook and is where you can get down to the nitty-gritty and look up the details of the particular API you’re working with or need information on. Among other things, the [Block API Reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/) covers most of what you will want to do with a block, and each [component](https://developer.wordpress.org/block-editor/reference-guides/components/) and [package](https://developer.wordpress.org/block-editor/reference-guides/packages/) is also documented here. _Components are also documented via [Storybook](https://wordpress.github.io/gutenberg/?path=/story/docs-introduction--page)._

- **[Explanations](https://developer.wordpress.org/block-editor/explanations/):** This section enables you to go deeper and reinforce your practical knowledge with a theoretical understanding of the [Architecture](https://developer.wordpress.org/block-editor/explanations/architecture/) of the Block Editor.

- **[Contributor Guide](https://developer.wordpress.org/block-editor/contributors/):** Gutenberg is open-source software, and everyone is welcome to contribute to the project. This section details how to contribute, whether with [code](https://developer.wordpress.org/block-editor/contributors/code/), [design](https://developer.wordpress.org/block-editor/contributors/design/), [documentation](https://developer.wordpress.org/block-editor/contributors/documentation/), or in some other way.

## Further resources

This handbook should be considered the canonical resource for all things related to block development. However, there are other resources that can help you.

- **[WordPress Developer Blog](https://developer.wordpress.org/news/):** An ever-growing resource of technical articles covering specific topics related to block development and a wide variety of use cases. The blog is also an excellent way to [keep up with the latest developments in WordPress](https://developer.wordpress.org/news/tag/roundup/).
- **[Learn WordPress](https://learn.wordpress.org/):** The WordPress hub for learning resources where you can find courses like [Introduction to Block Development: Build your first custom block](https://learn.wordpress.org/course/introduction-to-block-development-build-your-first-custom-block/), [Converting a Shortcode to a Block](https://learn.wordpress.org/course/converting-a-shortcode-to-a-block/), or [Using the WordPress Data Layer](https://learn.wordpress.org/course/using-the-wordpress-data-layer/)
- **[WordPress.tv](https://wordpress.tv/):** A hub of WordPress-related videos (from talks at WordCamps to recordings of online workshops) curated and moderated by the WordPress community. You’re sure to find something to aid your learning about [block development](https://wordpress.tv/?s=block%20development&sort=newest) or the [Block Editor](https://wordpress.tv/?s=block%20editor&sort=relevance) here.
- **[Gutenberg repository](https://github.com/WordPress/gutenberg/):** Development of the Block Editor takes place on GitHub. The repository contains the code of interesting packages such as [`block-library`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src) (core blocks) or [`components`](https://github.com/WordPress/gutenberg/tree/trunk/packages/components) (common UI elements). _The [block-development-examples](https://github.com/WordPress/block-development-examples) repository is another useful reference._
- **[End User Documentation](https://wordpress.org/documentation/):** This documentation site is targeted to the end user (not developers), where you can also find documentation about the [Block Editor](https://wordpress.org/documentation/category/block-editor/) and [working with blocks](https://wordpress.org/documentation/article/work-with-blocks/).

## Are you in the right place?

The Block Editor Handbook is designed for those looking to create and develop for the Block Editor. However, it's important to note that there are multiple other handbooks available within the [Developer Resources](https://developer.wordpress.org/) that you may find beneficial:

- [Theme Handbook](https://developer.wordpress.org/themes)
- [Plugin Handbook](https://developer.wordpress.org/plugins)
- [Common APIs Handbook](https://developer.wordpress.org/apis)
- [Advanced Administration Handbook](https://developer.wordpress.org/advanced-administration)
- [REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Coding Standards Handbook](https://developer.wordpress.org/coding-standards)
