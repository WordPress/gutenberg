/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { PostTaxonomies as PostTaxonomiesForm, PostTaxonomiesCheck } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleGeneralSidebarEditorPanel } from '../../../store/actions';
import TaxonomyPanel from './taxonomy-panel';

/**
 * Module Constants
 */
const PANEL_NAME = 'post-taxonomies';

function PostTaxonomies() {
	return (
		<PostTaxonomiesCheck>
			<PostTaxonomiesForm
				taxonomyWrapper={ ( content, taxonomy ) => {
					return (
						<TaxonomyPanel taxonomy={ taxonomy }>
							{ content }
						</TaxonomyPanel>
					);
				} }
			/>
		</PostTaxonomiesCheck>
	);
}

export default connect(
	( state ) => {
		return {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	},
	undefined,
	{ storeKey: 'edit-post' }
)( PostTaxonomies );

