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
import PosterImage from '../utils/poster-image';

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
	thumbnail,
	setAttributes,
	type,
} ) => {
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const showInspector =
		( themeSupportsResponsive && blockSupportsResponsive ) ||
		type === 'video';

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
			{ showInspector && (
				<InspectorControls>
					{ type === 'video' && (
						<ToolsPanel
							label={ __( 'Thumbnail settings' ) }
							resetAll={ () => {
								setAttributes( { thumbnail: undefined } );
							} }
							dropdownMenuProps={ dropdownMenuProps }
						>
							<PosterImage
								poster={ thumbnail }
								onChange={ ( posterImage ) =>
									setAttributes( {
										thumbnail: posterImage?.url,
									} )
								}
							/>
						</ToolsPanel>
					) }
					{ themeSupportsResponsive && blockSupportsResponsive && (
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
					) }
				</InspectorControls>
			) }
		</>
	);
};

export default EmbedControls;
