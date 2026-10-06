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

Each JSON file contains both primitive and semantic token definitions in a hierarchical structure. `wpds.resolver.json` composes those base sources with the contextual values in `/modes`. These files are the source of truth for the design system and are processed during the build step to generate published assets in `/prebuilt` and internal TypeScript sources in `/src/prebuilt`.

## Token Naming

Semantic tokens follow a consistent naming pattern that encodes the token's purpose. See the [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md) for the naming pattern, the meaning of each segment (type, property, target, tone, emphasis, state), guidance on how to pick the right token, and the complete generated list of token names.

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

The design tokens use [the `$extensions` feature](https://www.designtokens.org/tr/2025.10/format/#extensions-0) from the Design Tokens Format Module to add additional, optional support for proprietary data.

### Figma Support

Figma can import supported DTCG token types as variables through its [built-in design token importer](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables#h_01KAGYPSFC984XDB4YWBCNRZJ7). The resolver itself is not an import file. The files in `modes/` are partial resolver inputs, so they do not contain every variable needed to create a collection.

#### Generate border collection files

The normal theme build generates and formats the committed Figma files. To regenerate only those files, run from the repository root:

```sh
npm run --workspace @wordpress/theme build:figma
```

This command applies `wpds.resolver.json` to generate six complete DTCG files under `packages/theme/prebuilt/figma/`. Radius and width use separate collections so designers can choose corner radius and pixel density independently.

| Collection    | Files relative to `packages/theme/prebuilt/figma/`                                         | Default mode | Variables                               |
| ------------- | ------------------------------------------------------------------------------------------ | ------------ | --------------------------------------- |
| Border radius | `radius/none.json`, `radius/subtle.json`, `radius/moderate.json`, `radius/pronounced.json` | `subtle`     | `wpds-border/radius/{xs,sm,md,lg,xl}`   |
| Border width  | `width/standard.json`, `width/high-dpi.json`                                               | `standard`   | `wpds-border/width/{xs,sm,md,lg,focus}` |

Each file includes every token in its collection, including unchanged values, descriptions, types, and Figma scopes. The original hierarchy preserves variable names. Token aliases remain references instead of becoming literal values. The current border tokens contain no aliases. Aliases within a collection have automated coverage and were verified in Figma for both collection creation and mode updates.

These generated files are committed under `prebuilt/figma` and included in the npm package. Do not edit them as sources. `wpds.resolver.json`, its base sources, and the tracked files in `modes/` remain canonical inputs for both CSS and Figma generation.

#### Test in a Figma library branch

The theme library maintainer [tested this workflow in a Figma library branch](https://github.com/WordPress/gutenberg/pull/84035#issuecomment-6003936288) using the files from revision `0ca2ab2`. Collection creation preserved names, types, descriptions, scopes, values, and aliases. Radius and width modes switched independently. Existing-value updates preserved variable IDs and bindings. New variables required creation through the API/plugin before their values could be imported.

Files imported together were ordered alphabetically, so set `subtle` and `standard` as the default modes explicitly. Rebinding a test component propagated to its instance, but the instance's existing `pronounced` selection remained attached to the old collection. Reapply mode selections from the new collections after rebinding. This test does not establish that the full library has been migrated. Use the following checks for future changes and record the results in [#82561](https://github.com/WordPress/gutenberg/issues/82561).

Expected pixel values:

| Mode                | `xs` | `sm` | `md` | `lg` | `xl` or `focus` |
| ------------------- | ---- | ---- | ---- | ---- | --------------- |
| Radius `none`       | 0    | 0    | 0    | 0    | 0               |
| Radius `subtle`     | 1    | 2    | 4    | 8    | 12              |
| Radius `moderate`   | 6    | 8    | 12   | 16   | 20              |
| Radius `pronounced` | 18   | 20   | 22   | 24   | 26              |
| Width `standard`    | 1    | 2    | 4    | 8    | 2               |
| Width `high-dpi`    | 1    | 2    | 4    | 8    | 1.5             |

1. Create a branch of the theme library. In the Variables view, create the Border radius collection and drag in all four `radius/` files together. Repeat with the two `width/` files in Border width. Check mode names against the filenames, rename them if needed, and set `subtle` and `standard` as the defaults.
2. Check that each collection has five Number variables with the names above. Radius variables must have the `CORNER_RADIUS` scope and width variables the `STROKE_FLOAT` scope. Check descriptions and the pixel values in the table.
3. Bind a sample component's corner radius and stroke width to the new variables. Switch both collections' modes independently on an object or page. High-DPI is an explicit preview choice in Figma; the generated CSS selects it automatically through a resolution media query.
4. Change one existing value in a local source, regenerate the files, and right-click the corresponding Figma mode to select **Import mode**. Check that the matching variable updates and retains its bindings. Restore the source and import the original value again.
5. Add a temporary token to a local border source and regenerate. Confirm that importing into an existing mode does not create the new variable. Use the Figma API/plugin workflow to create it with the matching name, Number type, description, scope, and values for every mode, then verify later imports update it. Remove the temporary token after testing. This importer limitation was [reported by the theme library maintainer](https://github.com/WordPress/gutenberg/issues/82561#issuecomment-5799294192).
6. Add a temporary alias to another token within the same collection, regenerate, and test both creating a collection and updating a mode. Confirm that Figma preserves the alias relationship, then remove the temporary alias. Cross-collection aliases are outside these files; they need Figma's `com.figma.aliasData` extension and a separate validation.
7. Inspect components bound to the existing combined Border collection. Record their variable IDs and bindings before testing the split. Rebind components in the library branch and check that their instances use the new variables. Reapply existing mode selections from the new collections on affected objects and pages, then verify the intended values. Matching names alone do not preserve bindings or mode selections. Keep the existing collection until all affected bindings and mode selections have been checked.

Figma creates new variables only for supported tokens present with the same type in every imported file. Importing an existing mode updates variables with matching names and types. See [Figma's import documentation](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables#h_01KAGYPSFC984XDB4YWBCNRZJ7) for those constraints and [the separate typography issue](https://github.com/WordPress/gutenberg/issues/74620) for unsupported typography types. The generated files cover only border radius and width.

Token definitions include Figma scopes to show variables in the relevant fields, such as corner radius. These use the `$extensions['com.figma.scopes']` extension. See [Figma's `VariableScope` developer documentation](https://developers.figma.com/docs/plugins/api/VariableScope/) for the supported scopes.
