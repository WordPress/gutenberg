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

function getLazyLoadHelp( checked ) {
	return checked
		? __(
				'The iframe will be loaded only when it is visible in the viewport.'
		  )
		: __( 'The iframe will be loaded immediately when the page loads.' );
}

const EmbedControls = ( {
	blockSupportsResponsive,
	showEditButton,
	themeSupportsResponsive,
	allowResponsive,
	toggleResponsive,
	switchBackToURLInput,
	lazyLoad,
	toggleLazyLoad,
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
			<InspectorControls>
				<ToolsPanel
					label={ __( 'Media settings' ) }
					resetAll={ () => {
						if (
							themeSupportsResponsive &&
							blockSupportsResponsive
						) {
							toggleResponsive( true );
						}
						toggleLazyLoad( false );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					{ themeSupportsResponsive && blockSupportsResponsive && (
						<ToolsPanelItem
							label={ __( 'Resize for smaller devices' ) }
							isShownByDefault
							hasValue={ () => ! allowResponsive }
							onDeselect={ () => {
								toggleResponsive( true );
							} }
						>
							<ToggleControl
								label={ __( 'Resize for smaller devices' ) }
								checked={ allowResponsive }
								help={ getResponsiveHelp }
								onChange={ toggleResponsive }
							/>
						</ToolsPanelItem>
					) }
					<ToolsPanelItem
						label={ __( 'Lazy-load' ) }
						isShownByDefault
						hasValue={ () => lazyLoad }
						onDeselect={ () => toggleLazyLoad( false ) }
					>
						<ToggleControl
							label={ __( 'Lazy-load' ) }
							checked={ !! lazyLoad }
							help={ getLazyLoadHelp }
							onChange={ toggleLazyLoad }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);
};

export default EmbedControls;
