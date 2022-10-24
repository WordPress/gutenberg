/**
 * WordPress dependencies
 */
import { Button, SearchControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function PatternCategoriesList( {
	selectedCategory,
	categories,
	onClickCategory,
} ) {
	const baseClassName = 'block-editor-block-patterns-explorer__sidebar';
	// TODO: check about localization of the category name.
	return (
		<div className={ `${ baseClassName }__categories-list` }>
			{ categories.map( ( { id, name, slug } ) => {
				return (
					<Button
						key={ slug }
						label={ name }
						className={ `${ baseClassName }__categories-list__item` }
						isPressed={ selectedCategory === id }
						onClick={ () => {
							onClickCategory( id );
						} }
					>
						{ name }
					</Button>
				);
			} ) }
		</div>
	);
}

function PatternsExplorerSearch( { filterValue, setFilterValue } ) {
	const baseClassName = 'block-editor-block-patterns-explorer__search';
	return (
		<div className={ baseClassName }>
			<SearchControl
				onChange={ setFilterValue }
				value={ filterValue }
				label={ __( 'Search for patterns' ) }
				placeholder={ __( 'Search' ) }
			/>
		</div>
	);
}

function PatternExplorerSidebar( {
	selectedCategory,
	categories,
	onClickCategory,
	filterValue,
	setFilterValue,
} ) {
	const baseClassName = 'block-editor-block-patterns-explorer__sidebar';
	return (
		<div className={ baseClassName }>
			<PatternsExplorerSearch
				filterValue={ filterValue }
				setFilterValue={ setFilterValue }
			/>
			{ ! filterValue && (
				<PatternCategoriesList
					selectedCategory={ selectedCategory }
					categories={ categories }
					onClickCategory={ onClickCategory }
				/>
			) }
		</div>
	);
}

export default PatternExplorerSidebar;
