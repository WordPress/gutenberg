# DateFormatPicker

The `DateFormatPicker` component renders controls that let the user choose a
_date format_. That is, how they want their dates to be formatted.

A user can pick _Default_ to use the default date format (usually set at the
site level).

Otherwise, a user may choose a suggested date format or type in their own date
format by selecting _Custom_.

All date format strings should be in the format accepted by by the [`dateI18n`
function in
`@wordpress/date`](https://github.com/WordPress/gutenberg/tree/trunk/packages/date#datei18n).

## Usage

```jsx
import { DateFormatPicker } from '@wordpress/block-editor';

const Example = () => {
	const [ format, setFormat ] = useState( null );
	return (
		<DateFormatPicker
			format={ format }
			defaultFormat={ 'M j, Y' }
			onChange={ ( nextFormat ) =>
				setFormat( nextFormat );
			}
		/>
	);
};
```

## Props

### `format`

The current date format selected by the user. If `null`, _Default_ is selected.

-   Type: `string|null`
-   Required: Yes

### `defaultFormat`

The default format string. Used to show to the user what the date will look like
if _Default_ is selected.

-   Type: `string`
-   Required: Yes

### `onChange`

Called when the user makes a selection, or when the user types in a date format.
`null` indicates that _Default_ is selected.

-   Type: `( format: string|null ) => void`
-   Required: Yes
