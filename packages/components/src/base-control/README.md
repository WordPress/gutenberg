# BaseControl

`BaseControl` is a component used to generate labels and help text for components handling user inputs.

## Usage

```jsx
import { BaseControl, useBaseControlProps } from '@wordpress/components';

// Render a `BaseControl` for a textarea input
const MyCustomTextareaControl = ({ children, ...baseProps }) => (
	// `useBaseControlProps` is a convenience hook to get the props for the `BaseControl`
	// and the inner control itself. Namely, it takes care of generating a unique `id`,
	// properly associating it with the `label` and `help` elements.
	const { baseControlProps, controlProps } = useBaseControlProps( baseProps );

	return (
		<BaseControl { ...baseControlProps } __nextHasNoMarginBottom>
			<textarea { ...controlProps }>
			  { children }
			</textarea>
		</BaseControl>
	);
);
```

## Props

The component accepts the following props:

### id

The HTML `id` of the control element (passed in as a child to `BaseControl`) to which labels and help text are being generated. This is necessary to accessibly associate the label with that element.

The recommended way is to use the `useBaseControlProps` hook, which takes care of generating a unique `id` for you. Otherwise, if you choose to pass an explicit `id` to this prop, you are responsible for ensuring the uniqueness of the `id`.

-   Type: `String`
-   Required: No

### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

### help

Additional description for the control. Only use for meaningful description or instructions for the control. An element containing the description will be programmatically associated to the BaseControl by the means of an `aria-describedby` attribute.

-   Type: `ReactNode`
-   Required: No

### className

Any other classes to add to the wrapper div.

-   Type: `String`
-   Required: No

### children

The content to be displayed within the BaseControl.

-   Type: `Element`
-   Required: Yes

### __nextHasNoMarginBottom

Start opting into the new margin-free styles that will become the default in a future version.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

## BaseControl.VisualLabel

`BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.

It should only be used in cases where the children being rendered inside BaseControl are already accessibly labeled, e.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would otherwise use if the `label` prop was passed.

## Usage

```jsx
import { BaseControl } from '@wordpress/components';

const MyBaseControl = () => (
	<BaseControl
		__nextHasNoMarginBottom
		help="This button is already accessibly labeled."
	>
		<BaseControl.VisualLabel>Author</BaseControl.VisualLabel>
		<Button>Select an author</Button>
	</BaseControl>
);
```

### Props

#### className

Any other classes to add to the wrapper div.

-   Type: `String`
-   Required: No

#### children

The content to be displayed within the `BaseControl.VisualLabel`.

-   Type: `Element`
-   Required: Yes
