# Supports

Block Supports is the API that allows a block to declare support for certain features.

Opting into any of these features will register additional attributes on the block and provide the UI to manipulate that attribute.

In order for the attribute to get applied to the block the generated properties get added to the wrapping element of the block. They get added to the object you get returned from the `useBlockProps` hook.

`BlockEdit` function:

```js
function BlockEdit() {
	const blockProps = useBlockProps();

	return <div { ...blockProps }>Hello World!</div>;
}
```

`save` function:

```js
function BlockEdit() {
	const blockProps = useBlockProps.save();

	return <div { ...blockProps }>Hello World!</div>;
}
```

For dynamic blocks that get rendered via a `render_callback` in PHP you can use the `get_block_wrapper_attributes()` function. It returns a string containing all the generated properties and needs to get output in the opening tag of the wrapping block element.

`render_callback` function:

```php
function render_block() {
	$wrapper_attributes = get_block_wrapper_attributes();

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		'Hello World!'
	);
}
```

## anchor

-   Type: `boolean`
-   Default value: `false`

Anchors let you link directly to a specific block on a page. This property adds a field to define an id for the block and a button to copy the direct link. _Important: It doesn't work with dynamic blocks yet._

```js
// Declare support for anchor links.
supports: {
	anchor: true
}
```

## align

-   Type: `boolean` or `array`
-   Default value: `false`

This property adds block controls, which enable changes to a block's alignment.

```js
supports: {
	// Declare support for block's alignment.
	// This adds support for all the options:
	// left, center, right, wide, and full.
	align: true
}
```

```js
supports: {
	// Declare support for specific alignment options.
	align: [ 'left', 'right', 'full' ]
}
```

When the block declares support for `align`, the attributes definition is extended to include an align attribute with a `string` type. By default, no alignment is assigned. The block can apply a default alignment by specifying its own `align` attribute with a default. For example:

```js
attributes: {
    align: {
        type: 'string',
        default: 'right'
    }
}
```

## alignWide

-   Type: `boolean`
-   Default value: `true`

