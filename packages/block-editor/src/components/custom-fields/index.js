/**
 * WordPress dependencies
 */
import { PanelBody, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../../components';
import { useAvailableBlockAttributes } from '../block-bindings';

export function CustomFieldsControl( props ) {
	// TODO: Discuss if this is the best way to get the availabe block bindings.
	const attributeName = useAvailableBlockAttributes( props.name );

	return (
		<InspectorControls>
			<PanelBody title={ __( 'Connections' ) } initialOpen={ true }>
				<TextControl
					__nextHasNoMarginBottom
					autoComplete="off"
					label={ __( 'Custom field meta_key' ) }
					value={
						props.attributes?.connections?.attributes?.[
							attributeName
						]?.value || ''
					}
					onChange={ ( nextValue ) => {
						if ( nextValue === '' ) {
							props.setAttributes( {
								connections: undefined,
								[ attributeName ]: undefined,
								placeholder: undefined,
							} );
						} else {
							props.setAttributes( {
								connections: {
									attributes: {
										// The attributeName will be either `content` or `url`.
										[ attributeName ]: {
											// Source will be variable, could be post_meta, user_meta, term_meta, etc.
											// Could even be a custom source like a social media attribute.
											source: 'meta_fields',
											value: nextValue,
										},
									},
								},
								[ attributeName ]: undefined,
								placeholder: sprintf(
									'This content will be replaced on the frontend by the value of "%s" custom field.',
									nextValue
								),
							} );
						}
					} }
				/>
			</PanelBody>
		</InspectorControls>
	);
}
