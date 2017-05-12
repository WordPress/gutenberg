# Gutenberg

Prototyping since 1440.

![Text block](https://wpcoredesign.mystagingwebsite.com/gutenberg/gutenberg.png)

This is the development and prototyping hub for the editor focus in core.
Gutenberg is the project name. Conversations and discussions take place in #core-editor in Slack. This is our kickoff goal:

> The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery. — Matt Mullenweg

WordPress already supports a large amount of "blocks", but doesn't surface them very well, nor give them many rich layout options. By embracing the blocky nature, we can hopefully surface blocks that already exist, as well as attach more advanced layout options to each of them, allowing you to easily write richer posts.

In the end you should be able to start up a new post, _type type type_ then _click click click_ and effortlessly end up with a rich post like this: <a href="http://moc.co/sandbox/example-post/">Example Post</a>.

## Overview

- <a href="https://make.wordpress.org/core/2017/01/17/editor-technical-overview/">Editor Technical Overview</a>
- <a href="https://wpcoredesign.mystagingwebsite.com/gutenberg/">Editor Mockups</a>
- <a href="https://wordpress.github.io/gutenberg/">Prototypes</a>.
- <a href="https://github.com/Automattic/wp-post-grammar">WP Post grammar parser</a>.

## How You Can Contribute

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## Why

One thing that sets WordPress apart from other systems is that it allows you to create as rich a post layout as you can imagine. But only if you know HTML & CSS and build your own custom theme. By thinking of the editor as a tool to let you write rich posts, and in a few clicks create beautiful layouts, hopefully we can make people start to _love_ WordPress, as opposed to pick it because it's what everyone else uses to blog.

## Ingredients

**The Block**

The web is mostly a vertical flow of content, as dictated by the document markup underneath. By surfacing each section of the document as a block to manipulate, we can contextually attach features that are unique to each block. Inspired by desktop layout apps, it's a way to add a breadth of advanced features without weighing down the UI.

By showing critical UI in the body of the content, many can get their basic blogging done, with rich layouts, without ever having to see the post settings.

**Advanced Formatting**

When the Post Settings sidebar is open — which it is by default — you are essentially in advanced layout mode. By default you'll see all your metaboxes right there.

Every block can be _inspected_ by clicking it. And every block has advanced layout options available in the inspector; text might have drop-cap, image might have fixed position scrolling. As such, block attributes fall in two camps — the most important ones available right on the block, advanced ones living in the sidebar inspector.

**The Newline as your Commandline**

When your cursor is on a new line, you can either start typing, or you can use one of these commands to do cool things:

- Type `/` to invoke the inserter.
- Type `-` to start a list, other Markdown tricks work too.
- Type `#` for headlines. Note the space.

Some of these work already, but the idea can be extended in the future. For example `#tagname` (no space) might let you add tags in the body of the content.
