/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from './add-tab-toolbar-control';
import RemoveTabToolbarControl from './remove-tab-toolbar-control';

export default function Controls( { tabsClientId, blockIndex, isDefaultTab } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	return (
		<>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<CheckboxControl
						label={ __( 'Default tab' ) }
						checked={ isDefaultTab }
						onChange={ ( value ) => {
							updateBlockAttributes( tabsClientId, {
								activeTabIndex: value ? blockIndex : 0,
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
