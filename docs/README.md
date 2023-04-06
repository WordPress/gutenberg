# Block Editor Handbook

Hi! 👋 Welcome to the Block Editor Handbook.

The **block editor** is a modern and up-to-date paradigm for WordPress site building and publishing.

It uses a modular system of **Blocks** to compose and format content, and is designed to create rich and flexible layouts for websites and digital products.

The editor consists of a number of key elements which are highlighted in the following graphic:

![Quick view of the block editor](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/assets/quick-view-of-the-block-editor.png)

**Legend:**

1. _Block inserter_
2. _Block editor content area_
3. _Settings sidebar_

Content is created modularly using discrete blocks. A block is essentially a wrapper that contains and styles one or more individual items of content. The block editor is in contrast to the older TinyMCE editor which used freeform text with inserted media, embeds and Shortcodes. The block editor enables a superior editing experience and is intended to replace the TinyMCE editor.

A block is a discrete element such as a Paragraph, a Heading, a Media element, or an Embed. Each element is treated as a separate component. When all these components are pieced together, they make up the content of a post or page that is then stored in the WordPress database.

The block editor is designed with progressive enhancement in mind, meaning that it is backward compatible with all legacy content. Blocks also offer enhanced editing and format controls.

Not only does the block editor enhance the editing experience by offering visual drag-and-drop content creation tools, it is also a powerful developer platform with a rich feature-set of APIs that allow it to be manipulated and extended in a multitude of different ways.

### The Gutenberg project

“[Gutenberg](https://github.com/WordPress/gutenberg/)” is the codename for the project to develop the block editor. It aims to revolutionize the entire publishing experience, just as Johannes Gutenberg revolutionized the printed word back in the 15th century. 

The project is focused on creating a new editing experience, namely the block editor, and is currently in the second phase of a four-phase process that will affect every area of WordPress. 

The four phases are:

1. Editing, 
2. Customization (which includes Full Site Editing, Block Patterns, Block Directory and Block based themes), 
3. Collaboration,
4. Multilingual.

### Navigating this handbook
This handbook is neatly divided into five separate sections each of which serves a different purpose:

- **[Getting Started](https://developer.wordpress.org/block-editor/getting-started/)** - for those just starting out with block development this is where you can get set up with a [development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/) and learn the [fundamentals of block development](https://developer.wordpress.org/block-editor/getting-started/create-block/).
- **[How-to Guides](https://developer.wordpress.org/block-editor/how-to-guides/)** - here you can build on what you learned in the _Getting Started_ section and learn how to solve particular problems that you might encounter. You can also get tutorials, and example code that you can reuse, for projects such as [building a full-featured block](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/) or [working with WordPress’ data](https://developer.wordpress.org/block-editor/how-to-guides/data-basics/). In addition you can learn [How to use JavaScript with the Block Editor](https://developer.wordpress.org/block-editor/how-to-guides/javascript/).
- **[Reference Guides](https://developer.wordpress.org/block-editor/reference-guides/)** - this section is the heart of the handbook and is where you can get down to the nitty-gritty and look up the details of the particular API that you’re working with or need information on. Among other things, the [Block API Reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/) covers most of what you will want to do with a block, and each [component](https://developer.wordpress.org/block-editor/reference-guides/components/) and [package](https://developer.wordpress.org/block-editor/reference-guides/packages/) is also documented here. For components there is also the [Storybook tool](https://wordpress.github.io/gutenberg/?path=/story/docs-introduction--page).
- **[Explanations](https://developer.wordpress.org/block-editor/explanations/)** - this section enables you to go deeper and reinforce your practical knowledge with a theoretical understanding of the [Architecture](https://developer.wordpress.org/block-editor/explanations/architecture/) of the block editor. There’s also a useful [Glossary of terms](https://developer.wordpress.org/block-editor/explanations/glossary/), and the [FAQs](https://developer.wordpress.org/block-editor/explanations/faq/) should answer any outstanding questions you may have.
- **[Contributor Guide](https://developer.wordpress.org/block-editor/contributors/)e** - Gutenberg is open source software and anyone is welcome to contribute to the project. This section details how to contribute and can help you choose in which way you want to contribute, whether that be with [code](https://developer.wordpress.org/block-editor/contributors/code/), with [design](https://developer.wordpress.org/block-editor/contributors/design/), with [documentation](https://developer.wordpress.org/block-editor/contributors/documentation/), or in some other way.

### Further resources
This handbook should be considered the canonical resource for all things related to block development. However there are other resources that can help you.
#### Blog
The [WordPress Developer Blog](https://developer.wordpress.org/news/) is an ever-growing resource of technical articles covering specific topics related to block development and covering a wide variety of use cases. The blog is also an excellent way to keep up with the latest developments in WordPress.
#### Courses
There are some useful courses available on the [Learn WordPress](https://learn.wordpress.org/) site:

- [Introduction to Block Development: Build your first custom block](https://learn.wordpress.org/course/introduction-to-block-development-build-your-first-custom-block/) - This course is a step-by-step tutorial that gently guides you from first principles to accomplished block developer. The course will lead you by the hand in developing an example project. It will also provide you with a solid foundation that will help you make better use of this handbook.
- [Converting a Shortcode to a Block](https://learn.wordpress.org/course/converting-a-shortcode-to-a-block/) - This course shows you how to do something that is a common use case, namely taking a legacy shortcode based plugin and block-ifying it.
- [Using the WordPress Data Layer](https://learn.wordpress.org/course/using-the-wordpress-data-layer/) -  This course teaches the principles of working with WordPress data in the block editor.
#### Videos
[WordPress.tv](https://wordpress.tv/) is an ever-growing resource of videos ranging from talks at WordCamps to recordings of online workshops. You’re sure to find something to aid your learning and problem-solving here.

#### Code
Development of the block editor project is carried out in the [Gutenberg repository](https://github.com/WordPress/gutenberg/) on GitHub. The [blocks directory](hhttps://github.com/WordPress/gutenberg/tree/trunk/packages/blocks) provides some great examples demonstrating how the core blocks have been built.

The [gutenberg-examples](https://github.com/WordPress/gutenberg-examples) is another useful reference.

### Are you in the right place?
Several other handbooks exist for WordPress developers. This handbook is targeted at those seeking to develop for the block editor. However, other handbooks can be found in [developer.wordpress.org](http://developer.wordpress.org).

Here’s the full list:

- [/block-editor](https://developer.wordpress.org/block-editor) (Block Editor Handbook) - Docs about block development _(this handbook)_
- [/themes](https://developer.wordpress.org/themes) (Theme Handbook) - Docs about theme development
- [/plugins](https://developer.wordpress.org/plugins) (Plugin Handbook) - Docs about plugin development
- [/apis](https://developer.wordpress.org/apis) (Common APIs Handbook)  - Docs about APIs at WordPress
- [/advanced-administration](https://developer.wordpress.org/advanced-administration) (WP Advanced Administration Handbook) - Docs about advanced administration of WordPress
- [/rest-api](https://developer.wordpress.org/rest-api/) (REST API Handbook) - Docs about the WordPress REST API
- [/coding-standards](https://developer.wordpress.org/coding-standards) - Best practices for WordPress developers