This property allows to enable [wide alignment](/docs/how-to-guides/themes/theme-support.md#wide-alignment) for your theme. To disable this behavior for a single block, set this flag to `false`.

```js
supports: {
	// Remove the support for wide alignment.
	alignWide: false
}
```

## ariaLabel

-   Type: `boolean`
-   Default value: `false`

ARIA-labels let you define an accessible label for elements. This property allows enabling the definition of an aria-label for the block, without exposing a UI field.

```js
supports: {
	// Add support for an aria label.
	ariaLabel: true
}
```

## background

_**Note:** Since WordPress 6.5._

-   Type: `Object`
-   Default value: `null`
-   Subproperties
    -   `backgroundImage`: type `boolean`, default value `false`
    -   `backgroundSize`: type `boolean`, default value `false`

This value signals that a block supports some of the CSS style properties related to background. When it does, the block editor will show UI controls for the user to set their values if [the theme declares support](/docs/how-to-guides/themes/global-settings-and-styles.md#opt-in-into-ui-controls).

`backgroundImage` adds UI controls which allow the user to select a background image.
`backgroundSize` adds the FocalPointPicker to pick the position of the background image and allow the user to select the background size (cover, contain, fixed).

```js
supports: {
	background: {
		backgroundImage: true // Enable background image control.
		backgroundSize: true // Enable background image + size control.
	}
}
```

When a block declares support for a specific background property, its attributes definition is extended to include the `style` attribute.

When a background image is selected, the image data is stored in the `style.background.backgroundImage`.

When a background images is selected and its position or size are changed, the background-position is stored in the `style.background.backgroundPosition` and its background-size in `style.background.backgroundSize` attribute.

-   `style`: an attribute of `object` type with no default assigned. This is added when `backgroundImage` or `backgroundSize` support is declared. It stores the custom values set by the user.
    -   `background`: an attribute of `object` type.
        - `backgroundImage`: an attribute of `object` type, containing information about the selected image
            - `url`: type `string`, URL to the image
            - `id`: type `int`, media attachment ID
            - `source`: type `string`, at the moment the only value is `file`
            - `title`: type `string`, title of the media attachment
        - `backgroundPosition`: an attribute of `string` type, defining the background images position, selected by FocalPointPicker and used in CSS as the [`background-position`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-position) value.
        - `backgroundSize`: an attribute of `string` type. defining the CSS [`background-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/background-size) value.

The block can apply a default background image, position and size by specifying its own attribute with a default. For example:

```js
attributes: {
    style: {
        background: {
            backgroundImage: {
				"url":"IMAGE_URL"
			}
			backgroundPosition:"50% 50%",
            backgroundSize: "cover"
        }
    }
}
```

## className

-   Type: `boolean`
-   Default value: `true`

By default, the class `.wp-block-your-block-name` is added to the root element of your saved markup. This helps by providing a consistent mechanism for styling blocks that themes and plugins can rely on. If, for whatever reason, a class is not desired on the markup, this functionality can be disabled.

```js
supports: {
	// Remove the support for the generated className.
	className: false
}
```

## color

-   Type: `Object`
-   Default value: null
-   Subproperties:
    -   `background`: type `boolean`, default value `true`
    -   `button`: type `boolean`, default value `false`
    -   `enableContrastChecker`: type `boolean`, default value `true`
    -   `gradients`: type `boolean`, default value `false`
    -   `heading`: type `boolean`, default value `false`
    -   `link`: type `boolean`, default value `false`
    -   `text`: type `boolean`, default value `true`

This value signals that a block supports some of the properties related to color. When this value is present, the block editor will show UI controls for the user to set their values.

Note that the `background` and `text` keys have a default value of `true`, so if the `color` property is present they will also be considered enabled:

```js
supports: {
	color: {
		// This also enables text and background UI controls.
		gradients: true // Enables the gradients UI control.
	}
}
```

It's possible to disable them individually:

```js
supports: {
    color: { // Text UI control is enabled.
        background: false, // Disables the background UI control.
        gradients: true // Enables the gradients UI control.
    }
}
```

### color.background

This property adds UI controls which allow the user to apply a solid background color to a block.

When color support is declared, this property is enabled by default (along with text), so simply setting color will enable background color.

```js
supports: {
    color: true // Enables background and text color support.
}
```

To disable background support while keeping other color supports enabled, set to `false`.

```js
supports: {
    color: {
        // Disables background support. Text color support is still enabled.
        background: false
    }
}
```

When the block declares support for `color.background`, the attributes definition is extended to include two new attributes: `backgroundColor` and `style`:

-   `backgroundColor`: an attribute of `string` type with no default assigned.

    When a user chooses from the list of preset background colors, the preset slug is stored in the `backgroundColor` attribute.

    Background color presets are sourced from the `editor-color-palette` [theme support](/docs/how-to-guides/themes/theme-support.md#block-color-palettes).

    The block can apply a default preset background color by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        backgroundColor: {
            type: 'string',
            default: 'some-preset-background-slug',
        }
    }
    ```

-   `style`: attribute of `object` type with no default assigned.

    When a custom background color is selected (i.e. using the custom color picker), the custom color value is stored in the `style.color.background` attribute.

    The block can apply a default custom background color by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                color: {
                    background: '#aabbcc',
                }
            }
        }
    }
    ```

### color.button

_**Note:** Since WordPress 6.5._

This property adds block controls which allow the user to set button colors (text, background) in a block. Button colors are disabled by default.

To enable button color support, set `color.button` to `true`.

```js
supports: {
	color: {
		button: true
	}
}
```

Button color presets are sourced from the `editor-color-palette` [theme support](/docs/how-to-guides/themes/theme-support.md#block-color-palettes).

When the block declares support for `color.button`, the attributes definition is extended to include the `style` attribute:

-   `style`: an attribute of `object` type with no default assigned.

    When a button color is selected, the color value is stored in the `style.elements.button.color.text` and `style.elements.button.color.background` attribute.

    The block can apply a default button colors by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                elements: {
                    button: {
                        color: {
                            text: 'var:preset|color|contrast',
    					    background: '#000000',
                        }
                    }
                }
            }
        }
    }
    ```

