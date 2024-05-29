# Selectors

Block Selectors is the API that allows blocks to customize the CSS selector used
when their styles are generated.

A block may customize its CSS selectors at three levels: root, feature, and
subfeature.

## Root selector

The root selector is the block's primary CSS selector.

All blocks require a primary CSS selector for their style declarations to be
included under. If one is not provided through the Block Selectors API, a
default is generated in the form of `.wp-block-<name>`.

### Example

```json
{
	...
	"selectors": {
		"root": ".my-custom-block-selector"
	}
}
```

## Feature selectors

Feature selectors relate to styles for a block support, e.g. border, color,
typography, etc.

A block may wish to apply the styles for specific features to different
elements within a block. An example might be using colors on the block's wrapper
but applying the typography styles to an inner heading only.

### Example

```json
{
	...
	"selectors": {
		"root": ".my-custom-block-selector",
		"color": ".my-custom-block-selector",
		"typography": ".my-custom-block-selector > h2"
	}
}
```

## Subfeature selectors

These selectors relate to individual styles provided by a block support e.g.
`background-color`

A subfeature can have styles generated under its own unique selector. This is
especially useful where one block support subfeature can't be applied to the
same element as the support's other subfeatures.

A great example of this is `text-decoration`. Web browsers render this style
differently, making it difficult to override if added to a wrapper element. By
assigning `text-decoration` a custom selector, its style can target only the
elements to which it should be applied.

### Example

```json
{
	...
	"selectors": {
		"root": ".my-custom-block-selector",
		"color": ".my-custom-block-selector",
		"typography": {
			"root": ".my-custom-block-selector > h2",
			"text-decoration": ".my-custom-block-selector > h2 span"
		}
	}
}
```

## Shorthand

Rather than specify a CSS selector for every subfeature, you can set a single
selector as a string value for the relevant feature. This is the approach
demonstrated for the `color` feature in the earlier examples above.

## Fallbacks

A selector that hasn't been configured for a specific feature will fall back to
the block's root selector. Similarly, if a subfeature hasn't had a custom
selector set, it will fall back to its parent feature's selector and, if unavailable, fall back further to the block's root selector.

Rather than repeating selectors for multiple subfeatures, you can set the
common selector as the parent feature's `root` selector and only define the
unique selectors for the subfeatures that differ.

### Example

```json
{
	...
	"selectors": {
		"root": ".my-custom-block-selector",
		"color": {
			"text": ".my-custom-block-selector p"
		},
		"typography": {
			"root": ".my-custom-block-selector > h2",
			"text-decoration": ".my-custom-block-selector > h2 span"
		}
	}
}
```

The `color.background-color` subfeature isn't explicitly set in the above
example. As the `color` feature also doesn't define a `root` selector,
`color.background-color` would be included under the block's primary root
selector, `.my-custom-block-selector`.

For a subfeature such as `typography.font-size`, it would fallback to its parent
feature's selector given that is present, i.e. `.my-custom-block-selector > h2`.
