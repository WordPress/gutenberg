<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

-   [plugins](#plugins)
    -   [Extra Specificity](#extra-specificity)
    -   [CSS Variable Fallback](#css-variable-fallback)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# plugins

This foler contains all the applied plugins in G2.

## Extra Specificity

This plugin automatically compounds selector specificity by simply repeating the selector x number of times. For example, if a specificity of 3 is passed in, the plugin will transform:

```css
.css-abc123 {
	color: red;
}
```

into:

```css
.css-abc123.css-abc123.css-abc123 {
	color: red;
}
```

This is meant to prevent "hacks" from being applied to the component system via regular css selection (or rather to make it difficult/annoying to do so), forcing consumers to use the style system itself, for example, the `css` prop and theme variables, to apply custom styles.

It is currently set to a specificity of 1 to disable it. This may be reversed in the future. If it isn't reversed in the future, at some point we shoiuld just remove it.

## CSS Variable Fallback

The [`css-variables.js` ](./css-variables.js) plugin automatically generates fallback variables to support browsers that lack CSS variable support.

Given WordPress core is dropping IE11 support,we might be able to drop this plugin altogether.
