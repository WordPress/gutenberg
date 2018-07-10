/**
 * WordPress dependencies
 */
import {
	ColorIndicator,
} from '@wordpress/components';
import { sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import withColorContext from '../color-palette/with-color-context';
import { getColorName } from '../colors';

export default withColorContext( ( { colors, colorValue, ariaLabel } ) => {
	if ( ! colorValue ) {
		return null;
	}

	const colorName = getColorName( colors, colorValue );

	return (
		<ColorIndicator
			colorValue={ colorValue }
			ariaLabel={ sprintf( ariaLabel, colorName || colorValue ) }
		/>
	);
} );
