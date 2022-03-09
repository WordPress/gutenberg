# DateFormatControl

The `DateFormatControl` component renders a dropdown that lets the user choose a
_date format_. That is, how they want their dates to be formatted.

A user can either pick _Site default_, a suggested format, or _Custom_.

_Site default_ is equivalent to no selection. It means that the user wants their
dates to be formatted however their website is configured to format dates.

Selecting _Custom_ will display a text box that lets the user type in any format
string.

All date format strings should be in the format accepted by by the [`dateI18n`
function in
`@wordpress/date`](https://github.com/WordPress/gutenberg/tree/trunk/packages/date#datei18n).

## Usage

```jsx
import { DateFormatControl } from '@wordpress/block-editor';

const Example = () => {
	const [ format, setFormat ] = useState( null );
	const siteFormat = 'M j, Y';
	return (
		<DateFormatControl
			format={ format }
			siteFormat={ siteFormat }
			onChange={ ( nextFormat ) =>
				setFormat( nextFormat );
			}
		/>
	);
};
```

## Props

### `format`

The current date format selected by the user. `null` represents no selection and
that the user wants to use the _Site default_ format.

The background color to check the contrast of text against.

-   Type: `string|null`
-   Required: Yes

### `siteFormat`

The _Site default_ format string. Used to show to the user what the date will
look like if _Site default_ is selected.

-   Type: `string`
-   Required: Yes

### `onChange`

Called when the user makes a selection, or when the user types in a _Custom_
format.

-   Type: `( format: string ) => void`
-   Required: Yes
