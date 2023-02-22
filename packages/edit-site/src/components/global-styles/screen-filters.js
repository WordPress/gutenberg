/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenDuotone from './screen-duotone';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';

function ScreenFilters( { name } ) {
	return (
		<>
			<ScreenHeader
				title={ __( 'Filters' ) }
				description={ __(
					'Filter and effects work without replacing your original image'
				) }
			/>
			<ScreenDuotone name={ name } />
		</>
	);
}

export default ScreenFilters;
