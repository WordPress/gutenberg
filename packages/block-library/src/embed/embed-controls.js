/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ToolbarButton,
	ToggleControl,
	ToolbarGroup,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

function getResponsiveHelp( checked ) {
	return checked
		? __(
				'This embed will preserve its aspect ratio when the browser is resized.'
		  )
		: __(
				'This embed may not preserve its aspect ratio when the browser is resized.'
		  );
}

const EmbedControls = ( {
	blockSupportsResponsive,
	showEditButton,
	themeSupportsResponsive,
	allowResponsive,
	toggleResponsive,
	switchBackToURLInput,
	providerNameSlug,
	enableYouTubeSeek,
	toggleYouTubeSeek,
} ) => {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					{ showEditButton && (
						<ToolbarButton
							className="components-toolbar__control"
							label={ __( 'Edit URL' ) }
							icon={ pencil }
							onClick={ switchBackToURLInput }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			{ themeSupportsResponsive && blockSupportsResponsive && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Media settings' ) }
						resetAll={ () => {
							toggleResponsive( true );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							label={ __( 'Media settings' ) }
							isShownByDefault
							hasValue={ () => ! allowResponsive }
							onDeselect={ () => {
								toggleResponsive( ! allowResponsive );
							} }
						>
							<ToggleControl
								label={ __( 'Resize for smaller devices' ) }
								checked={ allowResponsive }
								help={ getResponsiveHelp }
								onChange={ toggleResponsive }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
			{ providerNameSlug === 'youtube' && (
				<InspectorControls>
					<ToolsPanel
						label={ __( 'Player settings' ) }
						resetAll={ () => {
							toggleYouTubeSeek( false );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							label={ __( 'Enable timestamp seeking' ) }
							isShownByDefault
							hasValue={ () => enableYouTubeSeek }
							onDeselect={ () => toggleYouTubeSeek( false ) }
						>
							<ToggleControl
								label={ __( 'Enable timestamp seeking' ) }
								checked={ enableYouTubeSeek }
								help={ __(
									'Allows links with data-yt-seek="SECONDS" to jump to a timestamp in this video.'
								) }
								onChange={ toggleYouTubeSeek }
							/>
						</ToolsPanelItem>
					</ToolsPanel>
				</InspectorControls>
			) }
		</>
	);
};

export default EmbedControls;
