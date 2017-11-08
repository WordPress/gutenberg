# Gutenberg
[![Build Status](https://img.shields.io/travis/WordPress/gutenberg/master.svg)](https://travis-ci.org/WordPress/gutenberg)
[![Coverage](https://img.shields.io/codecov/c/github/WordPress/gutenberg/master.svg)](https://codecov.io/gh/WordPress/gutenberg)

Printing since 1440.

![Gutenberg editing](https://cldup.com/H0oKBfpidk.png)

This is the development hub for the <a href="https://make.wordpress.org/core/2017/01/04/focus-tech-and-design-leads/">editor focus in core</a>. Gutenberg is the project name. If you want the latest release for your WordPress, <a href="https://wordpress.org/plugins/gutenberg/">download Gutenberg from the WordPress.org plugins repository</a>. Conversations and discussions take place in #core-editor on <a href="https://make.wordpress.org/chat/">the core WordPress Slack</a>. This is our kickoff goal:

> The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery. — Matt Mullenweg

WordPress already supports a large amount of "blocks", but doesn't surface them very well, nor does it give them much in the way of layout options. By embracing the blocky nature of rich post content, we will surface the blocks that already exist, as well as provide more advanced layout options for each of them. This will allow you to easily compose beautiful posts like <a href="http://moc.co/sandbox/example-post/">this example</a>.

Check out the <a href="https://wordpress.org/gutenberg/handbook/reference/faq/">FAQ</a> for answers to the most common questions about the project.

## Contributors

Gutenberg is built by many contributors and volunteers. Please see the full list in <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTORS.md">CONTRIBUTORS.md</a>.

## Further Reading

- <a href="https://make.wordpress.org/core/2017/01/17/editor-technical-overview/">Editor Technical Overview</a>
- <a href="https://make.wordpress.org/core/2017/05/05/editor-how-little-blocks-work/">How Blocks Work</a>
- <a href="https://github.com/Automattic/wp-post-grammar">WP Post Grammar Parser</a>
- <a href="https://make.wordpress.org/core/tag/gutenberg/">Development updates on make.wordpress.org</a>
- <a href="https://wordpress.org/gutenberg/handbook/">Documentation: Creating Blocks, Reference, and Guidelines</a>

## How You Can Contribute

Please see <a href="https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md">CONTRIBUTING.md</a>.

## Why

One thing that sets WordPress apart from other systems is that it allows you to create as rich a post layout as you can imagine -- but only if you know HTML & CSS and build your own custom theme. By thinking of the editor as a tool to let you write rich posts, and in a few clicks create beautiful layouts, hopefully, we can make people start to _love_ WordPress, as opposed to pick it because it's what everyone else uses to blog.

## Ingredients

**The Block**

The web is mostly a vertical flow of content, as dictated by the document markup underneath. By surfacing each section of the document as a block to manipulate, we can contextually attach features that are unique to each block. Inspired by desktop layout apps, it's a way to add a breadth of advanced features without weighing down the UI.

By showing critical UI in the body of the content, many can get their basic blogging done, with rich layouts, without ever having to see the post settings.

**Advanced Formatting**

When the Post Settings sidebar is open — which it is by default — you are essentially in advanced layout mode. By default, you'll see all your meta boxes right there.

Every block can be _inspected_ by clicking it. And every block has advanced layout options available in the inspector; text might have drop-cap, image might have fixed position scrolling. As such, block attributes fall into two camps — the most important ones available right on the block, advanced ones living in the sidebar inspector.
