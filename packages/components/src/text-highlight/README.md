# TextHighlight

Highlights occurances of a given string within another string of text. Wraps each match with a [`<mark>` tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/mark) which provides browser default styling.

## Usage

Pass in the `text` and the `highlight` string to be matched against. 

In the example below, the string `Gutenberg` would be highlighted twice. 

```jsx
import { TextHighlight } from '@wordpress/components';

const MyTextHighlight = () => (
	<TextHighlight
		text="Why do we like Gutenberg? Because Gutenberg is the best!"
		highlight="Gutenberg"
	/>
);
```

## Props

The component accepts the following props. 

### text

The string of text to be tested for occurances of then given `highlight`.

- Type: `String`
- Required: Yes


### highlight

The string to search for and highlight within the `text`. Case insensitive. Multiple matches.

- Type: `String`
- Required: Yes
