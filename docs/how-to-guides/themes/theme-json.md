# Themes & Block Editor: experimental theme.json

> **These features are still experimental**. “Experimental” means this is an early implementation subject to drastic and breaking changes.
>
> Documentation has been shared early to surface what’s being worked on and invite feedback from those experimenting with the APIs. Please, be welcomed to share yours in the weekly #core-editor chats as well as async via the Github issues and Pull Requests.

This is documentation for the current direction and work in progress about how themes can hook into the various sub-systems that the Block Editor provides.

-   Rationale
    -   Settings can be controlled per block
    -   Some block styles are managed
    -   CSS Custom Properties: presets & custom
-   Specification
    -   Settings
    -   Styles
    -   Other theme metadata
-   FAQ
    -   The naming schema of CSS Custom Properties
    -   Why using -- as a separator?
    -   How settings under "custom" create new CSS Custom Properties

## Rationale

The Block Editor API has evolved at different velocities and there are some growing pains, specially in areas that affect themes. Examples of this are: the ability to [control the editor programmatically](https://make.wordpress.org/core/2020/01/23/controlling-the-block-editor/), or [a block style system](https://github.com/WordPress/gutenberg/issues/9534) that facilitates user, theme, and core style preferences.

This describes the current efforts to consolidate the various APIs related to styles into a single point – a `experimental-theme.json` file that should be located inside the root of the theme directory.

### Global settings for the block editor

Instead of the proliferation of theme support flags or alternative methods, the `experimental-theme.json` files provides a canonical way to define the settings of the block editor. These settings includes things like:

-   What customization options should be made available or hidden from the user.
-   What are the default colors, font sizes... available to the user.
-   Defines the default layout of the editor. (widths and available alignments).

### Settings can be controlled per block

For more granularity, these settings also work at the block level in `experimental-theme.json`.

Examples of what can be achieved are:

-   Use a particular preset for a block (e.g.: table) but the common one for the rest of blocks.
-   Enable font size UI controls for all blocks but the headings block.
-   etc.

### Some block styles are managed

By using the `experimental-theme.json` file to set style properties in a structured way, the Block Editor can "manage" the CSS that comes from different origins (user, theme, and core CSS). For example, if a theme and a user set the font size for paragraphs, we only enqueue the style coming from the user and not the theme's.

Some of the advantages are:

-   Reduce the amount of CSS enqueued.
-   Prevent specificity wars.

### CSS Custom Properties

There are some areas of styling that would benefit from having shared values that can change across a site instantly.

To address this need, we've started to experiment with CSS Custom Properties, aka CSS Variables, in some places:

-   **Presets**: [color palettes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-color-palettes), [font sizes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-font-sizes), or [gradients](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-gradient-presets) declared by the theme are converted to CSS Custom Properties and enqueued both the front-end and the editors.

{% codetabs %}
{% Input %}

```json
{
	"settings": {
		"defaults": {
			"color": {
				"palette": [
					{
						"name": "Black",
						"slug": "black",
						"color": "#000000"
					},
					{
						"name": "White",
						"slug": "white",
						"color": "#ffffff"
					}
				]
			}
		}
	}
}
```

{% Output %}

```css
:root {
	--wp--preset--color--black: #000000;
	--wp--preset--color--white: #ffffff;
}
```

{% end %}

-   **Custom properties**: there's also a mechanism to create your own CSS Custom Properties.

{% codetabs %}
{% Input %}

```json
{
	"settings": {
		"defaults": {
			"custom": {
				"line-height": {
					"body": 1.7,
					"heading": 1.3
				}
			}
		}
	}
}
```

{% Output %}

```css
:root {
	--wp--custom--line-height--body: 1.7;
	--wp--custom--line-height--heading: 1.3;
}
```

{% end %}

## Specification

This specification is the same for the three different origins that use this format: core, themes, and users. Themes can override core's defaults by creating a file called `experimental-theme.json`. Users, via the site editor, will also be also to override theme's or core's preferences via an user interface that is being worked on.

The `experimental-theme.json` file declares how a theme wants the editor configured (`settings`) as well as the style properties it sets (`styles`).

```
{
  "settings": { ... },
  "styles": { ... }
}
```

Both settings and styles can contain subsections for any registered block. As a general rule, the names of these subsections will be the block names ― we call them "block selectors". For example, the paragraph block ―whose name is `core/paragraph`― can be addressed in the settings using the key (or "block selector") `core/paragraph`:

```
{
  "settings": {
    "core/paragraph": { ... }
  }
}
```

There are a few cases in whiche a single block can represent different HTML markup. The heading block is one of these, as it represents h1 to h6 HTML elements. In these cases, the block will have as many block selectors as different markup variations ― `core/heading/h1`, `core/heading/h2`, etc, so they can be addressed separately:

```
{
  "styles": {
    "core/heading/h1": { ... },
    // ...
    "core/heading/h6": { ... },
  }
}
```

Additionally, there are two other block selectors: `root` and `defaults`. The `root` block selector represents the root of the site. The `defaults` block selector represents the defaults to be used by blocks if they don't declare anything.

### Settings

The settings section has the following structure and default values:

```
{
  "settings": {
    "defaults": {
      "layout": { /* Default layout to be used in the post editor */
        "contentSize": "800px",
        "wideSize": "1000px",
      }
      "border": {
        "customRadius": false /* true to opt-in */
      },
      "color": {
        "custom": true, /* false to opt-out, as in add_theme_support('disable-custom-colors') */
        "customGradient": true, /* false to opt-out, as in add_theme_support('disable-custom-gradients') */
        "gradients": [ ... ], /* gradient presets, as in add_theme_support('editor-gradient-presets', ... ) */
        "link": false, /* true to opt-in, as in add_theme_support('experimental-link-color') */
        "palette": [ ... ], /* color presets, as in add_theme_support('editor-color-palette', ... ) */
      },
      "custom": { ... },
      "spacing": {
        "customPadding": false, /* true to opt-in, as in add_theme_support('custom-spacing') */
        "units": [ "px", "em", "rem", "vh", "vw" ], /* filter values, as in add_theme_support('custom-units', ... ) */
      },
      "typography": {
        "customFontSize": true, /* false to opt-out, as in add_theme_support( 'disable-custom-font-sizes' ) */
        "customFontWeight": true, /* false to opt-out */
        "customFontStyle": true, /* false to opt-out */
        "customLineHeight": false, /* true to opt-in, as in add_theme_support( 'custom-line-height' ) */
        "dropCap": true, /* false to opt-out */
        "fontFamilies": [ ... ], /* font family presets */
        "fontSizes": [ ... ], /* font size presets, as in add_theme_support('editor-font-sizes', ... ) */
      }
    }
  }
}
```

Each block can configure any of these settings separately, providing a more fine-grained control over what exists via `add_theme_support`.

The block settings declared under the `defaults` block selector affect to all blocks, unless a particular block overwrites it. It's a way to provide inheritance and quickly configure all blocks at once. To retain backward compatibility, the existing `add_theme_support` declarations that configure the block editor are retrofit in the proper categories for the `defaults` section. If a theme uses `add_theme_support('disable-custom-colors')`, it'll be the same as set `settings.defaults.color.custom` to `false`. If the `experimental-theme.json` contains any settings, these will take precedence over the values declared via `add_theme_support`.

Let's say a theme author wants to enable custom colors only for the paragraph block. This is how it can be done:

```
{
  "settings": {
    "defaults": {
      "color": {
        "custom": false // Disable it for all blocks.
      }
    },
    "core/paragraph": {
      "color": {
        "custom": true // Paragraph overrides the setting.
      }
    }
  }
}
```

Note, however, that not all settings are relevant for all blocks. The settings section provides an opt-in/opt-out mechanism for themes, but it's the block's responsibility to add support for the features that are relevant to it. For example, if a block doesn't implement the `dropCap` feature, a theme can't enable it for such a block through `experimental-theme.json`.

#### Presets

Presets are part of the settings section. Each preset value will generate a CSS Custom Property that will be added to the new stylesheet, which follow this naming schema: `--wp--preset--{preset-category}--{preset-slug}`.

For example:

{% codetabs %}
{% Input %}

```json
{
	"settings": {
		"defaults": {
			"color": {
				"palette": [
					{
						"slug": "strong-magenta",
						"color": "#a156b4"
					},
					{
						"slug": "very-dark-grey",
						"color": "rgb(131, 12, 8)"
					}
				],
				"gradients": [
					{
						"slug": "blush-bordeaux",
						"gradient": "linear-gradient(135deg,rgb(254,205,165) 0%,rgb(254,45,45) 50%,rgb(107,0,62) 100%)"
					},
					{
						"slug": "blush-light-purple",
						"gradient": "linear-gradient(135deg,rgb(255,206,236) 0%,rgb(152,150,240) 100%)"
					}
				]
			},
			"typography": {
				"fontSizes": [
					{
						"slug": "normal",
						"size": 16
					},
					{
						"slug": "big",
						"size": 32
					}
				]
			}
		}
	}
}
```

{% Output %}

```css
:root {
	--wp--preset--color--strong-magenta: #a156b4;
	--wp--preset--color--very-dark-gray: #444;
	--wp--preset--font-size--big: 32;
	--wp--preset--font-size--normal: 16;
	--wp--preset--gradient--blush-bordeaux: linear-gradient(
		135deg,
		rgb( 254, 205, 165 ) 0%,
		rgb( 254, 45, 45 ) 50%,
		rgb( 107, 0, 62 ) 100%
	);
	--wp--preset--gradient--blush-light-purple: linear-gradient(
		135deg,
		rgb( 255, 206, 236 ) 0%,
		rgb( 152, 150, 240 ) 100%
	);
}
```

{% end %}

To maintain backward compatibility, the presets declared via `add_theme_support` will also generate the CSS Custom Properties. If the `experimental-theme.json` contains any presets, these will take precedence over the ones declared via `add_theme_support`.

#### Free-form CSS Custom Properties

In addition to create CSS Custom Properties for the presets, the `experimental-theme.json` also allows for themes to create their own, so they don't have to be enqueued separately. Any values declared within the `settings.<some/block>.custom` section will be transformed to CSS Custom Properties following this naming schema: `--wp--custom--<variable-name>`.

For example:

{% codetabs %}
{% Input %}

```json
{
	"settings": {
		"defaults": {
			"custom": {
				"base-font": 16,
				"line-height": {
					"small": 1.2,
					"medium": 1.4,
					"large": 1.8
				}
			}
		}
	}
}
```

{% Output %}

```css
:root {
	--wp--custom--base-font: 16;
	--wp--custom--line-height--small: 1.2;
	--wp--custom--line-height--medium: 1.4;
	--wp--custom--line-height--large: 1.8;
}
```

{% end %}

Note that, the name of the variable is created by adding `--` in between each nesting level.

### Styles

Each block declares which style properties it exposes via the [block supports mechanism](../block-api/block-supports.md). The support declarations are used to automatically generate the UI controls for the block in the editor. Themes can use any style property via the `experimental-theme.json` for any block ― it's the theme's responsibility to verify that it works properly according to the block markup, etc.

```json
{
	"styles": {
		"some/block/selector": {
			"border": {
				"radius": "value"
			},
			"color": {
				"background": "value",
				"gradient": "value",
				"link": "value",
				"text": "value"
			},
			"spacing": {
				"padding": {
					"top": "value",
					"right": "value",
					"bottom": "value",
					"left": "value"
				}
			},
			"typography": {
				"fontFamily": "value",
				"fontSize": "value",
				"fontStyle": "value",
				"fontWeight": "value",
				"lineHeight": "value",
				"textDecoration": "value",
				"textTransform": "value"
			}
		}
	}
}
```

For example:

{% codetabs %}
{% Input %}

```json
{
	"styles": {
		"root": {
			"color": {
				"text": "var(--wp--preset--color--primary)"
			}
		},
		"core/heading/h1": {
			"color": {
				"text": "var(--wp--preset--color--primary)"
			},
			"typography": {
				"fontSize": "calc(1px * var(--wp--preset--font-size--huge))"
			}
		},
		"core/heading/h4": {
			"color": {
				"text": "var(--wp--preset--color--secondary)"
			},
			"typography": {
				"fontSize": "var(--wp--preset--font-size--normal)"
			}
		}
	}
}
```

{% Output %}

```css
:root {
	color: var( --wp--preset--color--primary );
}
h1 {
	color: var( --wp--preset--color--primary );
	font-size: calc( 1px * var( --wp--preset--font-size--huge ) );
}
h4 {
	color: var( --wp--preset--color--secondary );
	font-size: calc( 1px * var( --wp--preset--font-size--normal ) );
}
```

{% end %}

The `defaults` block selector can't be part of the `styles` section and will be ignored if it's present. The `root` block selector will generate a style rule with the `:root` CSS selector.

### Other theme metadata

There's a growing need to add more theme metadata to the theme.json. This section lists those other fields:

**customTemplates**: within this field themes can list the custom templates present in the `block-templates` folder. For example, for a custom template named `my-custom-template.html`, the `theme.json` can declare what post types can use it and what's the title to show the user:

```json
{
	"customTemplates": [
		{
			"name": "my-custom-template" /* Mandatory */,
			"title": "The template title" /* Mandatory, translatable */,
			"postTypes": [
				"page",
				"post",
				"my-cpt"
			] /* Optional, will only apply to "page" by default. */
		}
	]
}
```

**templateParts**: within this field themes can list the template parts present in the `block-template-parts` folder. For example, for a template part named `my-template-part.html`, the `theme.json` can declare the area term for the template part entity which is responsible for rendering the corresponding block variation (Header block, Footer block, etc.) in the editor. Defining this area term in the json will allow the setting to persist across all uses of that template part entity, as opposed to a block attribute that would only affect one block. Defining area as a block attribute is not recommended as this is only used 'behind the scenes' to aid in bridging the gap between placeholder flows and entity creation.

Currently block variations exist for "header" and "footer" values of the area term, any other values and template parts not defined in the json will default to the general template part block. Variations will be denoted by specific icons within the editor's interface, will default to the corresponding semantic HTML element for the wrapper (this can also be overridden by the `tagName` attribute set on the template part block), and will contextualize the template part allowing more custom flows in future editor improvements.

```json
{
	"templateParts": [
		{
			"name": "my-template-part" /* Mandatory */,
			"area": "header" /* Optional, will be set to 'uncategorized' by default and trigger no block variation */
		}
	]
}
```

## Frequently Asked Questions

### The naming schema of CSS Custom Properties

One thing you may have noticed is the naming schema used for the CSS Custom Properties the system creates, including the use of double hyphen, `--`, to separate the different "concepts". Take the following examples.

**Presets** such as `--wp--preset--color--black` can be divided into the following chunks:

-   `--wp`: prefix to namespace the CSS variable.
-   `preset `: indicates is a CSS variable that belongs to the presets.
-   `color`: indicates which preset category the variable belongs to. It can be `color`, `font-size`, `gradients`.
-   `black`: the `slug` of the particular preset value.

**Custom** properties such as `--wp--custom--line-height--body`, which can be divided into the following chunks:

-   `--wp`: prefix to namespace the CSS variable.
-   `custom`: indicates is a "free-form" CSS variable created by the theme.
-   `line-height--body`: the result of converting the "custom" object keys into a string.

The `--` as a separator has two functions:

-   Readibility, for human understanding. It can be thought as similar to the BEM naming schema, it separates "categories".
-   Parseability, for machine understanding. Using a defined structure allows machines to understand the meaning of the property `--wp--preset--color--black`: it's a value bounded to the color preset whose slug is "black", which then gives us room to do more things with them.

### Why using `--` as a separator?

We could have used any other separator, such as a single `-`.

However, that'd have been problematic, as it'd have been impossible to tell how `--wp-custom-line-height-template-header` should be converted back into an object, unless we force theme authors not to use `-` in their variable names.

By reserving `--` as a category separator and let theme authors use `-` for word-boundaries, the naming is clearer: `--wp--custom--line-height--template-header`.

### How settings under "custom" create new CSS Custom Properties

The algorithm to create CSS Variables out of the settings under the "custom" key works this way:

This is for clarity, but also because we want a mechanism to parse back a variable name such `--wp--custom--line-height--body` to its object form in theme.json. We use the same separation for presets.

For example:

{% codetabs %}
{% Input %}

```json
{
	"settings": {
		"defaults": {
			"custom": {
				"lineHeight": {
					"body": 1.7
				},
				"font-primary": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif"
			}
		}
	}
}
```

{% Output %}

```css
:root {
	--wp--custom--line-height--body: 1.7;
	--wp--custom--font-primary: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif";
}
```

{% end %}

A few notes about this process:

-   `camelCased` keys are transformed into its `kebab-case` form, as to follow the CSS property naming schema. Example: `lineHeight` is transformed into `line-height`.
-   Keys at different depth levels are separated by `--`. That's why `line-height` and `body` are separated by `--`.
-   You shouldn't use `--` in the names of the keys within the `custom` object. Example, **don't do** this:

```json
{
	"settings": {
		"defaults": {
			"custom": {
				"line--height": {
					"body": 1.7
				}
			}
		}
	}
}
```
