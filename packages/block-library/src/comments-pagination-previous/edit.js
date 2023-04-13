/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, PlainText } from '@wordpress/block-editor';

const arrowMap = {
	none: '',
	arrow: '←',
	chevron: '«',
};

export default function CommentsPaginationPreviousEdit( {
	attributes: { label },
	setAttributes,
	context: { 'comments/paginationArrow': paginationArrow },
} ) {
	const displayArrow = arrowMap[ paginationArrow ];
	return (
		<a
			href="#comments-pagination-previous-pseudo-link"
			onClick={ ( event ) => event.preventDefault() }
			{ ...useBlockProps() }
		>
			{ displayArrow && (
				<span
					className={ `wp-block-comments-pagination-previous-arrow is-arrow-${ paginationArrow }` }
				>
					{ displayArrow }
				</span>
			) }
			<PlainText
				__experimentalVersion={ 2 }
				tagName="span"
				aria-label={ __( 'Older comments page link' ) }
				placeholder={ __( 'Older Comments' ) }
				value={ label }
				onChange={ ( newLabel ) =>
					setAttributes( { label: newLabel } )
				}
			/>
		</a>
	);
}
