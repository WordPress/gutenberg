/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, FormTokenField, SelectControl } from '@wordpress/components';
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
	return (
		<PanelBody
			title={ __( 'Stories' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<PanelRow>
				<FormTokenField
					placeholder={ __( 'Search articles' ) }
					onChange={ event => console.log( event ) }
				/>
			</PanelRow>

			<PanelRow>
				{ isRequestingCategories ? ( <p>Loading categories...</p> ) : (
					<SelectControl
						// Selected value.
						value=""
						label={ __( 'Categories' ) }
						options={ categories.map( cat => ( { value: cat.id, label: cat.name } ) ) }
						onChange={ event => console.log( event ) }
					/>
				) }
			</PanelRow>

			{ isRequestingArticles ? ( <PanelRow>Loading articles...</PanelRow> ) : (
				<div>
					{
						articles.map( article => (
							<PanelRow
								key={ article.id }>
								{ article.title }
							</PanelRow>
						) )
					}
				</div>
			) }
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
		const {
			getCategories,
			isRequestingCategories,
			getArticles,
			isRequestingArticles,
		} = select( 'core' );

		return {
			categories: getCategories() || [],
			isRequestingCategories: isRequestingCategories(),
			articles: getArticles() || [],
			isRequestingArticles: isRequestingArticles(),
		};
	} )
)( ArticlesList );
