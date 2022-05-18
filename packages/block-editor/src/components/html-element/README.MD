# HtmlElementControl

Allow users to select the HTML tag used by the block.

## Usage

```jsx
import { HtmlElementControl } from '@wordpress/block-editor';

const Example = () => (
	<HtmlElementControl
		selectedValue={ TagName }
		onChange={ ( value ) =>
			setAttributes( { tagName: value } )
		}
	/>
);
```

## Props

The component accepts the following props:

### tagNameOptions

An array of tag names and labels. Should be of the format:

```js
[
	{ label: __( 'Default (<div>)' ), value: 'div' },
	{ label: '<header>', value: 'header' },
	...
]
```

If not provided, the default selection of tags are shown.

-   Type: `Array`
-   Required: No

Default:

```js
[
		{ label: '<div>', value: 'div' },
		{ label: '<header>', value: 'header' },
		{ label: '<main>', value: 'main' },
		{ label: '<section>', value: 'section' },
		{ label: '<article>', value: 'article' },
		{ label: '<aside>', value: 'aside' },
		{ label: '<footer>', value: 'footer' },
		{ label: '<nav>', value: 'nav' },
	];
```

### selectedValue

The selected value from the select list.

-   Type: `String`
-   Required: Yes

### onChange

The function called when the tag changes.

-   Type: `Function`
-   Required: Yes
