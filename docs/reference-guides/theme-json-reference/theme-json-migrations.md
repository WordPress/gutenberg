# Migrating Theme.json to Newer Versions

This guide documents the changes between different `theme.json` versions and how to upgrade. Using older versions will continue to be supported. Upgrading is recommended because new development will continue in the newer versions.

## Migrating from v1 to v2

Upgrading to v2 enables some new features and adjusts the naming of some old features to be more consistent with one another.

### How to migrate from v1 to v2:

1. Update `version` to `2`.
2. Rename the properties that were updated (see below) if you're using them.

Refer to the [dev note for the release](https://make.wordpress.org/core/2022/01/08/updates-for-settings-styles-and-theme-json/) and the [reference documents](/docs/reference-guides/theme-json-reference/README.md) for the respective v1 and v2 versions.

### Renamed properties

| v1                                         | v2                                   |
| ------------------------------------------ | ------------------------------------ |
| `settings.border.customRadius`             | `settings.border.radius`             |
| `settings.spacing.customMargin`            | `settings.spacing.margin`            |
| `settings.spacing.customPadding`           | `settings.spacing.padding`           |
| `settings.typography.customLineHeight`     | `settings.typography.lineHeight`     |

### New properties

New top-level properties: `customTemplates`, `templateParts`.

Additions to settings:

- `settings.appearanceTools`
- `settings.border.color`
- `settings.border.style`
- `settings.border.width`
- `settings.color.background`
- `settings.color.defaultGradients`
- `settings.color.defaultPalette`
- `settings.color.text`
- `settings.spacing.blockGap`
- `settings.typography.fontFamilies`
- `settings.typography.fontStyle`
- `settings.typography.fontWeight`
- `settings.typography.letterSpacing`
- `settings.typography.textColumns`
- `settings.typography.textDecoration`
- `settings.typography.textTransform`

Additions to styles:

- `styles.border.color`
- `styles.border.style`
- `styles.border.width`
- `styles.filter.duotone`
- `styles.spacing.blockGap`
- `styles.typography.fontFamily`
- `styles.typography.fontStyle`
- `styles.typography.fontWeight`
- `styles.typography.letterSpacing`
- `styles.typography.textColumns`
- `styles.typography.textDecoration`
- `styles.typography.textTransform`

### Changes to property values

The default font sizes provided by core (`settings.typography.fontSizes`) have been updated. The Normal and Huge sizes (with `normal` and `huge` slugs) have been removed from the list, and Extra Large (`x-large` slug) has been added. When the UI controls show the default values provided by core, Normal and Huge will no longer be present. However, their CSS classes and CSS Custom Properties are still enqueued to make sure existing content that uses them still works as expected.

## Migrating from v2 to v3

Upgrading to v3 adjusts preset defaults to be more consistent with one another.

### How to migrate from v2 to v3:

1. Update `version` to `3`.
2. Configure the changed defaults (see below).

### Changed defaults

#### `settings.typography.defaultFontSizes`

In theme.json v2, the default font sizes were only shown when theme sizes were not defined. A theme providing font sizes with the same slugs as the defaults would always override them.

The default `fontSizes` slugs are: `small`, `medium`, `large`, `x-large`, and `xx-large`.

The new `defaultFontSizes` option gives control over showing default font sizes and preventing those defaults from being overridden.

- When set to `true` it will show the default font sizes and prevent them from being overridden by the theme.
- When set to `false` it will hide the default font sizes and allow the theme to use the default slugs.

It is `true` by default when switching to v3. This is to be consistent with how other `default*` options work such as `settings.color.defaultPalette`, but differs from the behavior in v2.

In theme.json v2, the default font sizes were only shown when theme sizes were not defined. A theme providing font sizes with the same slugs as the defaults would always override the default ones.

To keep behavior similar to v2 with a v3 theme.json:
* If you do not have any `fontSizes` defined, `defaultFontSizes` can be left out or set to `true`.
* If you have some `fontSizes` defined, set `defaultFontSizes` to `false`.
