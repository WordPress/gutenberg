## Block Caption

The `BlockCaption` component renders block-level UI for adding and editing captions. It wraps logic around the more generic `Caption` component to provide an editable caption field that is designed specifically for block-level use.

`BlockCaption` is used in several native blocks, including `Video`, `Image`, `Audio`, etc.

## Development guidelines

### Usage

Renders an editable caption field designed specifically for block-level use.

```jsx
import { BlockCaption } from '@wordpress/block-editor';

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
			! caption
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

