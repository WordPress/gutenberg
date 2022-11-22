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
import {
	PanelBody,
	CustomSelectControl,
	TextControl,
	CheckboxControl,
} from '@wordpress/components';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { INPUT_TYPES } from './utils';

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
					<CustomSelectControl
						label={ __( 'Type' ) }
						value={ INPUT_TYPES.find(
							( option ) => option.key === type
						) }
						options={ INPUT_TYPES }
						onChange={ ( newVal ) => {
							setAttributes( {
								type: newVal?.selectedItem?.key,
							} );
						} }
					/>
					{ type !== 'submit' && (
						<CheckboxControl
							label={ __( 'Inline label' ) }
							checked={ attributes.inlineLabel }
							onChange={ ( newVal ) => {
								setAttributes( {
									inlineLabel: newVal,
								} );
							} }
						/>
					) }
					{ type !== 'submit' && (
						<CheckboxControl
							label={ __( 'Required' ) }
							checked={ attributes.required }
							onChange={ ( newVal ) => {
								setAttributes( {
									required: newVal,
								} );
							} }
						/>
					) }
				</PanelBody>
			</InspectorControls>
			{ type !== 'submit' && (
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
			) }

			{ type === 'submit' && (
				<div className="wp-block-buttons">
					<div className="wp-block-button">
						<button
							className="wp-block-button__link wp-element-button"
							disabled="true"
						>
							<RichText
								tagName="div"
								{ ...blockProps }
								value={ label }
								onChange={ ( newLabel ) =>
									setAttributes( { label: newLabel } )
								}
								ref={ ref.current }
								aria-label={
									label ? __( 'Label' ) : __( 'Empty label' )
								}
								data-empty={ label ? false : true }
								placeholder={ __(
									'Type the label for this input'
								) }
							/>
						</button>
					</div>
				</div>
			) }

			{ type !== 'submit' && (
				<div
					className={ classNames( 'wp-block-form-input-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<RichText
						tagName="span"
						className="wp-block-form-input-label__content"
						{ ...blockProps }
						value={ label }
						onChange={ ( newLabel ) =>
							setAttributes( { label: newLabel } )
						}
						aria-label={
							label ? __( 'Label' ) : __( 'Empty label' )
						}
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
							placeholder
								? undefined
								: __( 'Optional placeholder…' )
						}
						value={ placeholder }
						onChange={ ( event ) =>
							setAttributes( { placeholder: event.target.value } )
						}
						aria-required={ required }
					/>
				</div>
			) }
		</>
	);
}

export default InputFieldBlock;
