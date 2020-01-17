# withNotices

## Usage

```jsx
import { withNotices, Button } from '@wordpress/components';

const MyComponentWithNotices = withNotices(
	( { noticeOperations, noticeUI } ) => {
		const addError = () => noticeOperations.createErrorNotice( 'Error message' );
		return (
			<div>
				{ noticeUI }
				<Button isSecondary onClick={ addError }>Add error</Button>
			</div>
		)
	}
);
```
