/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Warning from '../warning';

export default function BlockInvalidWarning( { blockTitle, icon } ) {
	const accessibilityLabel = sprintf(
		/* translators: accessibility text for blocks with invalid content. %d: localized block title */
		__( '%s block. This block has invalid content' ),
		blockTitle
	);

	return (
		<Warning
			title={ blockTitle }
			message={ __( 'Problem displaying block' ) }
			icon={ icon }
			accessible={ true }
			accessibilityLabel={ accessibilityLabel }
		/>
	);
}
