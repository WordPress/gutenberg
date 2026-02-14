/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function Controls( { attributes, setAttributes, clientId } ) {
	const {
		metadata = {
			name: '',
		},
	} = attributes;

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<AddTabToolbarControl tabsClientId={ clientId } />
			<RemoveTabToolbarControl tabsClientId={ clientId } />
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						setAttributes( {
							metadata: { ...metadata, name: '' },
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Title' ) }
						hasValue={ () => !! metadata.name }
						onDeselect={ () => {
							setAttributes( {
								metadata: { ...metadata, name: '' },
							} );
						} }
						isShownByDefault
					>
						<TextControl
							label={ __( 'Title' ) }
							help={ __(
								'The tabs title is used by screen readers to describe the purpose and content of the tab panel.'
							) }
							value={ metadata.name }
							onChange={ ( value ) => {
								setAttributes( {
									metadata: { ...metadata, name: value },
								} );
							} }
							__next40pxDefaultSize
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);
}
