"TinyMCE Per Block" Prototype
=============================

This is a WordPress editor technical prototype to explore the feasability of decorating blocks as editable, initializing TinyMCE on only those blocks for which it is required.

## Demo

https://wordpress.github.io/gutenberg/tinymce-per-block/

## Background

This prototype implements ideas explored in the Make WordPress Core's [Editor Technical Overview](https://make.wordpress.org/core/2017/01/17/editor-technical-overview/) blog post. Instead of expecting TinyMCE to manage the entire markup of a post, this prototype instead uses a [formal post grammar](https://github.com/Automattic/wp-post-grammar) to parse a post's content in the browser client. The JavaScript data structure of the post content is then used to render a set of controls which form the visual representation of the editor. The look and feel of these controls can be extended through an included block registration API, with backwards compatibility for posts preserved by either a generic block type or automated migration (a solution is yet to be decided).

Examples:

- [Text Block](./src/blocks/text-block)
- [Image Block](./src/blocks/image-block)

## Status

This prototype currently implements:

- Content parsing
- Block registration
- Editor block list rendering
- Binding TinyMCE to blocks ([see `wp-blocks/bind-editable`](./src/external/wp-blocks/bind-editable))
- Block-level control changes (e.g. text centering)
- Serializing block content

The prototype lacks:

- Block reordering
- Inserting new blocks (including creating or splitting paragraphs)
- Selecting across paragraphs of text
- Backwards compatibility for non-block content

## Development

You must first [download and install Node.js](https://nodejs.org/en/download/) before you can build or develop this prototype. Next, in your terminal, navigate to the project directory and install dependencies:

```
npm install
```

**To develop with automatic recompilation:**

```
npm run dev
```

You can now visit [http://localhost:8081](http://localhost:8081) in your browser.

**To compile changes for commit:**

```
npm run build
```
