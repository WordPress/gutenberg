/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	CustomSelectControl,
	TextControl,
	CheckboxControl,
} from '@wordpress/components';

const inputTypeOptions = [
	{
		key: 'text',
		name: __( 'Text' ),
	},
	{
		key: 'textarea',
		name: __( 'Textarea' ),
	},
	{
		key: 'email',
		name: __( 'Email' ),
	},
	{
		key: 'url',
		name: __( 'URL' ),
	},
	{
		key: 'tel',
		name: __( 'Telephone' ),
	},
	{
		key: 'number',
		name: __( 'Number' ),
	},
	{
		key: 'datetime-local',
		name: __( 'Date and time' ),
	},
	{
		key: 'submit',
		name: __( 'Submit' ),
	},
];

function InputFieldBlock( { attributes, setAttributes } ) {
	const { type, label, inlineLabel } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Input settings' ) }>
					<CustomSelectControl
						label={ __( 'Type' ) }
						value={ inputTypeOptions.find(
							( option ) => option.key === type
						) }
						options={ inputTypeOptions }
						onChange={ ( newVal ) => {
							setAttributes( {
								type: newVal?.selectedItem?.key,
							} );
						} }
					/>
					<TextControl
						label={ __( 'Label' ) }
						value={ label }
						onChange={ ( newVal ) => {
							setAttributes( {
								label: newVal,
							} );
						} }
					/>
					<CheckboxControl
						label={ __( 'Inline label' ) }
						checked={ attributes.inlineLabel }
						onChange={ ( newVal ) => {
							setAttributes( {
								inlineLabel: newVal,
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>

			{ type === 'textarea' && (
				<label>
					{ inlineLabel && label && <span>{ label }</span> }
					{ ! inlineLabel && label && <p>{ label }</p> }
					<textarea className="wp-block-input-field" />
				</label>
			) }

			{ type === 'submit' && (
				<div className="wp-block-buttons">
					<div className="wp-block-button">
						<input
							className="wp-block-button__link wp-element-button"
							type="submit"
							value={ label }
						/>
					</div>
				</div>
			) }

			{ type !== 'textarea' && type !== 'submit' && (
				<label>
					{ inlineLabel && label && <span>{ label }</span> }
					{ ! inlineLabel && label && <p>{ label }</p> }
					<input className="wp-block-input-field" type={ type } />
				</label>
			) }
		</>
	);
}

export default InputFieldBlock;
