/**
 * External dependencies
 */
import clsx from 'clsx';

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
	const { type, name, label, inlineLabel, required, placeholder, value } =
		attributes;
	const blockProps = useBlockProps();
	const ref = useRef();
	const TagName = type === 'textarea' ? 'textarea' : 'input';

	const borderProps = useBorderProps( attributes );
	const colorProps = useColorProps( attributes );
	if ( ref.current ) {
		ref.current.focus();
	}

	// Note: radio inputs aren't implemented yet.
	const isCheckboxOrRadio = type === 'checkbox' || type === 'radio';

	const controls = (
		<>
			{ 'hidden' !== type && (
				<InspectorControls>
					<PanelBody title={ __( 'Settings' ) }>
						{ 'checkbox' !== type && (
							<CheckboxControl
								__nextHasNoMarginBottom
								label={ __( 'Inline label' ) }
								checked={ inlineLabel }
								onChange={ ( newVal ) => {
									setAttributes( {
										inlineLabel: newVal,
									} );
								} }
							/>
						) }
						<CheckboxControl
							__nextHasNoMarginBottom
							label={ __( 'Required' ) }
							checked={ required }
							onChange={ ( newVal ) => {
								setAttributes( {
									required: newVal,
								} );
							} }
						/>
					</PanelBody>
				</InspectorControls>
			) }
			<InspectorControls group="advanced">
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
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

	const content = (
		<RichText
			tagName="span"
			className="wp-block-form-input__label-content"
			value={ label }
			onChange={ ( newLabel ) => setAttributes( { label: newLabel } ) }
			aria-label={ label ? __( 'Label' ) : __( 'Empty label' ) }
			data-empty={ ! label }
			placeholder={ __( 'Type the label for this input' ) }
		/>
	);

	if ( 'hidden' === type ) {
		return (
			<>
				{ controls }
				<input
					type="hidden"
					className={ clsx(
						className,
						'wp-block-form-input__input',
						colorProps.className,
						borderProps.className
					) }
					aria-label={ __( 'Value' ) }
					value={ value }
					onChange={ ( event ) =>
						setAttributes( { value: event.target.value } )
					}
				/>
			</>
		);
	}

	return (
		<div { ...blockProps }>
			{ controls }
			<span
				className={ clsx( 'wp-block-form-input__label', {
					'is-label-inline': inlineLabel || 'checkbox' === type,
				} ) }
			>
				{ ! isCheckboxOrRadio && content }
				<TagName
					type={ 'textarea' === type ? undefined : type }
					className={ clsx(
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
				{ isCheckboxOrRadio && content }
			</span>
		</div>
	);
}

export default InputFieldBlock;
