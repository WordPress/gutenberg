# Notice

This component is used to display notices in the editor. Notices also provide audible messages to assistive technologies using ARIA live regions. By default, the audible message will be the content fo the notice. To use a different audible message, use the `spokenMessage` prop.

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

Use the `spokenMessage` prop to provide a meaningful audible message, for example to exclude part of the content that wouldn't make much sense for assistive technologies users:

```jsx
const MyNotice = () => (
	<Notice status="error" spokenMessage="An error occurred while saving">
		<p>An error occurred while saving. <a href={ myLink }>Learn more</a>.</p>
	</Notice>
);
```

### Props

The following props are used to control the component.

* `status`: (string) can be `warning` (yellow), `success` (green), `error` (red).
* `onRemove`: function called when dismissing the notice
* `isDismissible`: (bool) defaults to true, whether the notice should be dismissible or not
* `spokenMessage`: (string) alternate audible message for the ARIA live region
