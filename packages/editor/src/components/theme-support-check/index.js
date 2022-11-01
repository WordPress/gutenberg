/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export function ThemeSupportCheck( {
	themeSupports,
	children,
	postType,
	supportKeys,
} ) {
	const isSupported = (
		Array.isArray( supportKeys ) ? supportKeys : [ supportKeys ]
	 ).some( ( key ) => {
		const supported = get( themeSupports, [ key ], false );
		// 'post-thumbnails' can be boolean or an array of post types.
		// In the latter case, we need to verify `postType` exists
		// within `supported`. If `postType` isn't passed, then the check
		// should fail.
		if ( 'post-thumbnails' === key && Array.isArray( supported ) ) {
			return supported.includes( postType );
		}
		return supported;
	} );

	if ( ! isSupported ) {
		return null;
	}

	return children;
}

export default withSelect( ( select ) => {
	const { getThemeSupports } = select( coreStore );
	const { getEditedPostAttribute } = select( editorStore );
	return {
		postType: getEditedPostAttribute( 'type' ),
		themeSupports: getThemeSupports(),
	};
} )( ThemeSupportCheck );
