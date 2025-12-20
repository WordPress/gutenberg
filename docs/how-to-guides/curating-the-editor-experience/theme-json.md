# theme.json

A theme's theme.json file is one of the best ways to curate the Editor experience and will likely be the first tool you use before reaching for more sophisticated solutions. 

## Providing default controls/options

Since theme.json acts as a configuration tool, there are numerous ways to define at a granular level what options are available. This section will use duotone as an example since it showcases a feature that cuts across a few blocks and allows for varying levels of access.   

*Duotone with Core options and customization available for each image related block:*

```json
{
	"version": 3,
	"settings": {
		"color": {
			"customDuotone": true,
			"duotone": [
			]
		}
	}
}
```

*Duotone with theme defined color options, Core options, and customization available for each image related block:*

```json
{
	"version": 3,
	"settings": {
		"color": {
			"duotone": [
				{
					"colors": [ "#000000", "#ffffff" ],
					"slug": "foreground-and-background",
					"name": "Foreground and background"
				},
				{
					"colors": [ "#000000", "#ff0200" ],
					"slug": "foreground-and-secondary",
					"name": "Foreground and secondary"
				},
				{
					"colors": [ "#000000", "#7f5dee" ],
					"slug": "foreground-and-tertiary",
					"name": "Foreground and tertiary"
				},
			]
		}
	}
}
```

*Duotone with defined default options and all customization available for the Post Featured Image block:*

```json
{
	"version": 3,
	"settings": {
		"color": {
			"custom": true,
			"customDuotone": true
		},
		"blocks": {
			"core/post-featured-image": {
				"color": {
					"duotone": [
						{
							"colors": [ "#282828", "#ff5837" ],
							"slug": "black-and-orange",
							"name": "Black and Orange"
						},
						{
							"colors": [ "#282828", "#0288d1" ],
							"slug": "black-and-blue", 
							"name": "Black and Blue"
						}
					],
					"customDuotone": true,
					"custom": true
				}
			}
		}
	}
}
```

*Duotone with only defined default options and core options available for the Post Featured Image block (no customization):*

```json
{
	"version": 3,
	"settings": {
		"color": {
			"custom": true,
			"customDuotone": true
		},	
		"blocks": {
			"core/post-featured-image": {
				"color": {
					"duotone": [
						{
							"colors": [ "#282828", "#ff5837" ],
							"slug": "black-and-orange",
							"name": "Black and Orange"
						},
						{
							"colors": [ "#282828", "#0288d1" ],
							"slug": "black-and-blue",
							"name": "Black and Blue"
						}
					],
					"customDuotone": false,
					"custom": false
				}
			}
		} 
	}
}
```

## Limiting interface options with theme.json

### Limit options on a per-block basis

Beyond defining default values, using theme.json allows you to also remove options entirely and instead rely on what the theme has set in place. Below is a visual showing two extremes with the same paragraph block: 

![Image of restricted interface](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/Locking%20comparison%20visual.png?raw=true)

Continuing the examples with duotone, this means you could allow full access to all Duotone functionality for Image blocks and only limit the Post Featured Image block like so:

```json
{
	"version": 3,
	"settings": {
		"color": {
			"custom": true,
			"customDuotone": true
		},
		"blocks": {
			"core/image": {
				"color": {
					"duotone": [],
					"customDuotone": true,
					"custom": true
				}
			},
			"core/post-featured-image": {
				"color": {
					"duotone": [],
					"customDuotone": false,
					"custom": false
				}
			}
		}
	}
}
```

You can read more about how best to [turn on/off options with theme.json here](/docs/how-to-guides/themes/global-settings-and-styles.md). 

### Disable inherit default layout

To disable the “Inherit default layout” setting for container blocks like the Group block, remove the following section: 

```json
"layout": {
	"contentSize": null,
	"wideSize": null
},
```

### Limit options globally

When using theme.json in a block or classic theme, these settings will stop the default color and typography controls from being enabled globally, greatly limiting what’s possible:

```json
{
	"version": 3,
	"settings": {
		"layout": {
			"contentSize": "750px"
		},
		"color": {
			"background": false,
			"custom": false,
			"customDuotone": false,
			"customGradient": false,
			"defaultGradients": false,
			"defaultPalette": false,
			"text": false
		},
		"typography": {
			"customFontSize": false,
			"dropCap": false,
			"fontStyle": false,
			"fontWeight": false,
			"letterSpacing": false,
			"lineHeight": false,
			"textDecoration": false,
			"textTransform": false
		}
	}
}
```

To enable something from the above, just set whatever value you want to change to `true` for more granularity.