### color.enableContrastChecker

_**Note:** Since WordPress 6.5._

Determines whether the contrast checker widget displays in the block editor UI.

The contrast checker appears only if the block declares support for color. It tests the readability of color combinations and warns if there is a potential issue. The property is enabled by default. Set to `false` to explicitly disable:

```js
supports: {
	color: {
		enableContrastChecker: false
	}
}
```

### color.\_\_experimentalDuotone

_**Note:** Deprecated since WordPress 6.3._

This property has been replaced by [`filter.duotone`](#filterduotone).

### color.gradients

This property adds UI controls which allow the user to apply a gradient background to a block.

```js
supports: {
    color: {
        gradients: true,
        // Default values must be disabled if you don't want to use them with gradients.
        background: false,
        text: false
    }
}
```

Gradient presets are sourced from `editor-gradient-presets` [theme support](/docs/how-to-guides/themes/theme-support.md#block-gradient-presets).

When the block declares support for `color.gradient`, the attributes definition is extended to include two new attributes: `gradient` and `style`:

-   `gradient`: an attribute of `string` type with no default assigned.

    When a user chooses from the list of preset gradients, the preset slug is stored in the `gradient` attribute.

    The block can apply a default preset gradient by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        gradient: {
            type: 'string',
            default: 'some-preset-gradient-slug',
        }
    }
    ```

-   `style`: an attribute of `object` type with no default assigned.

    When a custom gradient is selected (i.e. using the custom gradient picker), the custom gradient value is stored in the `style.color.gradient` attribute.

    The block can apply a default custom gradient by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                color: {
                    gradient: 'linear-gradient(135deg,rgb(170,187,204) 0%,rgb(17,34,51) 100%)',
                }
            }
        }
    }
    ```

### color.heading

_**Note:** Since WordPress 6.5._

This property adds block controls which allow the user to set heading colors in a block. Heading colors are disabled by default.

To enable heading color support, set `color.heading` to `true`.

```js
supports: {
	color: {
		// Enable heading color support.
		heading: true
	}
}
```

Heading color presets are sourced from the `editor-color-palette` [theme support](/docs/how-to-guides/themes/theme-support.md#block-color-palettes).

When the block declares support for `color.heading`, the attributes definition is extended to include the `style` attribute:

-   `style`: an attribute of `object` type with no default assigned.

    When a heading color is selected, the color value is stored in the `style.elements.heading.color.text` and `style.elements.heading.color.background` attribute.

    The block can apply default heading colors by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                elements: {
                    heading: {
                        color: {
                            text: 'var:preset|color|contrast',
    					    background: '#000000',
                        }
                    }
                }
            }
        }
    }
    ```

### color.link

This property adds block controls which allow the user to set link colors in a block. Link colors are disabled by default.

To enable link color support, set `color.link` to `true`.

```js
supports: {
	color: {
		link: true
	}
}
```

Link color presets are sourced from the `editor-color-palette` [theme support](/docs/how-to-guides/themes/theme-support.md#block-color-palettes).

When the block declares support for `color.link`, the attributes definition is extended to include the `style` attribute:

-   `style`: an attribute of `object` type with no default assigned.

    When a link color is selected, the color value is stored in the `style.elements.link.color.text` and `style.elements.link.:hover.color.text` attribute.

    The block can apply default link colors by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                elements: {
                    link: {
                        color: {
                            text: 'var:preset|color|contrast',
                        },
						":hover": {
							color: {
								text: "#000000"
							}
						}
                    }
                }
            }
        }
    }
    ```

### color.text

This property adds block controls which allow the user to set text color in a block.

When color support is declared, this property is enabled by default (along with background), so simply setting color will enable text color.

