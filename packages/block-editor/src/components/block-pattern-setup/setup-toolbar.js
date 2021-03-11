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
	const isSingleView = viewMode === 'single';
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

	// TODO check icons change (?).
	const displayControls = (
		<div className="block-editor-block-pattern-setup__display-controls">
			<Button
				icon={ stretchFullWidth }
				label={ __( 'Single view' ) }
				onClick={ () => setViewMode( 'single' ) }
				isPressed={ viewMode === 'single' }
			/>
			<Button
				icon={ grid }
				label={ __( 'Grid view' ) }
				onClick={ () => setViewMode( 'grid' ) }
				isPressed={ viewMode === 'grid' }
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
			{ isSingleView && navigation }
			{ displayControls }
			{ isSingleView && actions }
		</div>
	);
}

export default SetupToolbar;
