# Introduction

Welome to the Editor Handbook for Developers & Designers

Gutenberg is a transformation of the WordPress Editor for working with content.

![Gutenberg Demo](https://cldup.com/kZXGDcGPMU.gif)

Using a system of Blocks to compose and format content, the new block-based editor is designed to create rich, flexible layouts for websites and digital products.
Content is created in the unit of blocks instead of freeform text with inserted media, embeds and Shortcodes (there's a Shortcode block though).

Blocks treat Paragraphs, Headings, Media, Embeds all as components that strung together make up the content stored in the WordPress database, replacing the traditional concept of freeform text with embeded media and shortcodes. The new editor is designed with progressive enhancement, meaning it is back-compatible with all legacy content, offers a process to try to convert and split a Classic block into block equivalents using client-side parsing and finally the blocks offer enhanced editing and format controls.

The Editor offers rich new value to users with visual, drag-and-drop creation tools and powerful developer enhancements with modern vendor packages, reusable components, rich APIs and hooks to modify and extend the editor through Custom Blocks, Custom Block Styles and Plugins.

### Intended Audience

This guide doesn't intend to teach design or development, but is intended to provide reference material, examples and suggest a few best practices for design and development professionals to extend and modify the WordPress content editing interface with custom products.

## Quick Start

- Developer Intro | Designer Intro
- API References
- Design Patterns
- Developer Best Practices

## Diving Deeper

- **Design Best Practices**: Designing Custom Blocks
- **Developer Tutorial**: Building A Custom Block

## Packages

The new Block Editor ships with a number of generic JavaScript packages that can be used in your own projects or outside WordPress.

### Components

The @wordpress/components package is an abstract set of application components used in the editor like Buttons, Accordions and

### Block Library

The Block Library is the collection of blocks with the using the core namespace. e.g. core/paragraph, core/heading, core/embed.

### Data

The editor maintains data stores of post content, document settings, editor state, user preferences and more.

## Table of Contents

### Contributing

This guide is community-driven, so improvements and additions are welcome.
