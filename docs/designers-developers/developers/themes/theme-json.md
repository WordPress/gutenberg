# Themes & Block Editor: experimental theme.json

> **These features are still experimental**. “Experimental” means this is an early implementation subject to drastic and breaking changes.
>
> Documentation has been shared early to surface what’s being worked on and invite feedback from those experimenting with the APIs. Please, be welcome to share yours in the weekly #core-editor chats as well as async via the Github issues and Pull Requests.

This is documentation for the current direction and work in progress about how themes can hook into the various sub-systems that the Block Editor provides.

- Rationale
- Specification
- Current Status

## Rationale

The Block Editor surface API has evolved at different velocities, and it's now at a point where is showing some growing pains, specially in areas that affect themes. Examples of this are: the ability to [control the editor programmatically](https://make.wordpress.org/core/2020/01/23/controlling-the-block-editor/), or [a block style system](https://github.com/WordPress/gutenberg/issues/9534) that facilitates user, theme, and core style preferences.

This describes the current efforts to consolidate the various APIs into a single point – a `experimental-theme.json` file that should be located inside the root of the theme directory.

When this file is present a few Block Editor mechanisms are activated.

### Presets become CSS Custom Properties

Presets such as [color palettes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-color-palettes), [font sizes](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-font-sizes), and [gradients](https://developer.wordpress.org/block-editor/developers/themes/theme-support/#block-gradient-presets) will be enqueued as CSS Custom Properties for themes to use.

These will be enqueued to the front-end and editor.

### Some block styles are managed

By providing the block style properties in a structured way, the Block Editor can "manage" the CSS that comes from different origins (user, theme, and core CSS), reducing the amount of CSS loaded in the page and preventing specificity wars due to the competing needs of the components involved (themes, blocks, plugins).

### Individual features can be controlled per block

The Block Editor already allows the control of specific features such as alignment, drop cap, whether it's present in the inserter, etc at the block level. The goal is to surface these for themes to control.

## Specification

The specification for the `experimental-theme.json` follows the three main functions described in the section above: `presets`, `styles`, and `features`.

```
{
  "presets": {
    "color": [ ... ],
    "font-size": [ ... ],
    "gradient": [ ... ],
  },
  "styles": { ... },
  "features": {... }
}
```

The file is divided into sections that represent different contexts: individual blocks, as well as the global environment.

```
{
  "global": {
    "presets": { ... },
    "styles": { ... },
    "features": { ... }
  },
  "core/paragraph": {
    "presets": { ... },
    "styles": { ... },
    "features": { ... }
  },
  "core/group": {
    "presets": { ... },
    "styles": { ... },
    "features": { ... }
  }
}
```

Some of the functions are context-dependant. Take, as an example, the drop cap:

```
{
  "global": {
    "features": {
      "typography": {
        "dropCap": false
			}
    }
  },
  "core/paragraph": {
    "features": {
      "typography": {
        "dropCap": true
			}
    }
  },
  "core/image": {
    "features": {
      "typography": {
        "dropCap": true
			}
    }
  }
}
```

In the example above, we aim to encapsulate that the drop cap should be disabled globally but enabled in the paragraph context. The drop cap in the Image block context wouldn't make sense based on the current implementation so would be ignored, but it could be used by plugins that extend its functionality.

## Current Status

### Presets

So far, this function is only enabled for the global section.

The generated CSS Custom Properties follow this naming schema: `--wp--preset--{preset-category}--{preset-slug}`.

For this input:

```
"global": {
  "presets": {
    "color": [
      {
        "slug": "strong-magenta",
        "value": "#a156b4"
      },
      {
        "slug": "very-dark-grey",
        "value": "#444"
      }
    ]
  }
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

| Context | Text's Color | Background's Color | Background's Gradient | Font Size | Line Height |
| --- | --- | --- | --- | --- | --- |
| Global | - | Yes | - | - | - |
| Paragraph | Yes | Yes | - | Yes | Yes |
| Heading [1] | Yes | Yes | - | Yes | Yes |
| Group | Yes | Yes | Yes | - | - |
| Columns | Yes | Yes | Yes | - | - |
| Media & text | Yes | Yes | Yes | - | - |

[1] The heading block represents 6 distinct HTML elements: H1-H6. It comes with selectors to target each individual element (ex: core/heading/h1 for H1, etc).

### Features

So far, this function is only enabled for the `global` section in `experimental-theme.json`.

```
{
  "global": {
    "features": {
      "typography": {
        "dropCap": false
			}
		}
	}
}
```

Then each block can decide to override how they handle block editor features during their registration process (`register_block_type` or `registerBlockType` calls) using `supports` object in `block.json` file:

```
{
  "supports": {
    "__experimentalFeatures": {
      "typography": {
        "dropCap": true
			}
		}
  }
}
```

Moving forward, we plan to integrate overrides targeting individual blocks defined inside `experimental-theme.json` file that would be applied on top of features defined by block authors in `supports` property.

Finally, this is how it can be used in the block's `edit` implementation:

```js
// edit.js

const Edit = ( props ) => {
    const isDisabled = ! useEditorFeature( 'typography.dropCap' );
    // ...
};
```

The list of features that are currently supported are:
- Paragraph: drop cap.

### Recap of current available functions

```
{
  "global": {
    "presets": {
      "color": [
        {
          "slug": <preset slug>,
          "value": <preset value>
        },
        { <more colors> }
      ],
      "font-size": [
        {
          "slug": <preset slug>,
          "value": <preset value>
        },
        { <more font sizes> }
    ],
      "gradient": [
        {
          "slug": <preset slug>,
          "value": <preset value>
        },
        { <more gradients> }
      ]
    },
    "styles: {
      "color: {
        "background": <value>
			}
    }
  },
  "core/paragraph": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/heading/h1": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/heading/h2": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/heading/h3": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/heading/h4": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/heading/h5": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/heading/h6": {
    "styles": {
      "typography": {
        "fontSize": <value>,
        "lineHeight": <value>
      },
      "color": {
        "background": <value>,
        "text": <value>
      }
    }
  },
  "core/columns": {
    "styles": {
      "color": {
        "background": <value>,
        "gradient": <value>,
        "text": <value>
      }
    }
  },
  "core/group": {
    "styles": {
        "color": {
          "background": <value>,
          "gradient": <value>,
          "text": <value>
        }
      }
  },
  "core/media-text": {
    "styles": {
        "color": {
          "background": <value>,
          "gradient": <value>,
          "text": <value>
        }
      }
  }
}
```
