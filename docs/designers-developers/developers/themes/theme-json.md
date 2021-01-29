# Themes & Block Editor: experimental theme.json

> **These features are still experimental**. “Experimental” means this is an early implementation subject to drastic and breaking changes.
>
> Documentation has been shared early to surface what’s being worked on and invite feedback from those experimenting with the APIs. Please, be welcome to share yours in the weekly #core-editor chats as well as async via the Github issues and Pull Requests.

This is documentation for the current direction and work in progress about how themes can hook into the various sub-systems that the Block Editor provides.

- Rationale
    - Settings can be controlled per block
    - CSS Custom Properties: presets & custom
    - Some block styles are managed
- Specification
    - Settings
    - Styles

## Rationale

The Block Editor surface API has evolved at different velocities, and it's now at a point where is showing some growing pains, specially in areas that affect themes. Examples of this are: the ability to [control the editor programmatically](https://make.wordpress.org/core/2020/01/23/controlling-the-block-editor/), or [a block style system](https://github.com/WordPress/gutenberg/issues/9534) that facilitates user, theme, and core style preferences.

This describes the current efforts to consolidate the various APIs into a single point – a `experimental-theme.json` file that should be located inside the root of the theme directory.

### Settings can be controlled per block

The Block Editor already allows the control of specific settings such as alignment, drop cap, whether it's present in the inserter, etc at the block level. The goal is to surface these for themes to control at a block level.

### CSS Custom Properties

Presets such as [color palettes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-color-palettes), [font sizes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-font-sizes), and [gradients](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-gradient-presets) become CSS Custom Properties, and will be enqueued by the system for themes to use in both the front-end and the editors. There's also a mechanism to create your own CSS Custom Properties.

### Some block styles are managed

By providing the block style properties in a structured way, the Block Editor can "manage" the CSS that comes from different origins (user, theme, and core CSS), reducing the amount of CSS loaded in the page and preventing specificity wars due to the competing needs of the components involved (themes, blocks, plugins).

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
    "some/block": {
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
        "fontStyles": [ ... ], /* font style presets */
        "fontWeights": [ ... ], /* font weight presets */
        "textDecorations": [ ... ], /* text decoration presets */
        "textTransforms": [ ... ] /* text transform presets */
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

For example, for this input:

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
          },
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

The output will be:

```css
:root {
  --wp--preset--color--strong-magenta: #a156b4;
  --wp--preset--color--very-dark-gray: #444;
  --wp--preset--font-size--big: 32;
  --wp--preset--font-size--normal: 16;
  --wp--preset--gradient--blush-bordeaux: linear-gradient(135deg,rgb(254,205,165) 0%,rgb(254,45,45) 50%,rgb(107,0,62) 100%);
  --wp--preset--gradient--blush-light-purple: linear-gradient(135deg,rgb(255,206,236) 0%,rgb(152,150,240) 100%);
}
```

To maintain backward compatibility, the presets declared via `add_theme_support` will also generate the CSS Custom Properties. If the `experimental-theme.json` contains any presets, these will take precedence over the ones declared via `add_theme_support`.

#### Free-form CSS Custom Properties

In addition to create CSS Custom Properties for the presets, the `experimental-theme.json` also allows for themes to create their own, so they don't have to be enqueued separately. Any values declared within the `settings.<some/block>.custom` section will be transformed to CSS Custom Properties following this naming schema: `--wp--custom--<variable-name>`.

For example, for this input:

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

The output will be:

```css
:root {
  --wp--custom--base-font: 16;
  --wp--custom--line-height--small: 1.2;
  --wp--custom--line-height--medium: 1.4;
  --wp--custom--line-height--large: 1.8;
}
```

Note that, the name of the variable is created by adding `--` in between each nesting level.

### Styles

Each block declares which style properties it exposes via the [block supports mechanism](../block-api/block-supports.md). The support declarations are used to automatically generate the UI controls for the block in the editor, as well as being available through the `experimental-theme.json` file for themes to target.

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
          "left": "value",
        },
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

