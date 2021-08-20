/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function PreferencesModal( {
	title = __( 'Preferences' ),
	closeLabel = __( 'Close' ),
	...props
} ) {
	return (
		<Modal
			className="interface-preferences-modal"
			title={ title }
			closeLabel={ closeLabel }
			{ ...props }
		/>
	);
}
