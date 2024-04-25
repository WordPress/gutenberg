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

function AttributesPanel() {
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

	return (
		<PanelBody
			title={ postType?.labels?.attributes ?? __( 'Page attributes' ) }
			opened={ isOpened }
			onToggle={ () => toggleEditorPanelOpened( PANEL_NAME ) }
		>
			<PageAttributesParent />
			<PanelRow>
				<PageAttributesOrder />
			</PanelRow>
		</PanelBody>
	);
}

/**
 * Renders the Page Attributes Panel component.
 *
 * @return {Component} The component to be rendered.
 */
export default function PageAttributesPanel() {
	return (
		<PageAttributesCheck>
			<AttributesPanel />
		</PageAttributesCheck>
	);
}
