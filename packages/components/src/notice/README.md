# Notice

This component is used to display notices in editor.

## Usage

To display a plain notice, pass `Notice` a string:

```jsx
const MyNotice = () => (
	<Notice status="error">
		An unknown error occurred.
	</Notice>
);
```

For more complex markup, you can pass any JSX element:

```jsx
const MyNotice = () => (
	<Notice status="error">
		<p>An error occurred: <code>{ errorDetails }</code>.</p>
	</Notice>
);
```

### Props

The following props are used to control the display of the component.

* `status`: (string) can be `warning` (yellow), `success` (green), `error` (red).
* `onRemove`: function called when dismissing the notice
* `isDismissible`: (boolean) defaults to true, whether the notice should be dismissible or not
* `actions`: (array) an array of action objects. Each member object should contain a `label` and either a `url` link string or `onClick` callback function.
