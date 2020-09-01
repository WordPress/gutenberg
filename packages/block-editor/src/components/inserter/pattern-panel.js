/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
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
				key: patternCategory.name,
				name: patternCategory.label,
				style: {},
				className:
					patternCategory.name === selectedCategory.name
						? 'is-selected'
						: '',
			} );
		} );

		return options;
	};

	const onChangeSelect = ( selected ) => {
		onClickCategory(
			patternCategories.find(
				( patternCategory ) =>
					selected.selectedItem.key === patternCategory.name
			)
		);
	};

	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<CustomSelectControl
					label={ __( 'Select a Category' ) }
					hideLabelFromVision
					className="block-editor-inserter__panel-header-dropdown"
					onChange={ onChangeSelect }
					options={ categoryOptions() }
					value={ categoryOptions().find(
						( cat ) => cat.key === selectedCategory.name
					) }
				/>
			</div>
			<div className="block-editor-inserter__panel-content">
				{ children }
			</div>
		</>
	);
}

export default PatternInserterPanel;
