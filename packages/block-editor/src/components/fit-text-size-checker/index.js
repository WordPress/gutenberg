/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { speak } from '@wordpress/a11y';

const MIN_FONT_SIZE_FOR_WARNING = 6;

/**
 * Component that checks if the fit text computed font size is below a minimum
 * threshold and displays a warning notice.
 *
 * @param {Object} props          Component props.
 * @param {number} props.fontSize The computed font size in pixels.
 *
 * @return {Element|null} Warning notice element or null.
 */
export default function FitTextSizeChecker( { fontSize } ) {
	if ( fontSize === null || fontSize >= MIN_FONT_SIZE_FOR_WARNING ) {
		return null;
	}

	const message = __(
		'The text may be too small to read. Consider using a larger container or less text.'
	);

	// Note: The `Notice` component can speak messages via its `spokenMessage`
	// prop, but similar to the contrast checker, we use granular control over
	// when the announcements are made.
	speak( message );

	return (
		<div className="block-editor-fit-text-size-checker">
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
