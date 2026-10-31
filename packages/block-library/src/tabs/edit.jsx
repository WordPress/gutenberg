import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { SwitchControl } from '@wordpress/ui';
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import TabToolbarControls from './tab-toolbar-controls';
import useTabListItemsSync from './use-tab-list-items-sync';

function Edit( { attributes, setAttributes, clientId } ) {
	const { autoActivate } = attributes;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	useTabListItemsSync( clientId );

	const blockProps = useBlockProps();

	// The template in the block type settings only specifies the two
	// structural child blocks, without inner block entries for
	// core/tab-list or core/tab-panels.
	//
	// If inner blocks were included in that template,
	// `synchronizeBlocksWithTemplate` (called whenever templateLock === 'all')
	// would recurse into the containers and truncate them to the template
	// count, causing data loss when a saved block with more than two tabs is
	// re-opened in the editor.
	//
	// Initial tab/panel creation is delegated to the tab-panels template
	// (templateLock: false, applied only when empty).
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		templateLock: 'all',
		renderAppender: false,
	} );

	return (
		<>
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => setAttributes( { autoActivate: false } ) }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						isShownByDefault
						label={ __(
							'Auto-activate tabs on keyboard navigation'
						) }
						hasValue={ () => autoActivate }
						onDeselect={ () =>
							setAttributes( { autoActivate: false } )
						}
					>
						<SwitchControl
							label={ __(
								'Auto-activate tabs on keyboard navigation'
							) }
							description={ __(
								'Select a tab when the arrow, Home, or End keys move focus to it on your site.'
							) }
							checked={ autoActivate }
							onCheckedChange={ ( value ) =>
								setAttributes( { autoActivate: value } )
							}
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
			<div { ...innerBlockProps }>
				<TabToolbarControls tabsClientId={ clientId } />
				{ innerBlockProps.children }
			</div>
		</>
	);
}

export default Edit;
