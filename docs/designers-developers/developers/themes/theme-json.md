# Themes & Block Editor: experimental theme.json

> **These features are still experimental**. “Experimental” means this is an early implementation subject to drastic and breaking changes.
>
> Documentation has been shared early to surface what’s being worked on and invite feedback from those experimenting with the APIs. Please, be welcome to share yours in the weekly #core-editor chats as well as async via the Github issues and Pull Requests.

This is documentation for the current direction and work in progress about how themes can hook into the various sub-systems that the Block Editor provides.

- Rationale
    - Settings can be controlled per block
    - Some block styles are managed
    - Define CSS Custom Properties
- Specification
    - Settings
    - Styles

## Rationale

The Block Editor surface API has evolved at different velocities, and it's now at a point where is showing some growing pains, specially in areas that affect themes. Examples of this are: the ability to [control the editor programmatically](https://make.wordpress.org/core/2020/01/23/controlling-the-block-editor/), or [a block style system](https://github.com/WordPress/gutenberg/issues/9534) that facilitates user, theme, and core style preferences.

This describes the current efforts to consolidate the various APIs into a single point – a `experimental-theme.json` file that should be located inside the root of the theme directory.

### Settings can be controlled per block

The Block Editor already allows the control of specific settings such as alignment, drop cap, whether it's present in the inserter, etc at the block level. The goal is to surface these for themes to control.

### Some block styles are managed

By providing the block style properties in a structured way, the Block Editor can "manage" the CSS that comes from different origins (user, theme, and core CSS), reducing the amount of CSS loaded in the page and preventing specificity wars due to the competing needs of the components involved (themes, blocks, plugins).

### Define CSS Custom Properties

There's a mechanism to declare CSS Custom Properties that can be used in the `styles` and as values for the presets to declare within `settings`. The existing presets such as [color palettes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-color-palettes), [font sizes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-font-sizes), and [gradients](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-gradient-presets) will also become CSS Custom Properties.

These will be enqueued to the front-end and editor.

## Specification

The `experimental-theme.json` file is divided into sections known as "contexts", that represent a different CSS selector. For example, the `core/paragraph` context maps to `p` while `core/group` maps to `.wp-block-group`. In general, one block will map to a single context as in the cases mentioned. There are cases where one block can generate multiple contexts (different CSS selectors). For example, the heading block generates six different contexts (`core/heading/h1`, `core/heading/h2`, etc), one for each different selector (h1, h2, etc).

```
{
  "global": { ... },
  "core/paragraph": { ... },
  "core/group": { ... },
  "core/heading/h1": { ... },
  "core/heading/h2": { ... },
  "core/heading/h3": { ... },
  "core/heading/h4": { ... },
  "core/heading/h5": { ... },
  "core/heading/h6": { ... }
}
```

Every context has the same structure, divided in three sections: `settings`, `styles`, and `vars`. The `settings` are used to control the editor (enable/disable certain features, declare presets), taking over what was previously declared via `add_theme_support`. The `styles` will be used to create new style rules to be appended to a new stylesheet `global-styles-inline-css` enqueued in the front-end and post editor. The values within `vars` are used to generate CSS Custom Properties.

```
{
  "some/context": {
    "settings": {
      "color": [ ... ],
      "typography": [ ... ],
      "spacing": [ ... ]
    },
    "styles": {
      "color": { ... },
      "typography": { ... }
    },
    "vars": {
      "color": { ... },
      "font-size": { ... },
      "gradient": { ... }
    }
  }
}
```

This structure is the same for the three different origins that exist: core, themes, and users. Themes can override core's defaults by creating a file called `experimental-theme.json`. Users, via the site editor, will also be also to override theme's or core's preferences via an user interface that is being worked on.

### Settings

The settings section has the following structure and default values:

```
{
  "some/context": {
    "settings": {
      "color": {
        "custom": true, /* false to opt-out, as in add_theme_support('disable-custom-colors') */
        "customGradient": true, /* false to opt-out, as in add_theme_support('disable-custom-gradients') */
        "gradients": [ ... ], /* list of gradients declared in the vars.gradient section */
        "link": false, /* true to opt-in, as in add_theme_support('experimental-link-color') */
        "palette": [ ... ], /* list of colors declared in the vars.color section */
      },
      "spacing": {
        "customPadding": false, /* true to opt-in, as in add_theme_support('experimental-custom-spacing') */
        "units": [ "px", "em", "rem", "vh", "vw" ], /* filter values, as in add_theme_support('custom-units', ... ) */
      },
      "typography": {
        "customFontSize": true, /* false to opt-out, as in add_theme_support( 'disable-custom-font-sizes' ) */
        "customLineHeight": false, /* true to opt-in, as in add_theme_support( 'custom-line-height' ) */
        "dropCap": true, /* false to opt-out */
        "fontSizes": [ ... ], /* list of font sizes declared in the vars.font-size section */
      },
      "custom": { ... }
    }
  }
}
```

To retain backward compatibility, `add_theme_support` declarations are considered as well. If a theme uses `add_theme_support('disable-custom-colors')`, it'll be the same as set `global.settings.color.custom` to `false`. If the `experimental-theme.json` contains any settings, these will take precedence over the values declared via `add_theme_support`.

Settings can also be controlled by context, providing a more fine-grained control over what exists via `add_theme_support`. As an example, let's say that a theme author wants to enable custom colors for the paragraph block exclusively. This is how it'd be done:

```json
{
  "global": {
    "settings": {
      "color": {
        "custom": false
      }
    }
  },
  "core/paragraph": {
    "settings": {
      "color": {
        "custom": true
      }
    }
  }
```

Note, however, that not all settings are relevant for all contexts and the blocks they represent. The settings section provides an opt-in/opt-out mechanism for themes, but it's the block's responsibility to add support for the features that are relevant to it. For example, if a block doesn't implement the `dropCap` feature, a theme can't enable it for such a block through `experimental-theme.json`.

### Styles

Each block declares which style properties it exposes. This has been coined as "implicit style attributes" of the block. These properties are then used to automatically generate the UI controls for the block in the editor, as well as being available through the `experimental-theme.json` file for themes to target.

```
{
  "some/context": {
    "styles": {
      "color": {
        "background": <value>,
        "gradient": <value>,
        "link": <value>,
        "text": <value>
      },
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      }
    }
  }
}
```

For example, an input like this:

```json
{
  "core/heading/h1": {
    "styles": {
      "color": {
        "text": "var(--wp--preset--color--primary)"
      },
      "typography": {
        "fontSize": "calc(1px * var(--wp--preset--font-size--huge))"
      }
    }
  },
  "core/heading/h4": {
    "styles": {
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
h1 {
  color: var(--wp--preset--color--primary);
  font-size: calc(1px * var(--wp--preset--font-size--huge));
}
h4 {
  color: var(--wp--preset--color--secondary);
  font-size: calc(1px * var(--wp--preset--font-size--normal));
}
```

#### Color Properties

These are the current color properties supported by blocks:

| Context | Background | Gradient | Link | Text |
| --- | --- | --- | --- | --- |
| Global | Yes | Yes | Yes | Yes |
| Columns | Yes | Yes | Yes | Yes |
| Group | Yes | Yes | Yes | Yes |
| Heading [1] | Yes | - | Yes | Yes |
| Media & text | Yes | Yes | Yes | Yes |
| Paragraph | Yes | - | Yes | Yes |
| Post Author | Yes | Yes | Yes | Yes |
| Post Comments | Yes | Yes | Yes | Yes |
| Post Comments Count | Yes | Yes | - | Yes |
| Post Comments Form | Yes | Yes | Yes | Yes |
| Post Date | Yes | Yes | - | Yes |
| Post Excerpt | Yes | Yes | Yes | Yes |
| Post Tags | Yes | Yes | Yes | Yes |
| Post Title | Yes | Yes | - | Yes |
| Site Tagline | Yes | Yes | - | Yes |
| Site Title | Yes | Yes | - | Yes |