```js
supports: {
	color: true // Enables background and text, but not link.
}
```

To disable text color support while keeping other color supports enabled, set `color.text` to `false`.

```js
supports: {
	color: {
		// Disable text color support.
		text: false
	}
}
```

Text color presets are sourced from the `editor-color-palette` [theme support](/docs/how-to-guides/themes/theme-support.md#block-color-palettes).

When the block declares support for `color.text`, the attributes definition is extended to include two new attributes: `textColor` and `style`:

-   `textColor`: an attribute of `string` type with no default assigned.

    When a user chooses from the list of preset text colors, the preset slug is stored in the `textColor` attribute.

    The block can apply a default preset text color by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        textColor: {
            type: 'string',
            default: 'some-preset-text-color-slug',
        }
    }
    ```

-   `style`: an attribute of `object` type with no default assigned.

    When a custom text color is selected (i.e. using the custom color picker), the custom color value is stored in the `style.color.text` attribute.

    The block can apply a default custom text color by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                color: {
                    text: '#aabbcc',
                }
            }
        }
    }
    ```

## customClassName

-   Type: `boolean`
-   Default value: `true`

This property adds a field to define a custom className for the block's wrapper.

```js
supports: {
	// Remove the support for the custom className.
	customClassName: false
}
```

## dimensions

_**Note:** Since WordPress 6.2._

-   Type: `Object`
-   Default value: null
-   Subproperties:
    -   `minHeight`: type `boolean`, default value `false`

