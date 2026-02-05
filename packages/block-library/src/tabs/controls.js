/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, TextControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';
import RemoveTabToolbarControl from '../tab/remove-tab-toolbar-control';

export default function Controls( { attributes, setAttributes, clientId } ) {
	const {
		metadata = {
			name: '',
		},
	} = attributes;

	return (
		<>
			<AddTabToolbarControl tabsClientId={ clientId } />
			<RemoveTabToolbarControl tabsClientId={ clientId } />
			<InspectorControls>
				<PanelBody title={ __( 'Settings' ) }>
					<TextControl
						label={ __( 'Title' ) }
						help={ __(
							'The tabs title is used by screen readers to describe the purpose and content of the tab panel.'
						) }
						value={ metadata.name }
						onChange={ ( value ) => {
							setAttributes( {
								metadata: { ...metadata, name: value },
							} );
						} }
						__next40pxDefaultSize
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);
}
