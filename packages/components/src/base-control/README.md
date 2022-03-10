# BaseControl

BaseControl component is used to generate labels and help text for components handling user inputs.

## Usage

Render a BaseControl for a textarea input:

```jsx
import { BaseControl } from '@wordpress/components';

const MyBaseControl = () => (
	<BaseControl id="textarea-1" label="Text" help="Enter some text" __nextHasNoMarginBottom={ true }>
		<textarea id="textarea-1" />
	</BaseControl>
);
```

## Props

The component accepts the following props:

### id

The id of the element to which labels and help text are being generated. That element should be passed as a child.

-   Type: `String`
-   Required: Yes

### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

### help

If this property is added, a help text will be generated using help property as the content.

-   Type: `String|WPElement`
-   Required: No

### className

The class that will be added with "components-base-control" to the classes of the wrapper div.
If no className is passed only components-base-control is used.

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

`BaseControl.VisualLabel` component is used to render a purely visual label inside a `BaseControl` component.
It should only be used in cases where the children being rendered inside BaseControl are already properly labeled, e.g., a button, but we want an additional visual label for that section equivalent to the labels BaseControl would otherwise use if the label prop was passed.

## Usage

```jsx
import { BaseControl } from '@wordpress/components';

const MyBaseControl = () => (
	<BaseControl help="Pressing the Select an author button will open a modal that allows an advanced mechanism for author selection">
		<BaseControl.VisualLabel>Author</BaseControl.VisualLabel>
		<Button>Select an author</Button>
	</BaseControl>
);
```

### Props

#### className

The class that will be added with `components-base-control__label` to the classes of the wrapper div.
If no className is passed only `components-base-control__label` is used.

-   Type: `String`
-   Required: No

#### children

The content to be displayed within the `BaseControl.VisualLabel`.

-   Type: `Element`
-   Required: Yes
