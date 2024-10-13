/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { MIN_PREVIEW_HEIGHT, MAX_PREVIEW_HEIGHT } from './edit';

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
					<PanelBody title={ __( 'PDF settings' ) }>
						<ToggleControl
							__nextHasNoMarginBottom
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
						{ displayPreview && (
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
						) }
					</PanelBody>
				) }
				<PanelBody title={ __( 'Settings' ) }>
					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Link to' ) }
						value={ textLinkHref }
						options={ linkDestinationOptions }
						onChange={ changeLinkDestinationOption }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Open in new tab' ) }
						checked={ openInNewWindow }
						onChange={ changeOpenInNewWindow }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show download button' ) }
						checked={ showDownloadButton }
						onChange={ changeShowDownloadButton }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
