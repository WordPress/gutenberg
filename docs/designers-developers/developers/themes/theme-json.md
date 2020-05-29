# Themes & Block Editor: experimental theme.json

> **These features are still experimental**. “Experimental” means this is an early implementation subject to drastic and breaking changes.
>
> Documentation has been shared early to surface what’s being worked on and invite feedback from those experimenting with the APIs. Please, be welcome to share yours in the weekly #core-editor chats as well as async via the Github issues and Pull Requests.

This is documentation for the current direction and work in progress about how themes can hook into the various sub-systems that the Block Editor provides.

* Rationale
* Specification
* Current Status

## Rationale

The Block Editor surface API has evolved at different velocities, and it's now at a point where is showing some growing pains, specially in areas that affect themes. Examples of this are: the ability to [control the editor programmatically](https://make.wordpress.org/core/2020/01/23/controlling-the-block-editor/), or [a block style system](https://github.com/WordPress/gutenberg/issues/9534) that facilitates user, theme, and core style preferences.

This describes the current efforts to consolidate the various APIs into a single point: a `experimental-theme.json` file.

When this file is present a few Block Editor mechanisms are activated.

### Presets become CSS Custom Properties

Presets such as [color palettes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-color-palettes), [font sizes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-font-sizes), and [gradients](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-gradient-presets) will be enqueued as CSS Custom Properties for themes to use.

These will be enqueued to the front-end and editor.

### Some block styles are managed

By providing the block style properties in a structured way, the Block Editor can "manage" the CSS that comes from different origins (user, theme, and core CSS), reducing the amount of CSS loaded in the page and preventing specificity wars due to the competing needs of the components involved (themes, blocks, plugins).

### Individual features can be controlled per block

The Block Editor already allows the control of specific features such as alignment, drop cap, whether it's present in the inserter, etc at the block level. The goal is to surface these for themes to control.

## Specification

The specification for the `experimental-theme.json` follows the three main functions described in the section above: presets, styles, and features.

```
{
  presets: {
    color: [ ... ],
    font-size: [ ... ],
    gradient: [ ... ],
  },
  styles: { ... },
  features: { ... }
}
```

The file is divided into sections that represent different contexts: individual blocks, as well as the global environment.

```
{
  global: {
    presets: { ... },
    styles: { ... },
    features: { ... }
  },
  core/paragraph: {
    presets: { ... },
    styles: { ... },
    features: { ... }
  },
  core/group: {
    presets: { ... },
    styles: { ... },
    features: { ... }
  }
}
```

Some of the functions are context-dependant. Take, as an example, the drop cap:

```
{
  global: {
    features: {
      dropCap: false
    }
  },
  core/paragraph: {
    features: {
      dropCap: true,
    }
  },
  core/image: {
    features: {
      dropCap: true
    }
  }
}
```

In the example above, we aim to encapsulate that the drop cap should be disabled globally but enabled in the paragraph context. The drop cap in the image context wouldn't make sense so should be ignored.

## Current Status

### Presets

So far, this function is only enabled for the global section.

The generated CSS Custom Properties follow this naming schema: `--wp--preset--{preset-category}--{preset-slug}`.

For this input:

```
presets: {
  color: [
    {
      slug: 'strong-magenta',
      value: #a156b4,
    },
    {
      slug: 'very-dark-grey',
      value: #444,
    }
  ],
}
```

The following stylesheet will be enqueued to the front-end and editor:

```css
:root {
  --wp--preset--color--strong-magenta: #a156b4;
  --wp--preset--color--very-dark-gray: #444;
}
```

The goal is that presets can be defined using this format, although, right now, the name property (used to be shown in the editor) can't be translated from this file. For that reason, and to maintain backward compatibility, the presets declared via `add_theme_support` will also generate the CSS Custom Properties. The equivalent example to above is:

```php
add_theme_support( 'editor-color-palette', array(
  array(
    'name' => __( 'strong magenta', 'themeLangDomain' ),
    'slug' => 'strong-magenta',
    'color' => '#a156b4',
  ),
  array(
    'name' => __( 'very dark gray', 'themeLangDomain' ),
    'slug' => 'very-dark-gray',
    'color' => '#444',
  ),
) );
```

If the `experimental-theme.json` contains any presets, these will take precedence over the ones declared via `add_theme_support`.

### Styles

Each block will declare which style properties it exposes. This has been coined as "implicit style attributes" of the block. These properties are then used to automatically generate the UI controls for the block in the editor, as well as being available through the `experimental-theme.json` file for themes to target.

The list of properties that are currently exposed via this method are:

- Global: background-color.
- Paragraph and Heading: line-height, font-size, color, background-color.
- Group, Columns, and MediaText: color, background-color, background.

Note that, the heading block, represents 6 distinct HTML elements: H1-H6. It comes with selectors to target individual elements (ex: core/heading/h1 for H1) as well a selector to target all of them (core/heading).

### Features

This is being implemented, so it's not currently available.

### Recap of current available functions

```
{
  global: {
    presets: {
      color: [
        {
          slug: <preset slug>,
          value: <preset value>,
        },
        { ... },
      ],
      font-size: [
        {
          slug: <preset slug>,
          value: <preset value>,
        },
        { ... },
    ],
      gradient: [
        {
          slug: <preset slug>,
          value: <preset value>,
        },
        { ... },
      ]
    }
  },
  core/paragraph: {
    styles: {
      typography: {
        lineHeight: <value>,
        fontSize: <value>
      },
      color: {
        text: <value>
      }
    }
  },
  core/heading: {
    styles: {
        line-height: <value>,
        font-size: <value>,
        color: <value>,
    }
  },
  core/heading/h1: {
    styles: {
        line-height: <value>,
        font-size: <value>,
        color: <value>,
    }
  },
  core/heading/h2: {
    styles: {
        line-height: <value>,
        font-size: <value>,
        color: <value>,
    }
  },
  core/heading/h3: {
    styles: {
        line-height: <value>,
        font-size: <value>,
        color: <value>,
    }
  },
  core/heading/h4: {
    styles: {
        line-height: <value>,
        font-size: <value>,
        color: <value>,
    }
  },
  core/heading/h5: {
    styles: {
        line-height: <value>,
        font-size: <value>,
        color: <value>,
    }
  },
  core/heading/h6: {
    styles: {
      typography: {
        lineHeight: <value>,
        fontSize: <value>
      },
      color: {
        text: <value>
      }
    }
  },
  core/columns: {
    styles: {
      color: {
        text: <value>,
        background: <value>,
        background-color: <value>,
      }
    }
  },
  core/group: {
    styles: {
      color: {
        text: <value>,
        background: <value>,
        background-color: <value>,
      }
    }
  },
  core/media-text: {
    styles: {
      color: {
        text: <value>,
        background: <value>,
        background-color: <value>,
      }
    }
  },
}
```
