/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Warning from '../warning';

export default function BlockInvalidWarning( { title, icon } ) {
	const accessibilityLabel = __( 'This block has problems ' );
	return (
		<Warning
			title={ title }
			message={ __( 'Problem displaying block' ) }
			icon={ icon }
			accessible={ true }
			accessibilityLabel={ accessibilityLabel }
		/>
	);
}
