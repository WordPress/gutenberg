/**
 * External dependencies
 */
import { get, some, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';

export function ThemeSupportCheck( { themeSupports, children, supportKeys } ) {
	const isSupported = some(
		castArray( supportKeys ), ( key ) => get( themeSupports, [ key ], false )
	);

	if ( ! isSupported ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { getThemeSupports } = select( 'core' );
	return {
		themeSupports: getThemeSupports(),
	};
} )( ThemeSupportCheck );
