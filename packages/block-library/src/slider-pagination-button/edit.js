/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

function Edit( { attributes } ) {
	const { type } = attributes;
	const isPrevious = type === 'previous';

	const label = isPrevious ? __( 'Previous slide' ) : __( 'Next slide' );

	const blockProps = useBlockProps( {
		className: `wp-block-slider-pagination-button is-type-${ type }`,
		type: 'button',
		'aria-label': label,
	} );

	return (
		<button { ...blockProps }>
			{ isPrevious && <Icon icon={ chevronLeft } /> }
			{ ! isPrevious && <Icon icon={ chevronRight } /> }
		</button>
	);
}

export default Edit;
