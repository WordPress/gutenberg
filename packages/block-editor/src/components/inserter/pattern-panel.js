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

	return (
		<>
			<div className="block-editor-inserter__panel-header">
				<SelectControl
					label={ __( 'Filter patterns' ) }
					value={ selectedCategory.name }
					onChange={ onChangeSelect }
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
