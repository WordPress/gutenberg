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

function LayoutSetupToolbar( {
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
		<div className="block-setup-navigation">
			<>
				<Button
					icon={ chevronLeft }
					label={ __( 'Previous block pattern' ) }
					onClick={ handlePrevious }
					disabled={ activeSlide === 0 }
				/>
				<Button
					icon={ chevronRight }
					label={ __( 'Next block pattern' ) }
					onClick={ handleNext }
					disabled={ activeSlide === totalSlides - 1 }
				/>
			</>
		</div>
	);

	// TODO check icons change (?).
	const displayControls = (
		<div className="display-controls-container">
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

	// blank:
	// 1. if has block variations to show -> go there
	// 2. if not show what was shown before.... Probably pass down what component was used intact...
	const actions = (
		<div className="actions-controls-container">
			<Button onClick={ onStartBlank }>{ __( 'Start blank' ) }</Button>
			<Button isPrimary onClick={ onBlockPatternSelect }>
				{ __( 'Choose' ) }
			</Button>
		</div>
	);

	return (
		<div className="layout-toolbar">
			{ isSingleView && navigation }
			{ displayControls }
			{ isSingleView && actions }
		</div>
	);
}

export default LayoutSetupToolbar;
