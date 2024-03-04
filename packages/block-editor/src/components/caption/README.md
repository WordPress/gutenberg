## Caption

The `Caption` component renders the [caption part](https://wordpress.org/documentation/article/gallery-block/#caption) of some blocks (image, gallery...).

This component encapsulates the "caption" behaviour and styles over a `<RichText>` so it can be used in other components such as the `BlockCaption` component.

## Development guidelines

### Usage

Renders a Caption area:

```jsx
import { Caption } from '@wordpress/block-editor';
const BlockCaption = ( {
	onBlur,
	onChange,
	onFocus,
	isSelected,
	shouldDisplay,
	text,
	insertBlocksAfter,
} ) => (
	<View >
		<Caption
			isSelected={ isSelected }
			onBlur={ onBlur }
			onChange={ onChange }
			onFocus={ onFocus }
			shouldDisplay={ shouldDisplay }
			value={ text }
			insertBlocksAfter={ insertBlocksAfter }
		/>
	</View>
);
```

### Props

The properties `isSelected`, `onBlur`, `onChange`, `onFocus`, `shouldDisplay`, `value`, `insertBlocksAfter` of this component are passed directly to their related props of its inner `<RichText>` component ([see detailed info about the RichText component's props](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md)).

## Related components

Caption components is mostly used by the [`BlockCaption`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/block-caption) component.