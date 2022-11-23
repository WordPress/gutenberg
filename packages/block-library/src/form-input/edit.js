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
	__experimentalUseBorderProps as useBorderProps,
	__experimentalUseColorProps as useColorProps,
} from '@wordpress/block-editor';
import { PanelBody, TextControl, CheckboxControl } from '@wordpress/components';

import { useRef } from '@wordpress/element';

function InputFieldBlock( { attributes, setAttributes, className } ) {
	const { type, name, label, inlineLabel, required, placeholder } =
		attributes;
	const blockProps = useBlockProps();
	const ref = useRef();
	const TagName = type === 'textarea' ? 'textarea' : 'input';

	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	if ( ref.current ) {
		ref.current.focus();
	}

	const controls = (
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
		</>
	);

	return (
		<div { ...blockProps }>
			{ controls }
			<div
				className={ classNames( 'wp-block-form-input__label', {
					'is-label-inline': inlineLabel,
				} ) }
			>
				<RichText
					tagName="span"
					className="wp-block-form-input__label-content"
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
					className={ classNames(
						className,
						'wp-block-form-input__input',
						colorProps.className,
						borderProps.className
					) }
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
					style={ {
						...borderProps.style,
						...colorProps.style,
					} }
				/>
			</div>
		</div>
	);
}

export default InputFieldBlock;
