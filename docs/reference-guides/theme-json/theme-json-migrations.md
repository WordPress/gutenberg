# Migrating to Newer Versions

Using older versions will continue to be supported, but upgrading is recommended because new development will continue in the newer versions.

## Migrating from v1 to v2

Upgrading to v2 enables some new features and adjusts the naming of some old features to be more consistent with one another.

### Renamed properties

| v1                                         | v2                                   |
| ------------------------------------------ | ------------------------------------ |
| `settings.border.customColor`              | `settings.border.color`              |
| `settings.border.customRadius`             | `settings.border.radius`             |
| `settings.border.customStyle`              | `settings.border.style`              |
| `settings.border.customWidth`              | `settings.border.width`              |
| `settings.spacing.customMargin`            | `settings.spacing.margin`            |
| `settings.spacing.customPadding`           | `settings.spacing.padding`           |
| `settings.typography.customFontStyle`      | `settings.typography.fontStyle`      |
| `settings.typography.customFontWeight`     | `settings.typography.fontWeight`     |
| `settings.typography.customLineHeight`     | `settings.typography.lineHeight`     |
| `settings.typography.customTextDecoration` | `settings.typography.textDecoration` |
| `settings.typography.customTextTransform`  | `settings.typography.textTransform`  |

### New properties

-   `settings.appearanceTools`
-   `settings.color.defaultGradients`
-   `settings.color.defaultPalette`
-   `settings.color.text`
-   `settings.spacing.blockGap`
-   `settings.typography.letterSpacing`
-   `styles.typography.letterSpacing`
