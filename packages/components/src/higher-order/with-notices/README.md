# withNotices

`withNotices` is a React [higher-order component](https://facebook.github.io/react/docs/higher-order-components.html) used typically in adding the ability to post notice messages within the original component.

Wrapping the original component with `withNotices` encapsulates the component with the additional props `noticeOperations` and `noticeUI`.

**noticeOperations**
Contains a number of useful functions to add notices to your site.

<a  name="createNotice"  href="#createNotice">#</a> **createNotice**
Function passed down as a prop that adds a new notice.

_Parameters_

-   _notice_ `object`: Notice to add.

<a  name="createErrorNotice"  href="#createErrorNotice">#</a> **createErrorNotice**
Function passed as a prop that adds a new error notice.

_Parameters_

-   _msg_ `string`: Error message of the notice.

<a  name="removeAllNotices"  href="#removeAllNotices">#</a> **removeAllNotices**
Function that removes all notices.

<a  name="removeNotice"  href="#removeNotice">#</a> **removeNotice**
Function that removes notice by ID.

_Parameters_

-   _id_ `string`: ID of notice to remove.

<a  name="noticeUi"  href="#noticeUi">#</a>**noticeUi**
The rendered `NoticeList`.

## Usage

```jsx
import { withNotices, Button } from '@wordpress/components';

const MyComponentWithNotices = withNotices(
	( { noticeOperations, noticeUI } ) => {
		const addError = () =>
			noticeOperations.createErrorNotice( 'Error message' );
		return (
			<div>
				{ noticeUI }
				<Button variant="secondary" onClick={ addError }>
					Add error
				</Button>
			</div>
		);
	}
);
```
