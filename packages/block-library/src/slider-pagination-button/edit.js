/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';
import { Icon as WCIcon } from '@wordpress/components';
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
	const navigationButtonType = context?.navigationButtonType ?? 'icon';
	const isPrevious = type === 'previous';

	const buttonText = isPrevious ? __( 'Previous' ) : __( 'Next' );
	const label = isPrevious ? __( 'Previous slide' ) : __( 'Next slide' );
	const icons = iconMap[ arrowIcon ] ?? iconMap.chevron;
	const icon = isPrevious ? icons.previous : icons.next;

	const blockProps = useBlockProps( {
		className: `wp-block-slider-pagination-button is-type-${ type }`,
		type: 'button',
		'aria-label': label,
	} );

	let buttonInner;
	if ( navigationButtonType === 'icon' ) {
		buttonInner = <WCIcon icon={ icon } />;
	} else if ( navigationButtonType === 'text' ) {
		buttonInner = (
			<span className="wp-block-slider-pagination-button__text">
				{ buttonText }
			</span>
		);
	} else if ( isPrevious ) {
		buttonInner = (
			<>
				<WCIcon icon={ icon } />
				<span className="wp-block-slider-pagination-button__text">
					{ buttonText }
				</span>
			</>
		);
	} else {
		buttonInner = (
			<>
				<span className="wp-block-slider-pagination-button__text">
					{ buttonText }
				</span>
				<WCIcon icon={ icon } />
			</>
		);
	}

	return <button { ...blockProps }>{ buttonInner }</button>;
}

export default Edit;
