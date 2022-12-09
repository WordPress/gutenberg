/**
 * WordPress dependencies
 */
import { Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useLinkControlContext } from './';

export default function LinkControlNotice() {
	const { createPageErrorMessage } = useLinkControlContext();

	if ( ! createPageErrorMessage ) {
		return null;
	}
	return (
		<Notice
			className="block-editor-link-control__search-error"
			status="error"
			isDismissible={ false }
		>
			{ createPageErrorMessage }
		</Notice>
	);
}
