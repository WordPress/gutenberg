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
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
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
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
			icon={ isRTL() ? chevronRight : chevronLeft }
			label={ __( 'Previous pattern' ) }
			onClick={ handlePrevious }
			disabled={ activeSlide === 0 }
			accessibleWhenDisabled
		/>
		<Button
			// TODO: Switch to `true` (40px size) if possible
			__next40pxDefaultSize={ false }
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
				// TODO: Switch to `true` (40px size) if possible
				__next40pxDefaultSize={ false }
				icon={ stretchFullWidth }
				label={ __( 'Carousel view' ) }
				onClick={ () => setViewMode( VIEWMODES.carousel ) }
				isPressed={ isCarouselView }
			/>
			<Button
				// TODO: Switch to `true` (40px size) if possible
				__next40pxDefaultSize={ false }
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
