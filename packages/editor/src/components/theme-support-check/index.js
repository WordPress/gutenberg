/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Checks if the current theme supports specific features and renders the children if supported.
 *
 * @param {Object}          props             The component props.
 * @param {Element}         props.children    The children to render if the theme supports the specified features.
 * @param {string|string[]} props.supportKeys The key(s) of the theme support(s) to check.
 *
 * @return {JSX.Element|null} The rendered children if the theme supports the specified features, otherwise null.
 */
export default function ThemeSupportCheck( { children, supportKeys } ) {
	const { postType, themeSupports } = useSelect( ( select ) => {
		return {
			postType: select( editorStore ).getEditedPostAttribute( 'type' ),
			themeSupports: select( coreStore ).getThemeSupports(),
		};
	}, [] );

	const isSupported = (
		Array.isArray( supportKeys ) ? supportKeys : [ supportKeys ]
	).some( ( key ) => {
		const supported = themeSupports?.[ key ] ?? false;
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
