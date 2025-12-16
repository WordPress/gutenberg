/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RangeControl,
	SelectControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { MIN_PREVIEW_HEIGHT, MAX_PREVIEW_HEIGHT } from './edit';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function FileBlockInspector( {
	hrefs,
	openInNewWindow,
	showDownloadButton,
	changeLinkDestinationOption,
	changeOpenInNewWindow,
	changeShowDownloadButton,
	displayPreview,
	changeDisplayPreview,
	previewHeight,
	changePreviewHeight,
} ) {
	const { href, textLinkHref, attachmentPage } = hrefs;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	let linkDestinationOptions = [ { value: href, label: __( 'URL' ) } ];
	if ( attachmentPage ) {
		linkDestinationOptions = [
			{ value: href, label: __( 'Media file' ) },
			{ value: attachmentPage, label: __( 'Attachment page' ) },
		];
	}

	return (
		<>
			<InspectorControls>
				{ href.endsWith( '.pdf' ) && (
					<ToolsPanel
						label={ __( 'PDF settings' ) }
						resetAll={ () => {
							changeDisplayPreview( true );
							changePreviewHeight( 600 );
						} }
						dropdownMenuProps={ dropdownMenuProps }
					>
						<ToolsPanelItem
							label={ __( 'Show inline embed' ) }
							isShownByDefault
							hasValue={ () => ! displayPreview }
							onDeselect={ () => changeDisplayPreview( true ) }
						>
							<ToggleControl
								label={ __( 'Show inline embed' ) }
								help={
									displayPreview
										? __(
												"Note: Most phone and tablet browsers won't display embedded PDFs."
										  )
										: null
								}
								checked={ !! displayPreview }
								onChange={ changeDisplayPreview }
							/>
						</ToolsPanelItem>
						{ displayPreview && (
							<ToolsPanelItem
								label={ __( 'Height in pixels' ) }
								isShownByDefault
								hasValue={ () => previewHeight !== 600 }
								onDeselect={ () => changePreviewHeight( 600 ) }
							>
								<RangeControl
									__nextHasNoMarginBottom
									__next40pxDefaultSize
									label={ __( 'Height in pixels' ) }
									min={ MIN_PREVIEW_HEIGHT }
									max={ Math.max(
										MAX_PREVIEW_HEIGHT,
										previewHeight
									) }
									value={ previewHeight }
									onChange={ changePreviewHeight }
								/>
							</ToolsPanelItem>
						) }
					</ToolsPanel>
				) }

				<ToolsPanel
					label={ __( 'Settings' ) }
					resetAll={ () => {
						changeLinkDestinationOption( href );
						changeOpenInNewWindow( false );
						changeShowDownloadButton( true );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'Link to' ) }
						isShownByDefault
						hasValue={ () => textLinkHref !== href }
						onDeselect={ () => changeLinkDestinationOption( href ) }
					>
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Link to' ) }
							value={ textLinkHref }
							options={ linkDestinationOptions }
							onChange={ changeLinkDestinationOption }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Open in new tab' ) }
						isShownByDefault
						hasValue={ () => !! openInNewWindow }
						onDeselect={ () => changeOpenInNewWindow( false ) }
					>
						<ToggleControl
							label={ __( 'Open in new tab' ) }
							checked={ openInNewWindow }
							onChange={ changeOpenInNewWindow }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Show download button' ) }
						isShownByDefault
						hasValue={ () => ! showDownloadButton }
						onDeselect={ () => changeShowDownloadButton( true ) }
					>
						<ToggleControl
							label={ __( 'Show download button' ) }
							checked={ showDownloadButton }
							onChange={ changeShowDownloadButton }
						/>
					</ToolsPanelItem>
				</ToolsPanel>
			</InspectorControls>
		</>
	);
}
