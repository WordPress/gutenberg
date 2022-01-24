# Building a custom block editor

The purpose of [this tutorial](/docs/reference-guides/platform/custom-block-editor/tutorial.md) is to step through the fundamentals of creating a custom instance of a "block editor".

![alt text](https://wordpress.org/gutenberg/files/2020/03/editor.png 'The Standalone Editor instance populated with example Blocks within a custom WP Admin page.')

The editor you will see in this tutorial (as above) is **_not_ the same Block Editor you are familiar with when creating Posts** in with WordPress. Rather it is an entirely **custom block editor instance** built using the lower-level [`@wordpress/block-editor`](https://developer.wordpress.org/block-editor/packages/packages-block-editor/) package (and friends).

## Following this tutorial

To follow along with this tutorial, you can [download the accompanying WordPress plugin](https://github.com/getdave/standalone-block-editor) which includes all of the examples for you to try on your own site.

## Code Syntax

Code snippets are provided using JSX syntax. Note it is not required to use JSX to create blocks or extend the editor, you can use plain JavaScript. However, once familiar with JSX, many developers tend find it is easier to read and write, thus most code examples you'll find use that syntax.

-   [Start custom block editor tutorial](/docs/reference-guides/platform/custom-block-editor/tutorial.md)
