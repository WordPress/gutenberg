# Block Theme

These features are experimental and part of the Gutenberg plugin.
For block theme features supported by WordPress 5.9 see the [Theme Developer Handbook](https://developer.wordpress.org/themes/block-themes/).

You can provide feedback in the weekly #core-editor chats, or #fse-outreach-experiment channels, or async using GitHub issues.

## What is a block theme?

A block theme is a WordPress theme with templates entirely composed of blocks so that in addition to the post content of the different post types (pages, posts, ...), the block editor can also be used to edit all areas of the site: headers, footers, sidebars, etc.

## Global styles presets

In addition to the default theme.json file, Block Themes can define multiple global styles presets for users to pick from. For example, a theme author might provide multiple theme color variations for the theme.

To provide a global styles preset, themes can add multiple JSON files inside their `/styles` folder. Each one of these JSON file is a mini theme.json file containing `styles` and/or `settings` that overrides any of the default `theme.json` file settings or styles.

**Example**

```json
// styles/red.json
{
	styles: {
		colors: {
			text: 'red',
			background: 'white'
		}
	}
}
```

```json
// styles/dark.json
{
	styles: {
		colors: {
			text: 'white',
			background: 'black'
		}
	}
}
```