For example, an input like this:

```json
{
  "styles": {
    "root": {
      "color": {
        "text": "var(--wp--preset--color--primary)"
      },
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

will append the following style rules to the stylesheet:

```css
:root {
  color: var(--wp--preset--color--primary);
}
h1 {
  color: var(--wp--preset--color--primary);
  font-size: calc(1px * var(--wp--preset--font-size--huge));
}
h4 {
  color: var(--wp--preset--color--secondary);
  font-size: calc(1px * var(--wp--preset--font-size--normal));
}
```

The `defaults` block selector can't be part of the `styles` section and will be ignored if it's present. The `root` block selector will generate a style rule with the `:root` CSS selector.

#### Border Properties

| Block | Radius |
| --- | --- |
| Group | Yes |
| Image | Yes |

#### Color Properties

These are the current color properties supported by blocks:

| Block | Background | Gradient | Link | Text |
| --- | --- | --- | --- | --- |
| Global | Yes | Yes | Yes | Yes |
| Columns | Yes | Yes | Yes | Yes |
| Group | Yes | Yes | Yes | Yes |
| Heading [1] | Yes | - | Yes | Yes |
| List | Yes | Yes | - | Yes |
| Media & text | Yes | Yes | Yes | Yes |
| Navigation | Yes | - | - | Yes |
| Paragraph | Yes | - | Yes | Yes |
| Post Author | Yes | Yes | Yes | Yes |
| Post Comments | Yes | Yes | Yes | Yes |
| Post Comments Count | Yes | Yes | - | Yes |
| Post Comments Form | Yes | Yes | Yes | Yes |
| Post Date | Yes | Yes | - | Yes |
| Post Excerpt | Yes | Yes | Yes | Yes |
| Post Hierarchical Terms | Yes | Yes | Yes | Yes |
| Post Tags | Yes | Yes | Yes | Yes |
| Post Title | Yes | Yes | - | Yes |
| Site Tagline | Yes | Yes | - | Yes |
| Site Title | Yes | Yes | - | Yes |
| Social Links | Yes | - | - | Yes |
| Template Part | Yes | Yes | Yes | Yes |

[1] The heading block represents 6 distinct HTML elements: H1-H6. It comes with selectors to target each individual element (ex: core/heading/h1 for H1, etc).

#### Spacing Properties

| Block | Padding |
| --- | --- |
| Cover | Yes |
| Group | Yes |

#### Typography Properties

These are the current typography properties supported by blocks:

| Block | Font Family | Font Size | Font Style | Font Weight | Line Height | Text Decoration | Text Transform |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Global | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Code | - | Yes | - | - | - | - | - |
| Heading [1] | - | Yes | - | - | Yes | - | - |
| List | - | Yes | - | - | - | - | - |
| Navigation | Yes | Yes | Yes | Yes | - | Yes | Yes |
| Paragraph | - | Yes | - | - | Yes | - | - |
| Post Author | - | Yes | - | - | Yes | - | - |
| Post Comments | - | Yes | - | - | Yes | - | - |
| Post Comments Count | - | Yes | - | - | Yes | - | - |
| Post Comments Form | - | Yes | - | - | Yes | - | - |
| Post Date | - | Yes | - | - | Yes | - | - |
| Post Excerpt | - | Yes | - | - | Yes | - | - |
| Post Hierarchical Terms | - | Yes | - | - | Yes | - | - |
| Post Tags | - | Yes | - | - | Yes | - | - |
| Post Title | Yes | Yes | - | - | Yes | - | - |
| Preformatted | - | Yes | - | - | - | - | - |
| Site Tagline | Yes | Yes | - | - | Yes | - | - |
| Site Title | Yes | Yes | - | - | Yes | - | - |
| Verse | Yes | Yes | - | - | - | - | - |

[1] The heading block represents 6 distinct HTML elements: H1-H6. It comes with selectors to target each individual element (ex: core/heading/h1 for H1, etc).
