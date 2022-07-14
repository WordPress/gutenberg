/**
 * External dependencies
 */
import { castArray } from 'lodash';

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
 * A component which renders its own children only if the current editor post
 * type supports one of the given `supportKeys` prop.
 *
 * @param {Object}            props             Props.
 * @param {(string|string[])} props.supportKeys String or string array of keys
 *                                              to test.
 * @param {WPElement}         props.children    Children to be rendered if post
 *                                              type supports.
 *
 * @return {WPComponent} The component to be rendered.
 */
export default function PostTypeSupportCheck( { supportKeys, children } ) {
	return usePostTypeSupportCheck( supportKeys ) ? children : null;
}

export function usePostTypeSupportCheck( supportKeys ) {
	return useSelect( ( select ) => {
		const postTypeSlug =
			select( editorStore ).getEditedPostAttribute( 'type' );
		const postType = select( coreStore ).getPostType( postTypeSlug );
		if ( postType ) {
			return castArray( supportKeys ).some(
				( key ) => !! postType.supports[ key ]
			);
		}
		return true;
	}, [] );
}
