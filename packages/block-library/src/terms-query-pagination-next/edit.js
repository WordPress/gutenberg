import { __ } from '@wordpress/i18n';
import { useBlockProps, PlainText } from '@wordpress/block-editor';

const arrowMap = {
	none: '',
	arrow: '→',
	chevron: '»',
};

export default function TermsQueryPaginationNextEdit( {
	attributes: { label },
	setAttributes,
	context: { paginationArrow, showLabel },
} ) {
	const displayArrow = arrowMap[ paginationArrow ];
	return (
		<a
			href="#terms-pagination-next-pseudo-link"
			onClick={ ( event ) => event.preventDefault() }
			{ ...useBlockProps() }
		>
			{ showLabel && (
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
			) }
			{ displayArrow && (
				<span
					className={ `terms-query-pagination-next-arrow is-arrow-${ paginationArrow }` }
					aria-hidden
				>
					{ displayArrow }
				</span>
			) }
		</a>
	);
}
