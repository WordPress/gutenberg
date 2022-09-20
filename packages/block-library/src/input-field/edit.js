/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
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
	const blockProps = useBlockProps();

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
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label>
					{ inlineLabel && label && <span>{ label }</span> }
					{ ! inlineLabel && label && <p>{ label }</p> }
					<textarea className="wp-block-input-field" />
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
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
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label>
					<RichText
						identifier="label"
						tagName={ inlineLabel ? 'span' : 'p' }
						{ ...blockProps }
						value={ label }
						onChange={ ( newContent ) =>
							setAttributes( { label: newContent } )
						}
						aria-label={
							label ? __( 'Label' ) : __( 'Empty label' )
						}
						data-empty={ label ? false : true }
						placeholder={ __( 'Type the label for this input' ) }
						__unstableEmbedURLOnPaste
						__unstableAllowPrefixTransformations
					/>
					<input className="wp-block-input-field" type={ type } />
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }
		</>
	);
}

export default InputFieldBlock;