This value signals that a block supports some of the CSS style properties related to dimensions. When it does, the block editor will show UI controls for the user to set their values if [the theme declares support](/docs/how-to-guides/themes/global-settings-and-styles.md#opt-in-into-ui-controls).

```js
supports: {
	dimensions: {
		aspectRatio: true // Enable aspect ratio control.
		minHeight: true // Enable min height control.
	}
}
```

When a block declares support for a specific dimensions property, its attributes definition is extended to include the `style` attribute.

-   `style`: an attribute of `object` type with no default assigned. This is added when `aspectRatio` or `minHeight` support is declared. It stores the custom values set by the user. For example:

```js
attributes: {
    style: {
        dimensions: {
            aspectRatio: "16/9",
            minHeight: "50vh"
        }
    }
}
```

## filter

-   Type: `Object`
-   Default value: null
-   Subproperties:
    -   `duotone`: type `boolean`, default value `false`

This value signals that a block supports some of the properties related to filters. When it does, the block editor will show UI controls for the user to set their values.

### filter.duotone

This property adds UI controls which allow the user to apply a duotone filter to
a block or part of a block.

```js
supports: {
    filter: {
        // Enable duotone support
        duotone: true
    }
},
selectors: {
    filter: {
        // Apply the filter to img elements inside the image block
        duotone: '.wp-block-image img'
    }
}
```

The filter can be applied to an element inside the block by setting the `selectors.filter.duotone` selector.

Duotone presets are sourced from `color.duotone` in [theme.json](/docs/how-to-guides/themes/global-settings-and-styles.md).

When the block declares support for `filter.duotone`, the attributes definition is extended to include the attribute `style`:

-   `style`: an attribute of `object` type with no default assigned.

    The block can apply a default duotone color by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
                color: {
                    duotone: [
                        '#FFF',
                        '#000'
                    ]
                }
            }
        }
    }
    ```

## html

-   Type: `boolean`
-   Default value: `true`

By default, a block's markup can be edited individually. To disable this behavior, set `html` to `false`.

```js
supports: {
	// Remove support for an HTML mode.
	html: false
}
```

## inserter

-   Type: `boolean`
-   Default value: `true`

By default, all blocks will appear in the inserter, block transforms menu, Style Book, etc. To hide a block from all parts of the user interface so that it can only be inserted programmatically, set `inserter` to `false`.

```js
supports: {
	// Hide this block from the inserter.
	inserter: false
}
```

## interactivity

-   Type: `boolean` or `object`
-   Default value: `false`
-   Subproperties:
    -   `clientNavigation`: type `boolean`, default value `false`
    -   `interactive`: type `boolean`, default value `false`

Indicates if the block is using Interactivity API features.

The `clientNavigation` sub-property indicates whether a block is compatible with the Interactivity API client-side navigation.
Set it to true only if the block is not interactive or if it is interactive using the Interactivity API. Set it to false if the block is interactive but uses vanilla JS, jQuery or another JS framework/library other than the Interactivity API.

The `interactive` sub-property indicates whether the block is using the Interactivity API directives.

## layout

-   Type: `boolean` or `Object`
-   Default value: null
-   Subproperties:
    -   `default`: type `Object`, default value null
    -   `allowSwitching`: type `boolean`, default value `false`
    -   `allowEditing`: type `boolean`, default value `true`
    -   `allowInheriting`: type `boolean`, default value `true`
    -   `allowSizingOnChildren`: type `boolean`, default value `false`
    -   `allowVerticalAlignment`: type `boolean`, default value `true`
    -   `allowJustification`: type `boolean`, default value `true`
    -   `allowOrientation`: type `boolean`, default value `true`
    -   `allowCustomContentAndWideSize`: type `boolean`, default value `true`

This value only applies to blocks that are containers for inner blocks. If set to `true` the layout type will be `flow`. For other layout types it's necessary to set the `type` explicitly inside the `default` object.

### layout.default

-   Type: `Object`
-   Default value: null

Allows setting the `type` property to define what layout type is default for the block, and also default values for any properties inherent to that layout type. For example, for a `flex` layout, a default value can be set for `flexWrap`.

### layout.allowSwitching

-   Type: `boolean`
-   Default value: `false`

Exposes a switcher control that allows toggling between all existing layout types.

### layout.allowEditing

-   Type: `boolean`
-   Default value: `true`

Determines display of layout controls in the block sidebar. If set to false, layout controls will be hidden.

### layout.allowInheriting

-   Type: `boolean`
-   Default value: `true`

For the `flow` layout type only, determines display of the "Inner blocks use content width" toggle.

### layout.allowSizingOnChildren

-   Type: `boolean`
-   Default value: `false`

For the `flex` layout type only, determines display of sizing controls (Fit/Fill/Fixed) on all child blocks of the flex block.

### layout.allowVerticalAlignment

-   Type: `boolean`
-   Default value: `true`

For the `flex` layout type only, determines display of the vertical alignment control in the block toolbar.

### layout.allowJustification

-   Type: `boolean`
-   Default value: `true`

For the `flex` layout type, determines display of the justification control in the block toolbar and block sidebar. For the `constrained` layout type, determines display of justification control in the block sidebar.

### layout.allowOrientation

-   Type: `boolean`
-   Default value: `true`

For the `flex` layout type only, determines display of the orientation control in the block toolbar.

### layout.allowCustomContentAndWideSize

-   Type: `boolean`
-   Default value: `true`

For the `constrained` layout type only, determines display of the custom content and wide size controls in the block sidebar.

## lock

-   Type: `boolean`
-   Default value: `true`

A block may want to disable the ability to toggle the lock state. It can be locked/unlocked by a user from the block "Options" dropdown by default. To disable this behavior, set `lock` to `false`.

```js
supports: {
	// Remove support for locking UI.
	lock: false
}
```

## multiple

-   Type: `boolean`
-   Default value: `true`

A non-multiple block can be inserted into each post, one time only. For example, the built-in 'More' block cannot be inserted again if it already exists in the post being edited. A non-multiple block's icon is automatically dimmed (unclickable) to prevent multiple instances.

```js
supports: {
	// Use the block just once per post
	multiple: false
}
```

## position

_**Note:** Since WordPress 6.2._

-   Type: `Object`
-   Default value: null
-   Subproperties:
    -   `sticky`: type `boolean`, default value `false`

This value signals that a block supports some of the CSS style properties related to position. When it does, the block editor will show UI controls for the user to set their values if [the theme declares support](/docs/how-to-guides/themes/global-settings-and-styles.md#opt-in-into-ui-controls).

Note that sticky position controls are currently only available for blocks set at the root level of the document. Setting a block to the `sticky` position will stick the block to its most immediate parent when the user scrolls the page.

```js
supports: {
	position: {
		sticky: true // Enable selecting sticky position.
	}
}
```

When the block declares support for a specific position property, its attributes definition is extended to include the `style` attribute.

-   `style`: an attribute of `object` type with no default assigned. This is added when `sticky` support is declared. It stores the custom values set by the user. For example:

```js
attributes: {
    style: {
        position: {
            type: "sticky",
            top: "0px"
        }
    }
}
```

## renaming

_**Note:** Since WordPress 6.5._

-   Type: `boolean`
-   Default value: `true`

By default, a block can be renamed by a user from the block 'Options' dropdown or the 'Advanced' panel. To disable this behavior, set renaming to false.

```js
supports: {
	// Don't allow the block to be renamed in the editor.
	renaming: false,
}
```

## reusable

-   Type: `boolean`
-   Default value: `true`

A block may want to disable the ability of being converted into a reusable block. By default all blocks can be converted to a reusable block. If supports reusable is set to false, the option to convert the block into a reusable block will not appear.

```js
supports: {
	// Don't allow the block to be converted into a reusable block.
	reusable: false,
}
```

## shadow

_**Note:** Since WordPress 6.5._

-   Type: `boolean`
-   Default value: `false`

This property adds block controls which allow the user to set a box shadow for a block. Shadows are disabled by default.

```js
supports: {
	shadow: true // Enable the box-shadow picker.
}
```

Shadow presets are sourced from the shadow presets defined in `theme.json`.

When the block declares support for `shadow`, the attributes definition is extended to include the `style` attribute:

-   `style`: an attribute of `object` type with no default assigned.

    When a shadow is selected, the color value is stored in the `style.shadow`.

    The block can apply a default shadow by specifying its own attribute with a default. For example:

    ```js
    attributes: {
        style: {
            type: 'object',
            default: {
    			shadow: "var:preset|shadow|deep"
            }
        }
    }
    ```

## spacing

-   Type: `Object`
-   Default value: null
-   Subproperties:
    -   `margin`: type `boolean` or `array`, default value `false`
    -   `padding`: type `boolean` or `array`, default value `false`
    -   `blockGap`: type `boolean` or `array`, default value `false`

This value signals that a block supports some of the CSS style properties related to spacing. When it does, the block editor will show UI controls for the user to set their values if [the theme declares support](/docs/how-to-guides/themes/theme-support.md#cover-block-padding).

```js
supports: {
    spacing: {
        margin: true,  // Enable margin UI control.
        padding: true, // Enable padding UI control.
        blockGap: true,  // Enables block spacing UI control for blocks that also use `layout`.
    }
}
```

When the block declares support for a specific spacing property, its attributes definition is extended to include the `style` attribute.

-   `style`: an attribute of `object` type with no default assigned. This is added when `margin` or `padding` support is declared. It stores the custom values set by the user. For example:

```js
attributes: {
    style: {
        margin: 'value',
        padding: {
            top: 'value',
        }
    }
}
```

A spacing property may define an array of allowable sides – 'top', 'right', 'bottom', 'left' – that can be configured. When such arbitrary sides are defined, only UI controls for those sides are displayed.

Axial sides are defined with the `vertical` and `horizontal` terms, and display a single UI control for each axial pair (for example, `vertical` controls both the top and bottom sides). A spacing property may support arbitrary individual sides **or** axial sides, but not a mix of both.

Note: `blockGap` accepts `vertical` and `horizontal` axial sides, which adjust gap column and row values. `blockGap` doesn't support arbitrary sides.

```js
supports: {
    spacing: {
        margin: [ 'top', 'bottom' ],             // Enable margin for arbitrary sides.
        padding: true,                           // Enable padding for all sides.
        blockGap: [ 'horizontal', 'vertical' ],  // Enables axial (column/row) block spacing controls
    }
}
```

## typography

-   Type: `Object`
-   Default value: `null`
-   Subproperties:
    -   `fontSize`: type `boolean`, default value `false`
    -   `lineHeight`: type `boolean`, default value `false`
    -   `textAlign`: type `boolean` or `array`, default value `false`

The presence of this object signals that a block supports some typography related properties. When it does, the block editor will show a typography UI allowing the user to control their values.

```js
supports: {
    typography: {
        // Enable support and UI control for font-size.
        fontSize: true,
        // Enable support and UI control for line-height.
        lineHeight: true,
        // Enable support and UI control for text alignment.
        textAlign: true,
    },
}
```

### typography.fontSize

-   Type: `boolean`
-   Default value: `false`

This value signals that a block supports the font-size CSS style property. When it does, the block editor will show an UI control for the user to set its value.

The values shown in this control are the ones declared by the theme via the `editor-font-sizes` [theme support](/docs/how-to-guides/themes/theme-support.md#block-font-sizes), or the default ones if none are provided.

```js
supports: {
    typography: {
        // Enable support and UI control for font-size.
        fontSize: true,
    },
}
```

When the block declares support for `fontSize`, the attributes definition is extended to include two new attributes: `fontSize` and `style`:

-   `fontSize`: an attribute of `string` type with no default assigned. It stores any preset value selected by the user. The block can apply a default fontSize by specifying its own `fontSize` attribute with a default. For example:

```js
attributes: {
    fontSize: {
        type: 'string',
        default: 'some-value',
    }
}
```

-   `style`: an attribute of `object` type with no default assigned. It stores the custom values set by the user and is shared with other block supports such as color. The block can apply a default style by specifying its own `style` attribute with a default. For example:

```js
attributes: {
    style: {
        type: 'object',
        default: {
            typography: {
                fontSize: 'value'
            }
        }
    }
}
```

### typography.lineHeight

-   Type: `boolean`
-   Default value: `false`

This value signals that a block supports the line-height CSS style property. When it does, the block editor will show an UI control for the user to set its value if [the theme declares support](/docs/how-to-guides/themes/theme-support.md#supporting-custom-line-heights).

```js
supports: {
    typography: {
        // Enable support and UI control for line-height.
        lineHeight: true,
    },
}
```

When the block declares support for `lineHeight`, the attributes definition is extended to include a new attribute `style` of `object` type with no default assigned. It stores the custom value set by the user. The block can apply a default style by specifying its own `style` attribute with a default. For example:

```js
attributes: {
    style: {
        type: 'object',
        default: {
            typography: {
                lineHeight: 'value'
            }
        }
    }
}
```

### typography.textAlign

_**Note:** Since WordPress 6.6._

-   Type: `boolean` or `array`
-   Default value: `false`

This property adds block toolbar controls which allow to change block's text alignment.

```js
supports: {
    typography: {
        // Declare support for block's text alignment.
        // This adds support for all the options:
        // left, center, right.
        textAlign: true
    }
}
```

```js
supports: {
    typography: {
        // Declare support for specific text alignment options.
        textAlign: [ 'left', 'right' ]
    }
}
```

When the block declares support for `textAlign`, the attributes definition is extended to include a new attribute `style` of `object` type with no default assigned. It stores the custom value set by the user. The block can apply a default style by specifying its own `style` attribute with a default. For example:

```js
attributes: {
    style: {
        type: 'object',
        default: {
            typography: {
                textAlign: 'value'
            }
        }
    }
}
```

## splitting

When set to `true`, `Enter` will split the block into two blocks. Note that this
is only meant for simple text blocks such as paragraphs and headings with a
single `RichText` field. RichText in the `edit` function _must_ have an
`identifier` prop that matches the attribute key of the text, so that it updates
the selection correctly and we know where to split.
