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
	context: { paginationArrow },
} ) {
	const displayArrow = arrowMap[ paginationArrow ] || arrowMap.none;
	return (
		<div { ...useBlockProps() }>
			<a
				href="#comments-pagination-previous-pseudo-link"
				onClick={ ( event ) => event.preventDefault() }
			>
				<PlainText
					__experimentalVersion={ 2 }
					tagName="span"
					aria-label={ __( 'Previous comments page link' ) }
					placeholder={ __( 'Previous Comments' ) }
					value={ label }
					onChange={ ( newLabel ) =>
						setAttributes( { label: newLabel } )
					}
				/>
				{ displayArrow && (
					<span
						className={ `wp-block-query-pagination-previous-arrow` }
					>
						{ displayArrow }
					</span>
				) }
			</a>
		</div>
	);
}
