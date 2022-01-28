## Styles in the block editor

This document introduces the main concepts related to styles in the block editor. It points to the relevant reference guides and tutorials for readers to dig deeper into each one of the ideas presented. It's aimed to block authors and people working in the block editor project.

1. HTML and CSS
2. User-provided Block Styles
    - From UI controls to HTML markup
    - Block Supports API
    - Current limits of the Block Supports API
3. User-provided Global Styles

### 1. HTML and CSS

By creating a post in the block editor the user is creating a number of artifacts: a HTML document plus a number of CSS stylesheets, either embedded in the document or external.

On the one hand, the final HTML document is the result of a few things:

- the [WordPress templates](https://developer.wordpress.org/themes/basics/template-files/) defined by the theme
- the [blocks](https://developer.wordpress.org/block-editor/reference-guides/core-blocks/) and patterns in use that come with a predefined structure (HTML markup)
- the user modifications to the content: adding content, transforming existing content (convert a given paragraph into a heading), or modifying it (attaching a class or inline styles to a block)

On the other hand, there's a number of stylesheets being loaded in the front end:

- **Blocks**. The stylesheets that come with the block. In the front end, you can find a single stylesheet with all block styles defined by WordPress (`wp-block-library-*` ) or separate stylesheets per block in use (as in `wp-block-group-*`, `wp-block-columns-*`, etc). See [this note](https://make.wordpress.org/core/2021/07/01/block-styles-loading-enhancements-in-wordpress-5-8/) for the full details.
- **Global styles**. These styles are generated on the fly by using data coming from a theme.json file: see [note](https://make.wordpress.org/core/2021/06/25/introducing-theme-json-in-wordpress-5-8/), [reference](https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/), and [how to guide](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/). Specifically, it merges the contents of the theme.json coming with WordPress, the theme.json coming with the theme if any, and the user data provided via the global styles sidebar in the site editor. The result of processing this data is visible in the  `global-styles-inline-css` stylesheet.
- **Theme**. Historically, themes have enqueued their own stylesheets, where the id is based on the theme name, as in `twentytwentytwo-style-css`. In addition to having their own stylesheets they can now declare a theme.json file containing styles that will be part of the global stylesheet.
- **Other**. WordPress and plugins can also enqueue stylesheets.

### 2. User-provided block styles

Since the introduction of the block editor in WordPress 5.0, there were tools for the users to "add styles" to specific blocks. By using these tools, the user would attach new classes or inline styles to the blocks, modifying their visual aspect.

By default, blocks come with a given HTML markup. Think of the paragraph block, for example:

```html
<p></p>
```

In its simplest form, any style rule that targets the `p` selector will apply styles to this block, whether it comes from a block, a theme, etc.

The user may change the state of this block by applying different styles: a text alignment, a color, a font size, a line height, etc. These states are reflected in the HTML markup of the block in the form of HTML attributes, mainly through the `class` or `style` attributes, though it can be any other the block author sees fit.

After some user modifications to the block, the initial markup may become something like this:

```html
<p
	class="has-color has-green-color has-font-size has-small-font-size my-custom-class"
	style="line-height: 1em"
></p>
```

This is what we refer to as "user-provided block styles". Other names people use are local styles or serialized styles. Essentially, each tool (font size, color, etc) ends up adding some classes and/or inline styles to the block markup. The CSS styling for these classes is part of the block, global, or theme stylesheets.

The ability to modify a block state coupled with the fact that a block can live within any other block (think of a paragraph within a group), creates a vast amount of potential states and style possibilities.

#### From UI controls to HTML markup

If you follow the [block tutorial](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/) you can learn up about the different parts of the [block API](https://developer.wordpress.org/block-editor/reference-guides/block-api/) presented here in more detail and also build your own block. This is an introduction to the general concepts of how a block can let users edit its state.

To build an experience like the one described above a block author needs a few pieces:

1. **An UI control**. It presents the user some choices, for example, be able to change the font size of the block. The control takes care of reading the data from the block (does this block has already a font size assigned?) and other data it needs (what are the font sizes an user can use in this block?). See available [component library](https://developer.wordpress.org/block-editor/reference-guides/components/).
2. **A block attribute**. The block needs to hold data to know which modifications were applied to it: whether it has been given a font size already, for example. See how blocks can define [attributes](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-attributes/).
3. **Access to style data**. A control may need external information about the styles available for a given block: the list of colors, or the list of font sizes, for example. These are called "style presets", as they are a preselection of styles usually defined by the theme, although WordPress provides some defaults. Check the [list of data](https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/theme-json-living/#settings) a theme can provide to the editor and how a block author can get access to it via [useSetting](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#usesetting).
4. **Serialize the user style into HTML markup**. Upon an user action, the block HTML markup needs to be updated accordingly (apply the proper class or inline style). This process is called serialization and it is the [edit, save](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/), and [render_callback](https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/) responsibility: these functions take block data and convert it into HTML.

In essence, these are the essential mechanics a block author needs to care about for their block to be able to be styled by the user. While this can be done completely manually, there's an API that automates this process for common style needs: Block Supports.

#### Block Supports API

[Block supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) is an API that allows a block to declare what features it supports. By adding some info to their [block.json file](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/), the block tells the system what kind of actions a user can do to it.

For example:

```json
{
  "name": "core/paragraph", 
  "...": "...",
  "supports": {
	"typography": {
		"fontSize": true
	}
  }
}
```

In its `block.json`, the paragrah block declares support for font size. It means that there will be an UI control available for users to tweak the font size of that particular block. The system will take care of setting up the UI control data (the font size of the block if it has one already assigned, the list of available font sizes to show), and will serialize the block data into HTML markup upon user changes (attach classes and inline styles appropiately).

By using the block supports mechanism via `block.json`, the block author is able to create the same experience than before just by writing a couple of lines.

Besides the obvious advantage of having to do less work to achieve the same results, there's a few other advantages:

- the style information of the block becomes available for the native mobile apps and in the server
- the block will use the UI controls other blocks use for the same styles, creating a more coherent user experience
- the UI controls in use by the block will be automatically updated as they are improved, without the block author having to do anything

#### Current limits of the Block Supports API

While the Block Supports API provides value, it also comes with some limitations a block author needs to be aware of. To better visualize what they are, let's run with the following example of a table block:

```html
<table>
  <thead><tr><th>Header</th></tr></thead>
  <tbody>
    <tr><th>First</th></tr>
    <tr><th>Second</th></tr>
  </tbody>
  <tfoot>
    <tr><th>Footer</th></tr>
  </tfoot>
</table>
```

1. **Only one style type per block.**

One of the limitations is that, from all the [styles available](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/), there can be only one instance of any them in use by the block. Following the example, the table block can only have a single font size. If the block author wanted to have three different font sizes (head, body, and footer) it can't do it using the current block supports API. See [this issue](https://github.com/WordPress/gutenberg/issues/33255) for more detailed info and ways forward.

2. **Styles are serialized to the outermost HTML node of the block, the wrapper.**

The Block Supports API only serializes the font size value to the wrapper, resulting in the following HTML `<table class="has-small-font-size">` . The current block supports API doesn't serialize this value to a different node, for example, the `<tbody>`.

This is an active area of work you can follow [in the tracking issue](https://github.com/WordPress/gutenberg/issues/38167). The linked proposal is exploring a different way to serialize the user changes: instead of each block support serializing its own data (for example, classes such as `has-small-font-size`, `has-green-color`) the idea is the block would get a single class instead (for example, `wp-style-UUID`) and the contents of that class will be generated in the server by WordPress.

While work continues in that proposal, there's a scape hatch, an experimental option block authors can use. Any block support can skip the serialization to HTML markup by using  `__experimentalSkipSerialization`. For example:

```
{
  "name": "core/paragraph", 
  "...": "...",
  "supports": {
	"typography": {
		"fontSize": true,
		"__experimentalSkipSerialization": true
	}
  }
}
```

This means that the font size block supports will do all of the things (create an UI control, bind the block attribute to the control, etc) except serializing the user values into the HTML markup. The classes and inline styles will not be automatically applied to the wrapper and is the block author responsibility to implement this in the `edit`, `save`, and `render_callback` functions. See [this issue](https://github.com/WordPress/gutenberg/issues/28913) for examples of how it was done for some blocks provided by WordPress.

### 3. User-provided Global Styles

TODO.
