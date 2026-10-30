import { __, _x } from '@wordpress/i18n';
import {
	RangeControl,
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';
import { RichTextData } from '@wordpress/rich-text';
import { InputControl } from '@wordpress/ui';
import { getFilename } from '@wordpress/url';
import { MIN_PREVIEW_HEIGHT, MAX_PREVIEW_HEIGHT } from './edit';
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';
import { MediaControl } from '../utils/media-control';
import {
	MediaLinkControl,
	MediaLinkNewTabControl,
} from '../utils/media-link-control';
import ViewLinkButton from '../utils/view-link-button';

/**
 * Returns the text of a rich text attribute, without its formatting.
 *
 * @param {string|RichTextData} value The attribute's value.
 * @return {string} The plain text.
 */
function getPlainText( value ) {
	return value ? RichTextData.fromHTMLString( value.toString() ).text : '';
}

/**
 * Returns plain text as the HTML of a rich text attribute, so that characters
 * such as `<` and `&` are kept as typed instead of read as markup.
 *
 * @param {string} text The plain text.
 * @return {string} The attribute's HTML.
 */
function toRichTextHTML( text ) {
	return RichTextData.fromPlainText( text ).toHTMLString();
}

export default function FileBlockInspector( {
	hrefs,
	id,
	fileName,
	downloadButtonText,
	textLinkTarget,
	showDownloadButton,
	isUploading,
	onSelectFile,
	onUploadError,
	setAttributes,
	displayPreview,
	changeDisplayPreview,
	previewHeight,
	changePreviewHeight,
} ) {
	const { href, textLinkHref, attachmentPage } = hrefs;
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const defaultDownloadButtonText = _x( 'Download', 'button label' );

	return (
		<>
			<InspectorControls group="content">
				<ToolsPanel
					label={ __( 'Media' ) }
					resetAll={ () => {
						onSelectFile( undefined );
						setAttributes( {
							textLinkTarget: undefined,
							showDownloadButton: true,
							downloadButtonText: defaultDownloadButtonText,
						} );
					} }
					dropdownMenuProps={ dropdownMenuProps }
				>
					<ToolsPanelItem
						label={ __( 'File' ) }
						isShownByDefault
						hasValue={ () => !! href }
						onDeselect={ () => onSelectFile( undefined ) }
					>
						<MediaControl
							mediaId={ id }
							mediaUrl={ href }
							filename={ getFilename( href ) }
							onSelect={ onSelectFile }
							onError={ onUploadError }
							onReset={ () => onSelectFile( undefined ) }
							isUploading={ isUploading }
							emptyLabel={ __( 'Add file' ) }
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'File name' ) }
						isShownByDefault
						hasValue={ () => !! getPlainText( fileName ) }
						onDeselect={ () =>
							setAttributes( { fileName: undefined } )
						}
					>
						<InputControl
							label={ __( 'File name' ) }
							value={ getPlainText( fileName ) }
							onValueChange={ ( value ) =>
								setAttributes( {
									fileName: toRichTextHTML( value ),
								} )
							}
							autoComplete="off"
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Link to' ) }
						isShownByDefault
						hasValue={ () => textLinkHref !== href }
						onDeselect={ () =>
							setAttributes( { textLinkHref: href } )
						}
					>
						<MediaLinkControl
							href={ textLinkHref }
							mediaUrl={ href }
							mediaLink={ attachmentPage }
							destinations={ [ 'media', 'attachment' ] }
							onChange={ ( { href: newHref } ) =>
								setAttributes( { textLinkHref: newHref } )
							}
						/>
					</ToolsPanelItem>
					<ToolsPanelItem
						label={ __( 'Open in new tab' ) }
						isShownByDefault
						hasValue={ () => !! textLinkTarget }
						onDeselect={ () =>
							setAttributes( { textLinkTarget: undefined } )
						}
					>
						<MediaLinkNewTabControl
							linkTarget={ textLinkTarget }
							onChange={ ( { linkTarget } ) =>
								setAttributes( { textLinkTarget: linkTarget } )
							}
						/>
					</ToolsPanelItem>
					<ViewLinkButton url={ textLinkHref } />
					<ToolsPanelItem
						label={ __( 'Show download button' ) }
						isShownByDefault
						hasValue={ () => ! showDownloadButton }
						onDeselect={ () =>
							setAttributes( { showDownloadButton: true } )
						}
					>
						<ToggleControl
							label={ __( 'Show download button' ) }
							checked={ showDownloadButton }
							onChange={ ( value ) =>
								setAttributes( { showDownloadButton: value } )
							}
						/>
					</ToolsPanelItem>
					{ showDownloadButton && (
						<ToolsPanelItem
							label={ __( 'Download button text' ) }
							isShownByDefault
							hasValue={ () =>
								getPlainText( downloadButtonText ) !==
								defaultDownloadButtonText
							}
							onDeselect={ () =>
								setAttributes( {
									downloadButtonText:
										defaultDownloadButtonText,
								} )
							}
						>
							<InputControl
								label={ __( 'Download button text' ) }
								value={ getPlainText( downloadButtonText ) }
								onValueChange={ ( value ) =>
									setAttributes( {
										downloadButtonText:
											toRichTextHTML( value ),
									} )
								}
								autoComplete="off"
							/>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			</InspectorControls>
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
			</InspectorControls>
		</>
	);
}
