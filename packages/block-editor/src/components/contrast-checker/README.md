# ContrastChecker

ContrastChecker component determines if contrast for text styles is sufficient (WCAG 2.0 AA) when used with a given background color. 

ContrastChecker also accounts for font sizes.

A notice will be rendered if the color combination of text and background colors are low.

## Developer guidelines

### Usage

Checks the contrast of a `13px` dark gray font against a light gray background.

```jsx
import { ContrastChecker } from '@wordpress/block-editor';

const Example = () => {
	return (
		<ContrastChecker
			fontSize={ 13 }
			textColor="#111"
			backgroundColor="#eee"
		/>
	);
};
```

### Props

#### backgroundColor

The background color to check the contrast of text against.

-   Type: `String`
-   Required: No

#### fallbackBackgroundColor

A fallback background color value, in case `backgroundColor` is not available.

-   Type: `String`
-   Required: No

#### fallbackTextColor

A fallback text color value, in case `textColor` is not available.

-   Type: `String`
-   Required: No

#### fontSize

The font-size (as a `px` value) of the text to check the contrast against.

-   Type: `Number`
-   Required: No

#### isLargeText

Whether the text is large (approximately `24px` or higher).

-   Type: `Boolean`
-   Required: No

#### textColor

The text color to check the contrast of the background against.

-   Type: `String`
-   Required: No
