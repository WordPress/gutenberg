/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	SelectControl,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
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
			<InspectorControls>
				<PanelBody title={ __( 'Text Link Settings' ) }>
					<SelectControl
						label={ __( 'Link To' ) }
						value={ textLinkHref }
						options={ linkDestinationOptions }
						onChange={ onChangeLinkDestinationOption }
					/>
				</PanelBody>
			</InspectorControls>
		);
	}
}
