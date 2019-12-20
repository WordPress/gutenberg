# Snackbar

Use Snackbars to communicate low priority, non-interruptive messages to the user.

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

A Snackbar displays a succinct message that is cleared out after a small delay. It can also offer the user options, like viewing a published post but these options should also be available elsewhere in the UI.

## Development guidelines

### Usage

To display a plain snackbar, pass the message as a `children` prop:

```jsx
const MySnackbarNotice = () => (
	<Snackbar>
		Post published successfully.
	</Snackbar>
);
```

For more complex markup, you can pass any JSX element:

```jsx
const MySnackbarNotice = () => (
	<Snackbar>
		<p>An error occurred: <code>{ errorDetails }</code>.</p>
	</Snackbar>
);
```

#### Props

The following props are used to control the display of the component.

* `onRemove`: function called when dismissing the notice.
* `actions`: (array) an array of action objects. Each member object should contain a `label` and either a `url` link string or `onClick` callback function.

## Related components

- To create a prominent message that requires a higher-level of attention, use a Notice.
