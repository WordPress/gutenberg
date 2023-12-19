/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow } from '@wordpress/components';

import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PageAttributesCheck from './check';
import PageAttributesOrder from './order';
import PageAttributesParent from './parent';

const PANEL_NAME = 'page-attributes';

export function PageAttributesPanel() {
	const { isEnabled, isOpened, postType } = useSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			isEditorPanelEnabled,
			isEditorPanelOpened,
		} = select( editorStore );
		const { getPostType } = select( coreStore );
		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			isOpened: isEditorPanelOpened( PANEL_NAME ),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
		};
	}, [] );

	const { toggleEditorPanelOpened } = useDispatch( editorStore );

	if ( ! isEnabled || ! postType ) {
		return null;
	}

	const onTogglePanel = ( ...args ) =>
		toggleEditorPanelOpened( PANEL_NAME, ...args );

	return (
		<PageAttributesCheck>
			<PanelBody
				title={
					postType?.labels?.attributes ?? __( 'Page attributes' )
				}
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PageAttributesParent />
				<PanelRow>
					<PageAttributesOrder />
				</PanelRow>
			</PanelBody>
		</PageAttributesCheck>
	);
}

export default PageAttributesPanel;
