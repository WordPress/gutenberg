## Block Caption

The `BlockCaption` component renders block-level UI for adding and editing captions. It wraps logic around the more generic `Caption` component to provide an editable caption field that is designed specifically for block-level use.

`BlockCaption` is used in several native blocks, including `Video`, `Image`, `Audio`, etc.

## Development guidelines

### Usage

Renders an editable caption field designed specifically for block-level use.

```jsx
import { BlockCaption, RichText } from '@wordpress/block-editor';

const MyBlockCaption = (
	clientId,
	isCaptionSelected,
	onFocusCaption,
	onBlur,
	insertBlocksAfter
) => (
	<BlockCaption
		clientId={ clientId }
		accessible={ true }
		accessibilityLabelCreator={ ( caption ) =>
			RichText.isEmpty( caption )
				? /* translators: accessibility text. Empty caption. */
				  'Caption. Empty'
				: sprintf(
						/* translators: accessibility text. %s: caption. */
						__( 'Caption. %s' ),
						caption
				  )
		}
		isSelected={ isCaptionSelected }
		onFocus={ onFocusCaption }
		onBlur={ onBlur }
		insertBlocksAfter={ insertBlocksAfter }
	/>
);
```

### Props

The `clientId` prop is the only required prop.

The `onBlur`, `onFocus`, `isSelected`, and `insertBlocksAfter` props are all passed directly to the `Caption` component, which then passes them to the inner `RichText` component. ([See detailed info about the RichText component's props](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md)). These props are not strictly required, but necessary for many implementations of the component to function as expected.

The `accessible` prop is `false` by default and must be set to `true` in order to set an accessibility label via the `accessibilityLabelCreator` prop.

### `clientId`

-   **Type:** `String`
-   **Required:** `Yes`

The client ID of the block that the caption is associated with. This is prop is required in order for the component to perform key functionality, including retrieving the current caption from the block attributes.

### `accessible`

-   **Type:** `Boolean`
-   **Default:** `false`
-   **Required:** `No`

Boolean to indicate whether component is an accessibility element. When set to true, the component and all of its children will be treated as a single accessible element. Refer to [the relevant React Native documentation](https://reactnative.dev/docs/accessibility#accessible) for the most up-to-date information on this prop.

### `accessibilityLabelCreator`

-   **Type:** `Function`
-   **Required:** `No`

Function that returns an accessibility label, which screen readers will use for the component. The `accessible` prop must be set to `true` in order for this prop to have any effect.

### `onBlur`

-   **Type:** `Function`
-   **Required:** `No`

Handler for `onBlur` events, called when the component loses focus. Although not required, it's highly recommended to pass down the component's `onBlur` function to ensure that loss of focus is always handled correctly.

### `onFocus`

-   **Type:** `Function`
-   **Required:** `No`

Handler for `onFocus` events, called when the component is brought into focus. Similar to `onBlur`, it's not required but recommended. Passing down this prop helps to ensure focus is always handled as expected on the native side.

### `isSelected`

-   **Type:** `Boolean`
-   **Required:** `No`

Boolean that indicates whether the caption is currently selected. This is used by the child `RichText` component to determine whether to display formatting controls.

### `insertBlocksAfter`

-   **Type:** `Function`
-   **Required:** `No`

Function to handle how blocks are inserted after pressing enter at the end of the component.

## Related components

`BlockCaption` passes props directly to the [`Caption`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/caption) component. In turn, the `Caption` component uses the [`RichText`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/) component. It is recommended to refer to each of those components' documentation for more information on their props and usage.
