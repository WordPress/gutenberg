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
			href,
			textLinkHref,
			attachmentPage,
			onChangeLinkDestinationOption,
			openInNewWindow,
			onChangeOpenInNewWindow,
			showDownloadButton,
			onChangeShowDownloadButton,
		} = this.props;

		const linkDestinationOptions = ( () => {
			if ( attachmentPage ) {
				return [
					{ value: href, label: __( 'Media File' ) },
					{ value: attachmentPage, label: __( 'Attachment Page' ) },
				];
			}
			return [ { value: href, label: __( 'URL' ) } ];
		} )();

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody title={ __( 'Text Link Settings' ) }>
						<SelectControl
							label={ __( 'Link To' ) }
							value={ textLinkHref }
							options={ linkDestinationOptions }
							onChange={ onChangeLinkDestinationOption }
						/>
						<ToggleControl
							label={ __( 'Open in new window' ) }
							checked={ openInNewWindow }
							onChange={ onChangeOpenInNewWindow }
						/>
					</PanelBody>
				</InspectorControls>
				<InspectorControls>
					<PanelBody title={ __( 'Download Button' ) }>
						<ToggleControl
							label={ __( 'Show button' ) }
							checked={ showDownloadButton }
							onChange={ onChangeShowDownloadButton }
						/>
					</PanelBody>
				</InspectorControls>
			</Fragment>
		);
	}
}
