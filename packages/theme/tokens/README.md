# Design Tokens Maintainer's Guide

Design tokens are the visual design atoms of a design system. They are named entities that store visual design attributes like colors, spacing, typography, and shadows. They serve as a single source of truth that bridges design and development, ensuring consistency across platforms and making it easy to maintain and evolve the visual language of an application.

Components that use these design tokens benefit from the consistency they guarantee with other components that extend from the same system. Future theming improvements or configurations like color theming (or "dark mode") or roundness will cascade automatically to these components without any additional effort on the part of the component maintainer.

This document includes information about how the design system maintains its tokens implementation. For information about how to use design tokens, refer to the [`@wordpress/theme` package README](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/README.md) and [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md).

## Structure

The design system follows the [Design Tokens Community Group (DTCG)](https://design-tokens.github.io/community-group/format/) specification and organizes tokens into distinct types based on what kind of visual property they represent. Token definitions are stored as JSON files in the `/tokens` directory:

| File              | Description                                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `color.json`      | Color palettes including primitive color ramps and semantic color tokens for backgrounds, foregrounds, strokes, and focus states |
| `dimension.json`  | Spacing scale and semantic spacing tokens for padding, margins, and sizing                                                       |
| `typography.json` | Font family stacks, font sizes, and line heights                                                                                 |
| `border.json`     | Border radius and width values                                                                                                   |
| `elevation.json`  | Shadow definitions for creating depth and layering                                                                               |
| `motion.json`     | Animation durations and easing curves                                                                                            |

Each JSON file contains both primitive and semantic token definitions in a hierarchical structure. These files are the source of truth for the design system and are processed during the build step to generate CSS custom properties and other output formats in `/src/prebuilt`.

## Token Naming

Semantic tokens follow a consistent naming pattern that encodes the token's purpose. See the [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md) for the naming pattern, the meaning of each segment (type, property, target, tone, emphasis, state), and guidance on how to pick the right token.

## Primitive and Semantic Tokens

**Primitive tokens** are internal, reusable, raw values emitted by the design system's theming. They are not part of the public API, but instead are referenced by semantic tokens, which use the underlying values and provide purpose and meaning to how those values are used.

**Semantic tokens** are the public API of the design system's tokens. They map to primitive token values, but the values are incidental, and a consumer is expected to choose a semantic token based on their specific use-case. The design system provides semantic tokens to cover a breadth of use-cases that are standardized at a design systems level.

This structure is meant to **shift the emphasis away from the values themselves and toward the meaning and purpose that the tokens represent**. Ultimately, the tokens still map to raw values that affect how a component is styled and those values should be internally consistent, but the primitive layer is an incidental concern of the theming internals and not a consideration of the end-user of the design system.

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

Someone using the design system should never see or concern themselves with either the `primitive.space.80` token or the underlying 4 pixel base unit, and instead focus on the semantics of how element size tokens apply to their component. In this example, a large token being used for a component that follows the size of buttons and inputs in the system.

## Custom Extensions

The design tokens use [the `$extensions` feature](https://www.designtokens.org/tr/drafts/format/#extensions-0) of the DTCG Tokens specification to add additional, optional support for proprietary data.

### Figma Support

The tokens are implemented so that they can be imported directly into Figma variables, using [Figma's built-in support for importing design tokens](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables#h_01KAGYPSFC984XDB4YWBCNRZJ7).

This also includes support for [variable modes](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables), which can be found under [the `modes/` directory](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/tokens/modes/).

Token definitions will also include relevant Figma scopes, which are useful to ensure that token values are only shown in relevant fields in the Figma interface (e.g. border radius tokens only shown in the radius selection fields). These are implemented through the `$extensions['com.figma.scopes']` extension, and a full list of supported scopes is available in [Figma's `VariableScope` developer documentation](https://developers.figma.com/docs/plugins/api/VariableScope/).
