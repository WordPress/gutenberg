/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, PanelBody, TextControl } from '@wordpress/components';
import { InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AddTabToolbarControl from '../tab/add-tab-toolbar-control';

export default function Controls( { attributes, setAttributes, clientId } ) {
	const {
		orientation,
		metadata = {
			name: '',
		},
	} = attributes;

	return (
		<>
			<AddTabToolbarControl
				tabsClientId={ clientId }
				attributes={ attributes }
			/>
			<InspectorControls>
				<PanelBody title={ __( 'Tabs Settings' ) }>
					<ToggleControl
						label={ __( 'Vertical Tabs' ) }
						checked={ 'vertical' === orientation }
						onChange={ () =>
							setAttributes( {
								orientation:
									'vertical' === orientation
										? 'horizontal'
										: 'vertical',
							} )
						}
					/>
					<TextControl
						label={ __( 'Tabs Title' ) }
						help={ __(
							'The tabs title is used by screen readers to describe the purpose and content of the tabs.'
						) }
						value={ metadata.name }
						placeholder={ __( 'Tab Contents' ) }
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
