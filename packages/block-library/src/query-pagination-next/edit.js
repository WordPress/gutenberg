/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	PlainText,
	InspectorControls,
} from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	useQueryPaginationContext,
	QueryPaginationArrowControls,
} from '../query-pagination';

const arrowMap = {
	none: '',
	arrow: '→',
	chevron: '»',
};

export default function QueryPaginationNextEdit( {
	attributes: { label, arrow },
	setAttributes,
} ) {
	const [
		{ arrow: arrowFromContext = 'none' },
		setQueryPaginationContext,
	] = useQueryPaginationContext();
	/**
	 * Use arrow from context as the single source of truth.
	 * It is initialized from the the first matching pagination
	 * next/previous block it finds.
	 */
	useEffect( () => {
		if ( arrow !== arrowFromContext ) {
			setAttributes( {
				arrow: arrowFromContext,
			} );
		}
	}, [ arrow, arrowFromContext ] );
	const displayArrow = arrowMap[ arrow ];
	return (
		<>
			<InspectorControls>
				<QueryPaginationArrowControls
					value={ arrowFromContext }
					onChange={ ( value ) => {
						setQueryPaginationContext( { arrow: value } );
					} }
				/>
			</InspectorControls>
			<a
				href="#pagination-next-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
				{ ...useBlockProps() }
			>
				<PlainText
					__experimentalVersion={ 2 }
					tagName="span"
					aria-label={ __( 'Next page link' ) }
					placeholder={ __( 'Next Page' ) }
					value={ label }
					onChange={ ( newLabel ) =>
						setAttributes( { label: newLabel } )
					}
				/>
				{ displayArrow && (
					<span
						className={ `wp-block-query-pagination-next-arrow is-arrow-${ arrow }` }
					>
						{ displayArrow }
					</span>
				) }
			</a>
		</>
	);
}
