# Theme Support

By default, blocks provide their styles to enable basic support for blocks in themes without any change. Themes can add/override these styles, or they can provide no styles at all, and rely fully on what the theme provides.

Some advanced block features require opt-in support in the theme itself as it's difficult for the block to provide these styles, they may require some architecting of the theme itself, in order to work well.

To opt-in for one of these features, call `add_theme_support` in the `functions.php` file of the theme. For example:

```php
function mytheme_setup_theme_supported_features() {
	add_theme_support( 'editor-color-palette',
		array(
			'name' => 'strong magenta',
			'color' => '#a156b4',
		),
		array(
			'name' => 'light grayish magenta',
			'color' => '#d0a5db',
		),
		array(
			'name' => 'very light gray',
			'color' => '#eee',
		),
		array(
			'name' => 'very dark gray',
			'color' => '#444',
		)
	);
}

add_action( 'after_setup_theme', 'mytheme_setup_theme_supported_features' );
```

## Opt-in features

### Wide Alignment:

Some blocks such as the image block have the possibility to define a "wide" or "full" alignment by adding the corresponding classname to the block's wrapper ( `alignwide` or `alignfull` ). A theme can opt-in for this feature by calling:

```php
add_theme_support( 'align-wide' );
```

### Block Color Palettes:

Different blocks have the possibility of customizing colors. Gutenberg provides a default palette, but a theme can overwrite it and provide its own:

```php
add_theme_support( 'editor-color-palette',
	array(
		'name' => 'strong magenta',
		'color' => '#a156b4',
	),
	array(
		'name' => 'light grayish magenta',
		'color' => '#d0a5db',
	),
	array(
		'name' => 'very light gray',
		'color' => '#eee',
	),
	array(
		'name' => 'very dark gray',
		'color' => '#444',
	)
);
```

The colors will be shown in order on the palette, and there's no limit to how many can be specified.

Themes are responsible for creating the classes that apply the colors in different contexts. Core blocks use "color" and "background-color" contexts. So to correctly apply "strong magenta" to all contexts of core blocks a theme should implement the following classes:

```css
.has-strong-magenta-background-color {
	background-color: #313131;
}

.has-strong-magenta-color {
	color: #f78da7;
}
```

The class name is built appending 'has-', followed by the class name *using* kebab case and ending with the context name.

### Disabling custom colors in block Color Palettes

By default, the color palette offered to blocks, allows the user to select a custom color different from the editor or theme default colors.
Themes can disable this feature using:
```php
add_theme_support( 'disable-custom-colors' );
```

This flag will make sure users are only able to choose colors from the `editor-color-palette` the theme provided or from the editor default colors if the theme did not provide one.
