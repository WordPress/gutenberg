/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	SelectControl,
	ToggleControl,
} from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import {
	InspectorControls,
} from '@wordpress/editor';

export default class FileBlockInspector extends Component {
	render() {
		const {
			hrefs,
			openInNewWindow,
			showDownloadButton,
			changeLinkDestinationOption,
			changeOpenInNewWindow,
			changeShowDownloadButton,
		} = this.props;
		const { href, textLinkHref, attachmentPage } = hrefs;

		let linkDestinationOptions = [ { value: href, label: __( 'URL' ) } ];
		if ( attachmentPage ) {
			linkDestinationOptions = [
				{ value: href, label: __( 'Media File' ) },
				{ value: attachmentPage, label: __( 'Attachment Page' ) },
			];
		}

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody title={ __( 'Text Link Settings' ) }>
						<SelectControl
							label={ __( 'Link To' ) }
							value={ textLinkHref }
							options={ linkDestinationOptions }
							onChange={ changeLinkDestinationOption }
						/>
						<ToggleControl
							label={ __( 'Open in new window' ) }
							checked={ openInNewWindow }
							onChange={ changeOpenInNewWindow }
						/>
					</PanelBody>
				</InspectorControls>
				<InspectorControls>
					<PanelBody title={ __( 'Download Button' ) }>
						<ToggleControl
							label={ __( 'Show button' ) }
							checked={ showDownloadButton }
							onChange={ changeShowDownloadButton }
						/>
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	}
}