[1] The heading block represents 6 distinct HTML elements: H1-H6. It comes with selectors to target each individual element (ex: core/heading/h1 for H1, etc).

#### Typography Properties

These are the current typography properties supported by blocks:

| Context | Font Size | Line Height |
| --- | --- | --- |
| Global | Yes | - |
| Columns | - | - |
| Group | - | - |
| Heading [1] | Yes | Yes |
| Media & text | - | - |
| Paragraph | Yes | Yes |
| Post Author | Yes | Yes |
| Post Comments | Yes | Yes |
| Post Comments Count | Yes | Yes |
| Post Comments Form | Yes | Yes |
| Post Date | Yes | Yes |
| Post Excerpt | Yes | Yes |
| Post Tags | Yes | Yes |
| Post Title | Yes | Yes |
| Site Tagline | Yes | Yes |
| Site Title | Yes | Yes |

[1] The heading block represents 6 distinct HTML elements: H1-H6. It comes with selectors to target each individual element (ex: core/heading/h1 for H1, etc).

### CSS Custom Properties, aka CSS Variables

Each context can declare CSS variables to be enqueued in addition to the `styles`, and that can be used there as well. These are declared within the `var` section and follow this naming schema: `--wp--<variable-name>`.

For example, for this input:

```json
{
  "global": {
    "vars": {
      "color": {
        "primary": "#000000",
        "primary-hover": "#3C8067",
        "secondary": "#3C8067",
        "secondary-hover": "#336D58",
        "tertiary": "rgb(209, 207, 203)",
        "border": "#EFEFEF",
        "text-selection": "#EBF2F0",
        "alert": {
          "success": "yellowgreen",
          "info": "skyblue",
          "warning": "gold",
          "error": "salmon"
        }
      },
      "font-size": {
        "ratio": 1.2,
        "base": 18,
        "xs": "calc(var(--wp--font-size--sm) / var(--wp--font-size--ratio))",
        "sm": "calc(var(--wp--font-size--base) / var(--wp--font-size--ratio))",
        "md": "var(--wp--font-size--base)",
        "lg": "calc(var(--wp--font-size--base) * var(--wp--font-size--ratio))",
        "xl": "calc(var(--wp--font-size--lg) * var(--wp--font-size--ratio))",
        "xxl": "calc(var(--wp--font-size--xl) * 2 * var(--wp--font-size--ratio))"
      },
      "line-height": {
        "base": 1,
        "body": 1.7,
        "heading": 1.3
      }
    }
  }
}

```

The output will be:

```css
:root {
  --wp--style--color--link: var(--wp--color--secondary);
  background-color: var(--wp--color--background-dark);
  --wp--color--primary: #000000;
  --wp--color--primary-hover: #3C8067;
  --wp--color--secondary: #3C8067;
  --wp--color--secondary-hover: #336D58;
  --wp--color--tertiary: rgb(209, 207, 203);
  --wp--color--border: #EFEFEF;
  --wp--color--text-selection: #EBF2F0;
  --wp--color--alert--success: yellowgreen;
  --wp--color--alert--info: skyblue;
  --wp--color--alert--warning: gold;
  --wp--color--alert--error: salmon;
  --wp--font-size--ratio: 1.2;
  --wp--font-size--base: 18;
  --wp--font-size--xs: calc(var(--wp--font-size--sm) / var(--wp--font-size--ratio));
  --wp--font-size--sm: calc(var(--wp--font-size--base) / var(--wp--font-size--ratio));
  --wp--font-size--md: var(--wp--font-size--base);
  --wp--font-size--lg: calc(var(--wp--font-size--base) * var(--wp--font-size--ratio));
  --wp--font-size--xl: calc(var(--wp--font-size--lg) * var(--wp--font-size--ratio));
  --wp--font-size--xxl: calc(var(--wp--font-size--xl) * 2 * var(--wp--font-size--ratio));
  --wp--line-height--base: 1;
  --wp--line-height--body: 1.7;
  --wp--line-height--heading: 1.3;
}
```

Note that, the name of the variable is created by adding `--` in between each nesting level.

