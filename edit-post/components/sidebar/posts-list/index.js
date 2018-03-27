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
import { isEditorSidebarPanelOpened } from '../../../store/selectors';
import { toggleGeneralSidebarEditorPanel } from '../../../store/actions';

/**
 * Module Constants
 */
const PANEL_NAME = 'posts-list';

// TODO: - make panel title customizable
// 		 - list of categories
function PostsList( { isOpened, onTogglePanel } ) {
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
					<li>Post 1</li>
					<li>Post 2</li>
					<li>Post 3</li>
				</ul>
			</div>
		</PanelBody>
	);
}

export default connect(
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
)( PostsList );
