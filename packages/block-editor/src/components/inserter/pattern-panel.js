/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function PatternInserterPanel( {
	selectedCategory,
	patternCategories,
	onClickCategory,
	children,
} ) {
	const categoryOptions = () => {
		const options = [];

		patternCategories.map( ( patternCategory ) => {
			return options.push( {
				value: patternCategory.name,
				label: patternCategory.label,
			} );
		} );

		return options;
	};

	const onChangeSelect = ( selected ) => {
		onClickCategory(
			patternCategories.find(
				( patternCategory ) => selected === patternCategory.name
			)
		);
	};

	const getPanelHeaderClassName = () => {
		return classnames(
			'block-editor-inserter__panel-header',
			'block-editor-inserter__panel-header-patterns'
		);
	};

	// In iOS-based mobile devices, the onBlur will fire when selecting an option
	// from a Select element. To prevent closing the useDialog on iOS devices, we
	// stop propagating the onBlur event if there is no relatedTarget, which means
	// that the user most likely did not click on an element within the editor canvas.
	const onBlur = ( event ) => {
		if ( ! event?.relatedTarget ) {
			event.stopPropagation();
		}
	};

	return (
		<>
			<div className={ getPanelHeaderClassName() }>
				<SelectControl
					className="block-editor-inserter__panel-dropdown"
					label={ __( 'Filter patterns' ) }
					hideLabelFromVision
					value={ selectedCategory.name }
					onChange={ onChangeSelect }
					onBlur={ onBlur }
					options={ categoryOptions() }
				/>
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default PatternInserterPanel;
