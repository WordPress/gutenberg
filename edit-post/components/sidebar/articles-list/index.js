/**
 * External dependencies
 */
import _ from 'lodash';
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, TextControl, CategorySelect } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import {
	isEditorSidebarPanelOpened,
	getSelectedCategory,
	getSearchTerm,
	getArticles,
} from '../../../store/selectors';
import {
	toggleGeneralSidebarEditorPanel,
	setCategory,
	setSearchTerm,
} from '../../../store/actions';
import '@wordpress/core-data';

/**
 * Module Constants
 */
const PANEL_NAME = 'articles-list';

function ArticlesList( {
	isOpened,
	onTogglePanel,
	categories,
	articles,
	selectedCategory,
	onCategoryChange,
	onSearchInputChange,
	searchTerm,
} ) {
	return (
		<PanelBody
			title={ __( 'Stories' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<TextControl
				placeholder={ __( 'Search articles' ) }
				value={ searchTerm }
				onChange={ onSearchInputChange }
			/>

			<CategorySelect
				key="query-controls-category-select"
				categoriesList={ categories }
				label={ __( 'Category' ) }
				noOptionLabel={ __( 'All' ) }
				selectedCategoryId={ selectedCategory }
				onChange={ onCategoryChange }
			/>

			<PanelRow>Loading articles...</PanelRow>
			<div>
				{
					_.map( articles, article => (
						<PanelRow key={ article.id }>{ article.title }</PanelRow>
					) )
				}
			</div>
		</PanelBody>
	);
}

export default compose(
	connect(
		( state ) => ( {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
			selectedCategoryId: getSelectedCategory( state ),
			searchTerm: getSearchTerm( state ),
			articles: getArticles( state ),
		} ),
		{
			onTogglePanel() {
				return toggleGeneralSidebarEditorPanel( PANEL_NAME );
			},

			onCategoryChange( categoryId ) {
				return setCategory( categoryId );
			},

			onSearchInputChange( term ) {
				return setSearchTerm( term );
			},
		},
		undefined,
		{ storeKey: 'edit-post' }
	),
	withSelect( ( select ) => {
		const { getCategories } = select( 'core' );

		return {
			categories: getCategories(),
		};
	} )
)( ArticlesList );
