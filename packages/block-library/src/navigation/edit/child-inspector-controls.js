/**
 * WordPress dependencies
 */
import {
	 PanelBody,
	 TextControl,
	 TextareaControl,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
} from '@wordpress/block-editor';
const NavigationChildInspectorControls = ( { setAttributes, url, description, title, rel } ) => (
	<InspectorControls>
		<PanelBody title={ __( 'Link settings' ) }>
			<TextControl
				value={ url || '' }
				onChange={ ( urlValue ) => {
					setAttributes( { url: urlValue } );
				} }
				label={ __( 'URL' ) }
				autoComplete="off"
			/>
			<TextareaControl
				value={ description || '' }
				onChange={ ( descriptionValue ) => {
					setAttributes( { description: descriptionValue } );
				} }
				label={ __( 'Description' ) }
				help={ __(
					'The description will be displayed in the menu if the current theme supports it.'
				) }
			/>
			<TextControl
				value={ title || '' }
				onChange={ ( titleValue ) => {
					setAttributes( { title: titleValue } );
				} }
				label={ __( 'Link title' ) }
				autoComplete="off"
			/>
			<TextControl
				value={ rel || '' }
				onChange={ ( relValue ) => {
					setAttributes( { rel: relValue } );
				} }
				label={ __( 'Link rel' ) }
				autoComplete="off"
			/>
		</PanelBody>
	</InspectorControls>
);

export default NavigationChildInspectorControls;
