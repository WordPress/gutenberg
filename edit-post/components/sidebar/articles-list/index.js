/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, TextControl, SelectControl } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { isEditorSidebarPanelOpened, getArticles } from '../../../store/selectors';
import { toggleGeneralSidebarEditorPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'articles-list';

// TODO: - make panel title customizable
// 		 - list of categories
function ArticlesList( { isOpened, onTogglePanel, articles } ) {
	const options = [ { value: 0, label: __( 'Uncategorized' ) } ];

	return (
		<PanelBody
			title={ __( 'Stories' ) }
			opened={ isOpened }
			onToggle={ onTogglePanel }
		>
			<TextControl
				placeholder={ __( 'Search articles' ) }
				onChange={ event => console.log( event ) }
			/>
			<SelectControl
				// Selected value.
				value=""
				label={ __( 'Category' ) }
				options={ options }
				onChange={ event => console.log( event ) }
			/>
			<div>
				<ul>
					{
						articles ? articles.map( article => <li key={ article.key } >{ article.title }</li> ) : <li>No articles!</li>
					}
				</ul>
			</div>
		</PanelBody>
	);
}

export default connect(
	( state ) => ( {
		isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		articles: getArticles( state ),
	} ),
	{
		onTogglePanel() {
			return toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	},
	undefined,
	{ storeKey: 'edit-post' }
)( ArticlesList );
