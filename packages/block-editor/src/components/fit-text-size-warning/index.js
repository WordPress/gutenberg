/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { speak } from '@wordpress/a11y';

/**
 * Component that checks if the fit text computed font size is below a minimum
 * threshold and displays a warning notice.
 *
 * @return {Element|null} Warning notice element or null.
 */
export default function FitTextSizeWarning() {
	const message = __(
		'The text may be too small to read. Consider using a larger container or less text.'
	);

	// Note: The `Notice` component can speak messages via its `spokenMessage`
	// prop, but similar to the contrast checker, we use granular control over
	// when the announcements are made.
	useEffect( () => {
		speak( message );
	}, [ message ] );

	return (
		<div className="block-editor-fit-text-size-warning">
			<Notice
				spokenMessage={ null }
				status="warning"
				isDismissible={ false }
			>
				{ message }
			</Notice>
		</div>
	);
}
