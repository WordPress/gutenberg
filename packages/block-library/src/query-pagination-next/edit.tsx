import { __ } from '@wordpress/i18n';
import { useBlockProps, PlainText } from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import type {
	QueryPaginationNextAttributes,
	QueryPaginationNextBlockContext,
} from './types';

const arrowMap = {
	none: '',
	arrow: '→',
	chevron: '»',
};

export default function QueryPaginationNextEdit( {
	attributes: { label },
	setAttributes,
	context: { paginationArrow, showLabel },
}: BlockEditProps< QueryPaginationNextAttributes > & {
	context: QueryPaginationNextBlockContext;
} ) {
	const displayArrow = arrowMap[ paginationArrow! ];
	return (
		<a
			href="#pagination-next-pseudo-link"
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
					className={ `wp-block-query-pagination-next-arrow is-arrow-${ paginationArrow }` }
					aria-hidden
				>
					{ displayArrow }
				</span>
			) }
		</a>
	);
}
