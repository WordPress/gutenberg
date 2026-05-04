/**
 * External dependencies
 */
import type { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from '../store';
import type { Annotation } from '../types';

interface BlockListBlockProps {
	clientId: string;
	className?: string;
	[ key: string ]: unknown;
}

/**
 * Adds annotation className to the block-list-block component.
 *
 * @param OriginalComponent The original BlockListBlock component.
 * @return The enhanced component.
 */
const addAnnotationClassName = ( OriginalComponent: ComponentType< any > ) => {
	return withSelect( ( select, ownProps ) => {
		const { clientId, className } = ownProps as BlockListBlockProps;
		const annotations: Annotation[] =
			select( store ).__experimentalGetAnnotationsForBlock( clientId );

		return {
			className: annotations
				.map( ( annotation ) => {
					return 'is-annotated-by-' + annotation.source;
				} )
				.concat( className || '' )
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
