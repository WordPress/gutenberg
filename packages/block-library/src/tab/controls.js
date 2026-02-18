/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	CheckboxControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from './add-tab-toolbar-control';
import RemoveTabToolbarControl from './remove-tab-toolbar-control';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function Controls( { tabsClientId, blockIndex, isDefaultTab } ) {
	const { updateBlockAttributes } = useDispatch( blockEditorStore );
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<AddTabToolbarControl tabsClientId={ tabsClientId } />
			<RemoveTabToolbarControl tabsClientId={ tabsClientId } />
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						updateBlockAttributes( tabsClientId, {
							activeTabIndex: 0,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Default tab' ) }
						hasValue={ () => isDefaultTab && blockIndex !== 0 }
						onDeselect={ () => {
							updateBlockAttributes( tabsClientId, {
								activeTabIndex: 0,
							} );
						} }
						isShownByDefault
					>
						<CheckboxControl
							label={ __( 'Default tab' ) }
							checked={ isDefaultTab }
							onChange={ ( value ) => {
								updateBlockAttributes( tabsClientId, {
									activeTabIndex: value ? blockIndex : 0,
								} );
							} }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);
}
