/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	PlainText,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
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
	arrow: '←',
	chevron: '«',
};

export default function QueryPaginationPreviousEdit( {
	attributes: { label, arrow },
	setAttributes,
} ) {
	const [
		{ arrow: arrowFromContext },
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
				<PanelBody title={ __( 'Arrow settings' ) }>
					<QueryPaginationArrowControls
						value={ arrowFromContext }
						onChange={ ( value ) => {
							setQueryPaginationContext( { arrow: value } );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<a
				href="#pagination-previous-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
				{ ...useBlockProps() }
			>
				{ displayArrow && (
					<span
						className={ `wp-block-query-pagination-previous-arrow is-arrow-${ arrow }` }
					>
						{ displayArrow }
					</span>
				) }
				<PlainText
					__experimentalVersion={ 2 }
					tagName="span"
					aria-label={ __( 'Previous page link' ) }
					placeholder={ __( 'Previous Page' ) }
					value={ label }
					onChange={ ( newLabel ) =>
						setAttributes( { label: newLabel } )
					}
				/>
			</a>
		</>
	);
}
