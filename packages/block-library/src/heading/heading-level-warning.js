/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { Notice } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const INVALID_LEVEL_MESSAGE = __(
	'The chosen heading level may be invalid. See the content structure tool for more info.'
);

const INVALID_LEVEL_MESSAGE_SPOKEN = __(
	'The chosen heading level may be invalid. Use proper heading levels to organize your content for visitors and search engines. See the content structure tool for more info.'
);

export default function HeadingLevelWarning( { selectedLevel } ) {
	// For accessibility, announce the invalid heading level to screen readers.
	// The selectedLevel value is included in the dependency array so that the
	// message will be replayed if a new level is selected, but the new level is
	// still invalid.
	useEffect( () => {
		speak( INVALID_LEVEL_MESSAGE_SPOKEN );
	}, [ selectedLevel ] );

	return (
		<Notice
			className="block-library-heading__heading-level-warning"
			isDismissible={ false }
			status="warning"
		>
			{ INVALID_LEVEL_MESSAGE }
		</Notice>
	);
}
