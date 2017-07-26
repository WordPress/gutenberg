# Attribute Matchers

Attribute matchers are used to define the strategy by which block attribute values are extracted from saved post content. They provide a mechanism to map from the saved markup to a JavaScript representation of a block.

Each matcher accepts an optional selector as the first argument. If a selector is specified, the matcher behavior will be run against the corresponding element(s) contained within the block. Otherwise it will be run against the block's root node.

Under the hood, attribute matchers are a superset of functionality provided by [hpq](https://github.com/aduth/hpq), a small library used to parse and query HTML markup into an object shape. In an object of attributes matchers, you can name the keys as you see fit. The resulting object will assign as a value to each key the result of its attribute matcher.

## Common Matchers

### `attr`

Use `attr` to extract the value of an attribute from markup.

_Example_: Extract the `src` attribute from an image found in the block's markup.

```js
{
	url: attr( 'img', 'src' )
}
// { "url": "https://lorempixel.com/1200/800/" }
```

### `html`

Use `html` to extract inner HTML of the matched element. This is most commonly used in combination with the `Editable` component.

_Example_: Extract HTML from a paragraph of rich text.

```js
{
	content: html( 'p' )	
}
// { "content": "Vestibulum eu <strong>tortor</strong> vel urna." }
```

### `query`

Use `query` to extract an array of values from markup. Entries of the array are determined by the selector argument, where each matched element within the block will have an entry structured corresponding to the second argument, an object of attribute matchers.

_Example_: Extract `src` and `alt` from each image element in the block's markup.

```js
{
	images: query( 'img', {
		url: attr( 'src' )
		alt: attr( 'alt' )
	} )
}
// {
//   "images": [ 
//     { "url": "https://lorempixel.com/1200/800/", "alt": "large image" },
//     { "url": "https://lorempixel.com/50/50/", "alt": "small image" }
//   ]
// }
```
