/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import {
	chevronRight,
	chevronLeft,
	grid,
	stretchFullWidth,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { VIEWMODES } from './constants';

const Actions = ( { onBlockPatternSelect } ) => (
	<div className="block-editor-block-pattern-setup__actions">
		<Button
			__next40pxDefaultSize
			variant="primary"
			onClick={ onBlockPatternSelect }
		>
			{ __( 'Choose' ) }
		</Button>
	</div>
);

const CarouselNavigation = ( {
	handlePrevious,
	handleNext,
	activeSlide,
	totalSlides,
} ) => (
	<div className="block-editor-block-pattern-setup__navigation">
		<Button
			size="compact"
			icon={ isRTL() ? chevronRight : chevronLeft }
			label={ __( 'Previous pattern' ) }
			onClick={ handlePrevious }
			disabled={ activeSlide === 0 }
			accessibleWhenDisabled
		/>
		<Button
			size="compact"
			icon={ isRTL() ? chevronLeft : chevronRight }
			label={ __( 'Next pattern' ) }
			onClick={ handleNext }
			disabled={ activeSlide === totalSlides - 1 }
			accessibleWhenDisabled
		/>
	</div>
);

const SetupToolbar = ( {
	viewMode,
	setViewMode,
	handlePrevious,
	handleNext,
	activeSlide,
	totalSlides,
	onBlockPatternSelect,
} ) => {
	const isCarouselView = viewMode === VIEWMODES.carousel;
	const displayControls = (
		<div className="block-editor-block-pattern-setup__display-controls">
			<Button
				size="compact"
				icon={ stretchFullWidth }
				label={ __( 'Carousel view' ) }
				onClick={ () => setViewMode( VIEWMODES.carousel ) }
				isPressed={ isCarouselView }
			/>
			<Button
				size="compact"
				icon={ grid }
				label={ __( 'Grid view' ) }
				onClick={ () => setViewMode( VIEWMODES.grid ) }
				isPressed={ viewMode === VIEWMODES.grid }
			/>
		</div>
	);
	return (
		<div className="block-editor-block-pattern-setup__toolbar">
			{ isCarouselView && (
				<CarouselNavigation
					handlePrevious={ handlePrevious }
					handleNext={ handleNext }
					activeSlide={ activeSlide }
					totalSlides={ totalSlides }
				/>
			) }
			{ displayControls }
			{ isCarouselView && (
				<Actions onBlockPatternSelect={ onBlockPatternSelect } />
			) }
		</div>
	);
};

export default SetupToolbar;
