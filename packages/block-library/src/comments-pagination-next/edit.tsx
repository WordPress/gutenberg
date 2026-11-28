import { __ } from '@wordpress/i18n';
import { useBlockProps, PlainText } from '@wordpress/block-editor';
import type { BlockEditProps } from '@wordpress/blocks';
import type {
	CommentsPaginationNextAttributes,
	CommentsPaginationNextBlockContext,
} from './types';

const arrowMap = {
	none: '',
	arrow: '→',
	chevron: '»',
};

export default function CommentsPaginationNextEdit( {
	attributes: { label },
	setAttributes,
	context: { 'comments/paginationArrow': paginationArrow },
}: BlockEditProps< CommentsPaginationNextAttributes > & {
	context: CommentsPaginationNextBlockContext;
} ) {
	const displayArrow = arrowMap[ paginationArrow! ];
	return (
		<a
			href="#comments-pagination-next-pseudo-link"
			onClick={ ( event ) => event.preventDefault() }
			{ ...useBlockProps() }
		>
			<PlainText
				__experimentalVersion={ 2 }
				tagName="span"
				aria-label={ __( 'Newer comments page link' ) }
				placeholder={ __( 'Newer Comments' ) }
				value={ label }
				onChange={ ( newLabel ) =>
					setAttributes( { label: newLabel } )
				}
			/>
			{ displayArrow && (
				<span
					className={ `wp-block-comments-pagination-next-arrow is-arrow-${ paginationArrow }` }
				>
					{ displayArrow }
				</span>
			) }
		</a>
	);
}
