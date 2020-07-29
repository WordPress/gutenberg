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
import { MIN_EMBED_HEIGHT, MAX_EMBED_HEIGHT } from './edit';

export default function FileBlockInspector( {
	hrefs,
	openInNewWindow,
	showDownloadButton,
	showInlineEmbed,
	changeLinkDestinationOption,
	changeOpenInNewWindow,
	changeShowDownloadButton,
	changeShowInlineEmbed,
	embedHeight,
	changeEmbedHeight,
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
							label={ __( 'Show inline embed' ) }
							checked={ showInlineEmbed }
							onChange={ changeShowInlineEmbed }
						/>
						<RangeControl
							label={ __( 'Height in pixels' ) }
							min={ MIN_EMBED_HEIGHT }
							max={ Math.max( MAX_EMBED_HEIGHT, embedHeight ) }
							value={ embedHeight }
							onChange={ changeEmbedHeight }
						/>
					</PanelBody>
				) }
				<PanelBody title={ __( 'Text link settings' ) }>
					<SelectControl
						label={ __( 'Link to' ) }
						value={ textLinkHref }
						options={ linkDestinationOptions }
						onChange={ changeLinkDestinationOption }
					/>
					<ToggleControl
						label={ __( 'Open in new tab' ) }
						checked={ openInNewWindow }
						onChange={ changeOpenInNewWindow }
					/>
				</PanelBody>
				<PanelBody title={ __( 'Download button settings' ) }>
					<ToggleControl
						label={ __( 'Show download button' ) }
						checked={ showDownloadButton }
						onChange={ changeShowDownloadButton }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
