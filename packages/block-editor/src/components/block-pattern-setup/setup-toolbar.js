/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
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

function SetupToolbar( {
	viewMode,
	setViewMode,
	handlePrevious,
	handleNext,
	activeSlide,
	totalSlides,
	onBlockPatternSelect,
	onStartBlank,
} ) {
	const isCarouselView = viewMode === VIEWMODES.carousel;
	const navigation = (
		<div className="block-editor-block-pattern-setup__navigation">
			<Button
				icon={ chevronLeft }
				label={ __( 'Previous pattern' ) }
				onClick={ handlePrevious }
				disabled={ activeSlide === 0 }
			/>
			<Button
				icon={ chevronRight }
				label={ __( 'Next pattern' ) }
				onClick={ handleNext }
				disabled={ activeSlide === totalSlides - 1 }
			/>
		</div>
	);

	const displayControls = (
		<div className="block-editor-block-pattern-setup__display-controls">
			<Button
				icon={ stretchFullWidth }
				label={ __( 'Carousel view' ) }
				onClick={ () => setViewMode( VIEWMODES.carousel ) }
				isPressed={ isCarouselView }
			/>
			<Button
				icon={ grid }
				label={ __( 'Grid view' ) }
				onClick={ () => setViewMode( VIEWMODES.grid ) }
				isPressed={ viewMode === VIEWMODES.grid }
			/>
		</div>
	);

	const actions = (
		<div className="block-editor-block-pattern-setup__actions">
			<Button onClick={ onStartBlank }>{ __( 'Start blank' ) }</Button>
			<Button isPrimary onClick={ onBlockPatternSelect }>
				{ __( 'Choose' ) }
			</Button>
		</div>
	);

	return (
		<div className="block-editor-block-pattern-setup__toolbar">
			{ isCarouselView && navigation }
			{ displayControls }
			{ isCarouselView && actions }
		</div>
	);
}

export default SetupToolbar;
