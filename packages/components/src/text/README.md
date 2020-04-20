# Text

A component for rendering text.

## Usage

```jsx
import { Text } from '@wordpress/components';

const HeroPanel = () => (
	<>
		<Text variant="title.large" as="h1">
			Hello World!
		</Text>
		<Text variant="body">Greetings to you!</Text>
	</>
);
```

## Props

The component accepts the following props:

#### as

Determines the HTML selector for the text.

For most use-cases you can use this component instead of a `h1`, `h2`, `h3`, `h4`, `h5`, `h6` or `p`.

-   Type: `String`
-   Required: No
-   Default: ''

#### variant

Determines the style for the text. Available variants:

-   `title`
-   `title.large`
-   `title.medium`
-   `title.small`
-   `subtitle`
-   `subtitle.large`
-   `subtitle.small`
-   `body`
-   `body.large`
-   `body.small`
-   `button`
-   `caption`
-   `label`

*   Type: `String`
*   Required: No
*   Default: 'body'
