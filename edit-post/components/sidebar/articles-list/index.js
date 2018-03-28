/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, TextControl, SelectControl } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleGeneralSidebarEditorPanel } from '../../../store/actions';
import '@wordpress/core-data';

/**
 * Module Constants
 */
const PANEL_NAME = 'articles-list';

// TODO: - make panel title customizable
// 		 - list of categories
function ArticlesList(
	{ 
		isOpened,
		onTogglePanel,
		categories,
		isRequestingCategories,
		articles,
		isRequestingArticles,
	} ) {
	// const options = ! isRequestingCategories ? categories.map(cat => ( { value: cat.id, label: cat.name } ) ) : [];

	return (
		<PanelBody
			title={ __( 'Stories' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<PanelRow>
				<TextControl
					placeholder={ __( 'Search articles' ) }
					onChange={ event => console.log( event ) }
				/>
			</PanelRow>

			<PanelRow>
				{ isRequestingCategories ? ( <p>Loading categories...</p> ) : (
					<SelectControl
						// Selected value.
						value=""
						label={ __( 'Category' ) }
						options={ categories }
						onChange={ event => console.log( event ) }
					/> 
				) }
			</PanelRow>
			
			<div>
				{ isRequestingArticles ? ( <p>Loading articles...</p> ) : (

					<ul>
						{
							articles.map( article => (
								<li key={ article.id }>{ article.title }</li> 
							) )
						}
					</ul>
				) }
			</div>
		</PanelBody>
	);
}

export default compose(
	connect(
		( state ) => ( {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		} ),
		{
			onTogglePanel() {
				return toggleGeneralSidebarEditorPanel( PANEL_NAME );
			},
		},
		undefined,
		{ storeKey: 'edit-post' }
	),
	withSelect( ( select ) => {
		const { getCategories, isRequestingCategories, 
				getArticles, isRequestingArticles } = select( 'core' );

		return {
			categories: getCategories() || [],
			isRequestingCategories: isRequestingCategories(),
			articles: getArticles() || [],
			isRequestingArticles: isRequestingArticles(),
		}
	} )
)( ArticlesList );
