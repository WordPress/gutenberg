/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';

function ScreenDuotone() {
	return (
		<>
			<ScreenHeader title={ __( 'Duotone panel!' ) } />
		</>
	);
}

export default ScreenDuotone;
