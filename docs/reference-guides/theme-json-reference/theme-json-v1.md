# Theme.json Version 1 Reference

> This is the specification for  **version 1** of `theme.json`. This version works with WordPress 5.8 or later.

<div class="callout callout-alert">

Theme.json version 2 has been released with WordPress 5.9. WordPress will continue to support theme.json version 1. However new features will only be added to [new versions](/docs/reference-guides/theme-json-reference/theme-json-living.md).

When you are ready to upgrade, see the [theme.json migration guide](/docs/reference-guides/theme-json-reference/theme-json-migrations.md#migrating-from-v1-to-v2) for details on updating to the latest version.

</div>

This reference guide lists the settings and style properties defined in the `theme.json` schema. See the [theme.json how to guide](/docs/how-to-guides/themes/global-settings-and-styles.md) for examples and guidance on how to use the `theme.json` file in your theme.

## JSON Schema

The last schema for version 1 is available at `https://schemas.wp.org/wp/5.8/theme.json`.

Theme.json schemas for each WordPress version are available at `https://schemas.wp.org/wp/{{version}}/theme.json`. For example a schema for WordPress 5.8 is available at `https://schemas.wp.org/wp/5.8/theme.json`.

See [Developing with theme.json](/docs/how-to-guides/themes/global-settings-and-styles.md#developing-with-themejson) for how to use the JSON schema in your editor.

## Settings

### border

Settings related to borders.

| Property     | Type    | Default | Props |
| ------------ | ------- | ------- | ----- |
| customRadius | boolean | false   |       |

---

### color

Settings related to colors.

| Property       | Type    | Default | Props                |
| -------------- | ------- | ------- | -------------------- |
| custom         | boolean | true    |                      |
| customDuotone  | boolean | true    |                      |
| customGradient | boolean | true    |                      |
| duotone        | array   |         | colors, name, slug   |
| gradients      | array   |         | gradient, name, slug |
| link           | boolean | false   |                      |
| palette        | array   |         | color, name, slug    |

---

### layout

Settings related to layout.

| Property    | Type   | Default | Props |
| ----------- | ------ | ------- | ----- |
| contentSize | string |         |       |
| wideSize    | string |         |       |

---

### spacing

Settings related to spacing.

| Property      | Type    | Default           | Props |
| ------------- | ------- | ----------------- | ----- |
| customMargin  | boolean | false             |       |
| customPadding | boolean | false             |       |
| units         | array   | px,em,rem,vh,vw,% |       |

---

### typography

Settings related to typography.

| Property         | Type    | Default | Props            |
| ---------------- | ------- | ------- | ---------------- |
| customFontSize   | boolean | true    |                  |
| customLineHeight | boolean | false   |                  |
| dropCap          | boolean | true    |                  |
| fontSizes        | array   |         | name, size, slug |

---

### custom

Generate custom CSS custom properties of the form `--wp--custom--{key}--{nested-key}: {value};`. `camelCased` keys are transformed to `kebab-case` as to follow the CSS property naming schema. Keys at different depth levels are separated by `--`, so keys should not include `--` in the name.

---

## Styles

### border

Border styles.

| Property | Type   | Props |
| -------- | ------ | ----- |
| radius   | string |       |

---

### color

Color styles.

| Property   | Type   | Props |
| ---------- | ------ | ----- |
| background | string |       |
| gradient   | string |       |
| text       | string |       |

---

### spacing

Spacing styles.

| Property | Type   | Props                    |
| -------- | ------ | ------------------------ |
| margin   | object | bottom, left, right, top |
| padding  | object | bottom, left, right, top |

---

### typography

Typography styles.

| Property   | Type   | Props |
| ---------- | ------ | ----- |
| fontSize   | string |       |
| lineHeight | string |       |
