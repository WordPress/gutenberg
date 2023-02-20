/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';

function ScreenFilters() {
	return (
		<>
			<ScreenHeader
				title={ __( 'Filters' ) }
				description={ __( 'TODO description' ) }
			/>
		</>
	);
}

export default ScreenFilters;
