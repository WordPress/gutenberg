# Design Tokens Maintainer's Guide

This maintainer-facing guide explains how the WordPress Design System token source files are organized and generated.

For consumer-facing usage, start with the [`@wordpress/theme` package README](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/README.md) and the generated [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md).

## Structure

The design system follows the [Design Tokens Format Module](https://www.designtokens.org/tr/2025.10/format/) report from the Design Tokens Community Group (DTCG) and organizes tokens into distinct types based on what kind of visual property they represent. Token definitions are stored as JSON files in the `/tokens` directory:

| File              | Description                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `color.json`      | Color palettes including primitive color ramps and semantic color tokens for backgrounds, foregrounds, strokes, and focus states |
| `dimension.json`  | Spacing scale and semantic spacing tokens for padding, margins, and sizing                                                       |
| `typography.json` | Font family stacks, font sizes, and line heights                                                                                 |
| `border.json`     | Border radius and width values                                                                                                   |
| `motion.json`     | Animation durations and easing curves                                                                                            |
| `cursor.json`     | Cursor values for interactive controls                                                                                           |

Each JSON file contains primitive values and semantic aliases. The build generates published assets in `/prebuilt` and internal TypeScript sources in `/src/prebuilt` from these definitions.

The primitive colors in `color.json` are generated, not hand-authored. To change them, edit the ramp configuration or algorithm and rebuild. The semantic aliases in that file are hand-authored and connect ramp steps to their UI roles. See [Building color ramps](../src/color-ramps/README.md) for the configuration, build flow, and checks.

## Token Naming

Semantic tokens follow a consistent naming pattern that encodes the token's purpose. See the [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md) for the naming pattern, the meaning of each segment (type, property, target, tone, emphasis, state), guidance on how to pick the right token, and the complete generated list of token names.

## Primitive and Semantic Tokens

**Primitive tokens** are internal raw values, such as a color or spacing size. They are not part of the public API.

**Semantic tokens** are the public names that reference those values and describe their intended use. Choose a token by its purpose, not by the value it happens to have in the default theme.

Example:

```jsonc
{
	"wpds-dimension": {
		"$type": "dimension",
		"primitive": {
			"space": {
				// ...
				"80": {
					"$value": { "value": 40, "unit": "px" }
				}
				// ...
			}
		},
		"size": {
			// ...
			"lg": {
				"$value": "{wpds-dimension.primitive.space.80}",
				"$description": "Default size for buttons and inputs"
			}
			// ...
		}
	}
}
```

In the example above, the CSS properties generated from these tokens would include:

```css
--wpds-dimension-size-lg: 40px;
```

Consumers use `--wpds-dimension-size-lg` for elements that follow the large button and input size, without depending on the internal `primitive.space.80` name or its value.

## Custom Extensions

The design tokens use [the `$extensions` feature](https://www.designtokens.org/tr/2025.10/format/#extensions-0) from the Design Tokens Format Module to add additional, optional support for proprietary data.

### Figma Support

The tokens are implemented so that they can be imported directly into Figma variables, using [Figma's built-in support for importing design tokens](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables#h_01KAGYPSFC984XDB4YWBCNRZJ7).

This also includes support for [variable modes](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables), which can be found under [the `modes/` directory](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/modes/).

Token definitions will also include relevant Figma scopes, which are useful to ensure that token values are only shown in relevant fields in the Figma interface (e.g. border radius tokens only shown in the radius selection fields). These are implemented through the `$extensions['com.figma.scopes']` extension, and a full list of supported scopes is available in [Figma's `VariableScope` developer documentation](https://developers.figma.com/docs/plugins/api/VariableScope/).
