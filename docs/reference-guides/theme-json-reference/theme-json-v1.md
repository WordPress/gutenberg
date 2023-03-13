# Version 1 Reference

Theme.json version 2 has been released, see the [theme.json migration guide](/docs/reference-guides/theme-json-reference/theme-json-migrations.md#migrating-from-v1-to-v2) for updating to the latest version.

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
