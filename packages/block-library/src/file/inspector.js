/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

export default function FileBlockInspector( {
	hrefs,
	openInNewWindow,
	showDownloadButton,
	changeLinkDestinationOption,
	changeOpenInNewWindow,
	changeShowDownloadButton,
} ) {
	const { href, textLinkHref, attachmentPage } = hrefs;

	let linkDestinationOptions = [ { value: href, label: __( 'URL' ) } ];
	if ( attachmentPage ) {
		linkDestinationOptions = [
			{ value: href, label: __( 'Media File' ) },
			{ value: attachmentPage, label: __( 'Attachment page' ) },
		];
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Text link settings' ) }>
					<SelectControl
						label={ __( 'Link To' ) }
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
