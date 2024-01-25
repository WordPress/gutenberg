# Snackbar

Use Snackbars to communicate low priority, non-interruptive messages to the user.

## Design guidelines

A Snackbar displays a succinct message that is cleared out after a small delay. It can also offer the user options, like viewing a published post but these options should also be available elsewhere in the UI.

## Development guidelines

### Usage

To display a plain snackbar, pass the message as a `children` prop:

```jsx
const MySnackbarNotice = () => (
	<Snackbar>Post published successfully.</Snackbar>
);
```

For more complex markup, you can pass any JSX element:

```jsx
const MySnackbarNotice = () => (
	<Snackbar>
		<p>
			An error occurred: <code>{ errorDetails }</code>.
		</p>
	</Snackbar>
);
```

### Props

The following props are used to control the display of the component.

#### `actions`: `NoticeAction[]`

An array of action objects. Each member object should contain a `label` and either a `url` link string or `onClick` callback function.

-   Required: No
-   Default: `[]`

#### `children`: `string`

The displayed message of a notice. Also used as the spoken message for assistive technology, unless `spokenMessage` is provided as an alternative message.

-   Required: Yes

#### `explicitDismiss`: `boolean`

Whether to require user action to dismiss the snackbar. By default, this is dismissed on a timeout, without user interaction.

-   Required: No
-   Default: `false`

#### `icon`: `ReactNode`

The icon to render in the snackbar.

-   Required: No
-   Default: `null`

#### `listRef`: `MutableRefObject< HTMLDivElement | null >`

A ref to the list that contains the snackbar.

-   Required: No

#### `onDismiss`: `() => void`

A callback executed when the snackbar is dismissed. It is distinct from onRemove, which _looks_ like a callback but is actually the function to call to remove the snackbar from the UI.

-   Required: No

#### `onRemove`: `() => void`

Function called when dismissing the notice.

-   Required: No

#### `politeness`: `'polite' | 'assertive'`

A politeness level for the notice's spoken message. Should be provided as one of the valid options for [an `aria-live` attribute value](https://www.w3.org/TR/wai-aria-1.1/#aria-live). Note that this value should be considered a suggestion; assistive technologies may override it based on internal heuristics.

A value of `'assertive'` is to be used for important, and usually time-sensitive, information. It will interrupt anything else the screen reader is announcing in that moment.

A value of `'polite'` is to be used for advisory information. It should not interrupt what the screen reader is announcing in that moment (the "speech queue") or interrupt the current task.

-   Required: No
-   Default: `'polite'`

#### `spokenMessage`: `string`

Used to provide a custom spoken message.

-   Required: No
-   Default: `children`

## Related components

-   To create a prominent message that requires a higher-level of attention, use a Notice.
