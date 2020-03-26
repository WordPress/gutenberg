/**
 * External dependencies
 */
import { compact, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import transformStyles from '../../utils/transform-styles';

function EditorStyles( { styles } ) {
	useEffect( () => {
		const updatedStyles = transformStyles(
			styles,
			'.editor-styles-wrapper'
		);

		const nodes = map( compact( updatedStyles ), ( updatedCSS ) => {
			const node = document.createElement( 'style' );
			node.innerHTML = updatedCSS;
			document.body.appendChild( node );

			return node;
		} );

		return () =>
			nodes.forEach( ( node ) => document.body.removeChild( node ) );
	}, [ styles ] );

	return null;
}

export default EditorStyles;
