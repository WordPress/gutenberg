# Components

This packages includes a library of generic WordPress components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.

## Installation

Install the module

```bash
npm install @wordpress/components --save
```

## Usage

Within Gutenberg, these components can be accessed by importing from the `components` root directory:

```jsx
/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function MyButton() {
	return <Button>Click Me!</Button>;
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
