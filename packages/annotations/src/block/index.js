/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store/constants';
/**
 * Adds annotation className to the block-list-block component.
 *
 * @param {Object} OriginalComponent The original BlockListBlock component.
 * @return {Object} The enhanced component.
 */
const addAnnotationClassName = ( OriginalComponent ) => {
	return withSelect( ( select, { clientId, className } ) => {
		const annotations = select(
			STORE_NAME
		).__experimentalGetAnnotationsForBlock( clientId );

		return {
			className: annotations
				.map( ( annotation ) => {
					return 'is-annotated-by-' + annotation.source;
				} )
				.concat( className )
				.filter( Boolean )
				.join( ' ' ),
		};
	} )( OriginalComponent );
};

addFilter(
	'editor.BlockListBlock',
	'core/annotations',
	addAnnotationClassName
);
