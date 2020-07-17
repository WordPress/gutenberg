# AztecView

A component for rendering and editing HTML text.

## Usage

```jsx
import { AztecView } from '@wordpress/react-native-aztec';

const RichText = () => (
	<>
		<AztecView variant="title.large" as="h1" />			
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