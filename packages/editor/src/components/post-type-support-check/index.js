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
 * @param {Element}           props.children    Children to be rendered if post
 *                                              type supports.
 * @param {(string|string[])} props.supportKeys String or string array of keys
 *                                              to test.
 *
 * @return {Component} The component to be rendered.
 */
function PostTypeSupportCheck( { children, supportKeys } ) {
	const postType = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );
		return getPostType( getEditedPostAttribute( 'type' ) );
	}, [] );
	let isSupported = !! postType;
	if ( postType ) {
		isSupported = (
			Array.isArray( supportKeys ) ? supportKeys : [ supportKeys ]
		).some( ( key ) => !! postType.supports[ key ] );
	}

	if ( ! isSupported ) {
		return null;
	}

	return children;
}

export default PostTypeSupportCheck;
