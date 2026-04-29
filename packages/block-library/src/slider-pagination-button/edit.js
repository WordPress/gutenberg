/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Icon } from '@wordpress/components';
import {
	chevronLeft,
	chevronRight,
	arrowLeft,
	arrowRight,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const iconMap = {
	chevron: { previous: chevronLeft, next: chevronRight },
	arrow: { previous: arrowLeft, next: arrowRight },
};

function Edit( { attributes, context } ) {
	const { type } = attributes;
	const arrowIcon = context?.arrowIcon ?? 'chevron';
	const isPrevious = type === 'previous';

	const label = isPrevious ? __( 'Previous slide' ) : __( 'Next slide' );
	const icons = iconMap[ arrowIcon ] ?? iconMap.chevron;
	const icon = isPrevious ? icons.previous : icons.next;

	const blockProps = useBlockProps( {
		className: `wp-block-slider-pagination-button is-type-${ type }`,
		type: 'button',
		'aria-label': label,
	} );

	return (
		<button { ...blockProps }>
			<Icon icon={ icon } />
		</button>
	);
}

export default Edit;
