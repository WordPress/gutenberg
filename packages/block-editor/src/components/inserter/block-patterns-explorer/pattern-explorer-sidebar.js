/**
 * WordPress dependencies
 */
import { Button, SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function PatternCategoriesList( {
	selectedCategory,
	patternCategories,
	onClickCategory,
} ) {
	const baseClassName = 'block-editor-block-patterns-explorer__sidebar';
	return (
		<div className={ `${ baseClassName }__categories-list` }>
			{ patternCategories.map( ( { name, label } ) => {
				return (
					<Button
						__next40pxDefaultSize
						key={ name }
						label={ label }
						className={ `${ baseClassName }__categories-list__item` }
						isPressed={ selectedCategory === name }
						onClick={ () => {
							onClickCategory( name );
						} }
					>
						{ label }
					</Button>
				);
			} ) }
		</div>
	);
}

function PatternsExplorerSearch( { searchValue, setSearchValue } ) {
	const baseClassName = 'block-editor-block-patterns-explorer__search';
	return (
		<div className={ baseClassName }>
			<SearchControl
				__nextHasNoMarginBottom
				onChange={ setSearchValue }
				value={ searchValue }
				label={ __( 'Search' ) }
				placeholder={ __( 'Search' ) }
			/>
		</div>
	);
}

function PatternExplorerSidebar( {
	selectedCategory,
	patternCategories,
	onClickCategory,
	searchValue,
	setSearchValue,
} ) {
	const baseClassName = 'block-editor-block-patterns-explorer__sidebar';
	return (
		<div className={ baseClassName }>
			<PatternsExplorerSearch
				searchValue={ searchValue }
				setSearchValue={ setSearchValue }
			/>
			{ ! searchValue && (
				<PatternCategoriesList
					selectedCategory={ selectedCategory }
					patternCategories={ patternCategories }
					onClickCategory={ onClickCategory }
				/>
			) }
		</div>
	);
}

export default PatternExplorerSidebar;
