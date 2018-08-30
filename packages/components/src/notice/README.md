# Notice

This component is used to display notices in the editor. Notices use an ARIA `role="alert"`: they're assertive live regions and will be processed as such by assistive technologies. For this reason, they must be returned directly, without any wrappers.

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
* `isDismissible`: (bool) defaults to true, whether the notice should be dismissible or not
