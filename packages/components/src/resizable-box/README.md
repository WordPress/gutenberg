# ResizableBox

ResizableBox is a wrapper around the [re-resizable package](https://github.com/bokuweb/re-resizable) with pre-defined classes and styles.

## Usage

Most options are passed directly through to [re-resizable](https://github.com/bokuweb/re-resizable) so you may wish to refer to their documentation. The primary differences in this component are that we set `handleClasses` (to use custom class names) and pass some null values to `handleStyles` (to unset some inline styles).

The example below shows how you might use `ResizableBox` to set a width and height inside a block's `edit` component.

```jsx
import { ResizableBox } from '@wordpress/components';

const Edit = ( props ) => {
	const {
		attributes: {
			height,
			width,
		},
		setAttributes,
		toggleSelection,
	} = props;

	return (
		<ResizableBox
			size={ {
				height,
				width,
			} }
			minHeight="50"
			minWidth="50"
			enable={ {
				top: false,
				right: true,
				bottom: true,
				left: false,
				topRight: false,
				bottomRight: true,
				bottomLeft: false,
				topLeft: false,
			} }
			onResizeStop={ ( event, direction, elt, delta ) => {
				setAttributes( {
					height: parseInt( height + delta.height, 10 ),
					width: parseInt( width + delta.width, 10 ),
				} );
				toggleSelection( true );
			} }
			onResizeStart={ () => {
				toggleSelection( false );
			} }
		/>
	);
}
```

### Props

Name | Type | Default | Description
--- | --- | --- | ---
`showHandle` | `bool` | `false` | Determines of the resize handles are visible.

For additional props, check out [re-resizable](https://github.com/bokuweb/re-resizable#props).