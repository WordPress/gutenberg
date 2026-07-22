/**
 * WordPress dependencies
 */
import { Icon as WCIcon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	chevronLeft,
	chevronRight,
	arrowLeft,
	arrowRight,
} from '@wordpress/icons';

export const iconMap = {
	chevron: { previous: chevronLeft, next: chevronRight },
	arrow: { previous: arrowLeft, next: arrowRight },
};

export function SliderNavigationButton( { type, arrowIcon, displayMode } ) {
	const icons = iconMap[ arrowIcon ] || iconMap.chevron;
	const isPrevious = type === 'previous';
	const buttonLabel = isPrevious ? __( 'Previous' ) : __( 'Next' );
	const icon = isPrevious ? icons.previous : icons.next;
	const hasIcon = displayMode !== 'text';
	const hasText = displayMode !== 'icon';
	const buttonClasses = [
		'wp-block-slider-arrows-button',
		`is-type-${ type }`,
		`is-icon-${ arrowIcon }`,
		hasIcon && 'has-icon',
		hasText && 'has-text',
		hasIcon && hasText && ! isPrevious && 'has-icon-right',
	]
		.filter( Boolean )
		.join( ' ' );
	const iconElement = (
		<WCIcon className="wp-block-slider-arrows-button__icon" icon={ icon } />
	);
	const textElement = (
		<span className="wp-block-slider-arrows-button__text">
			{ buttonLabel }
		</span>
	);

	let content;
	if ( displayMode === 'icon' ) {
		content = iconElement;
	} else if ( displayMode === 'text' ) {
		content = textElement;
	} else {
		content = isPrevious ? (
			<>
				{ iconElement }
				{ textElement }
			</>
		) : (
			<>
				{ textElement }
				{ iconElement }
			</>
		);
	}

	return (
		<button
			type="button"
			className={ buttonClasses }
			disabled
			tabIndex={ -1 }
		>
			{ content }
		</button>
	);
}

export function SliderIndicatorDots( { indicatorStyle } ) {
	return (
		<div
			className={ `wp-block-slider-indicators__dots is-style-${ indicatorStyle }` }
			role="group"
			aria-label={ __( 'Choose slide to display' ) }
		>
			{ [ 0, 1, 2 ].map( ( index ) => (
				<button
					key={ index }
					type="button"
					className={ `wp-block-slider-indicators__dot${
						index === 0 ? ' is-active' : ''
					}` }
					disabled
					tabIndex={ -1 }
				/>
			) ) }
		</div>
	);
}

export function SliderControlBar( {
	navigationPosition,
	arrowIcon,
	displayMode,
	indicatorStyle,
	showIndicators,
	navigationJustification,
} ) {
	const prevButton = (
		<SliderNavigationButton
			type="previous"
			arrowIcon={ arrowIcon }
			displayMode={ displayMode }
		/>
	);
	const nextButton = (
		<SliderNavigationButton
			type="next"
			arrowIcon={ arrowIcon }
			displayMode={ displayMode }
		/>
	);
	const indicators = showIndicators && (
		<SliderIndicatorDots indicatorStyle={ indicatorStyle } />
	);

	// Always [prev] [dots] [next] — for space-between the dots stretch to fill;
	// for left/center/right the bar wraps all three and justifies as a unit.
	return (
		<div
			className={ `wp-block-slider-control-bar is-position-${ navigationPosition } is-justify-${ navigationJustification }` }
		>
			{ prevButton }
			{ indicators }
			{ nextButton }
		</div>
	);
}

export function SliderNavigationButtonsPreview( {
	arrowIcon,
	displayMode,
	navigationPosition,
	navigationJustification,
} ) {
	const justificationClass =
		navigationPosition !== 'overlay'
			? ` is-justify-${ navigationJustification }`
			: '';
	return (
		<div
			className={ `wp-block-slider-arrows is-position-${ navigationPosition }${ justificationClass }` }
		>
			<SliderNavigationButton
				type="previous"
				arrowIcon={ arrowIcon }
				displayMode={ displayMode }
			/>
			<SliderNavigationButton
				type="next"
				arrowIcon={ arrowIcon }
				displayMode={ displayMode }
			/>
		</div>
	);
}

export function SliderIndicatorsPreview( { indicatorStyle } ) {
	return (
		<div className="wp-block-slider-indicators is-position-overlay">
			<SliderIndicatorDots indicatorStyle={ indicatorStyle } />
		</div>
	);
}
