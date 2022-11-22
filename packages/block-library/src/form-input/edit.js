/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	InspectorControls,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, CheckboxControl } from '@wordpress/components';

import { useRef } from '@wordpress/element';

function InputFieldBlock( { attributes, setAttributes } ) {
	const { type, name, label, inlineLabel, required, placeholder } =
		attributes;
	const blockProps = useBlockProps();
	const ref = useRef();
	const TagName = type === 'textarea' ? 'textarea' : 'input';

	if ( ref.current ) {
		ref.current.focus();
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Input settings' ) }>
					<CheckboxControl
						label={ __( 'Inline label' ) }
						checked={ attributes.inlineLabel }
						onChange={ ( newVal ) => {
							setAttributes( {
								inlineLabel: newVal,
							} );
						} }
					/>
					<CheckboxControl
						label={ __( 'Required' ) }
						checked={ attributes.required }
						onChange={ ( newVal ) => {
							setAttributes( {
								required: newVal,
							} );
						} }
					/>
				</PanelBody>
			</InspectorControls>
			<InspectorControls __experimentalGroup="advanced">
				<TextControl
					autoComplete="off"
					label={ __( 'Name' ) }
					value={ name }
					onChange={ ( newVal ) => {
						setAttributes( {
							name: newVal,
						} );
					} }
					help={ __(
						'Affects the "name" atribute of the input element, and is used as a name for the form submission results.'
					) }
				/>
			</InspectorControls>
			<div
				className={ classNames(
					'wp-block-form-input-wrapper wp-block-form-input-label',
					{
						'is-label-inline': inlineLabel,
					}
				) }
			>
				<RichText
					tagName="span"
					className="wp-block-form-input-label__content"
					{ ...blockProps }
					value={ label }
					onChange={ ( newLabel ) =>
						setAttributes( { label: newLabel } )
					}
					aria-label={ label ? __( 'Label' ) : __( 'Empty label' ) }
					data-empty={ label ? false : true }
					placeholder={ __( 'Type the label for this input' ) }
				/>
				<TagName
					type={ type }
					className="wp-block-form-input"
					aria-label={ __( 'Optional placeholder text' ) }
					// We hide the placeholder field's placeholder when there is a value. This
					// stops screen readers from reading the placeholder field's placeholder
					// which is confusing.
					placeholder={
						placeholder ? undefined : __( 'Optional placeholder…' )
					}
					value={ placeholder }
					onChange={ ( event ) =>
						setAttributes( { placeholder: event.target.value } )
					}
					aria-required={ required }
				/>
			</div>
		</>
	);
}

export default InputFieldBlock;
