/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { withSelect } from '@wordpress/data';

/**
 * Adds annotation className to the block-list-block component.
 *
 * @param {Object} OriginalComponent The original BlockListBlock component.
 * @return {Object} The enhanced component.
 */
const addAnnotationClassName = ( OriginalComponent ) => {
	return withSelect( ( select, { clientId } ) => {
		const annotations = select( 'core/annotations' ).__experimentalGetAnnotationsForBlock( clientId );

		return {
			className: annotations.map( ( annotation ) => {
				return 'is-annotated-by-' + annotation.source;
			} ).join( ' ' ),
		};
	} )( OriginalComponent );
};

addFilter( 'editor.BlockListBlock', 'core/annotations', addAnnotationClassName );
