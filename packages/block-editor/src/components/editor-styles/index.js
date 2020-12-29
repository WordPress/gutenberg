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

export default function useEditorStyles( ref, styles ) {
	useEffect( () => {
		const updatedStyles = transformStyles(
			styles,
			'.editor-styles-wrapper'
		);

		const { ownerDocument } = ref.current;
		const nodes = map( compact( updatedStyles ), ( updatedCSS ) => {
			const node = ownerDocument.createElement( 'style' );
			node.innerHTML = updatedCSS;
			ownerDocument.body.appendChild( node );

			return node;
		} );

		return () =>
			nodes.forEach( ( node ) => ownerDocument.body.removeChild( node ) );
	}, [ ref, styles ] );
}
