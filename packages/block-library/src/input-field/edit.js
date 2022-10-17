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
	const { type, name, label, inlineLabel, required } = attributes;
	const blockProps = useBlockProps();
	const ref = useRef();

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

			{ type === 'textarea' && (
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label
					className={ classNames( 'wp-block-input-field-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<RichText
						identifier="label"
						tagName="div"
						className="wp-block-input-field-label__content"
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
						placeholder={ __( 'Type the label for this input' ) }
						__unstableEmbedURLOnPaste
						__unstableAllowPrefixTransformations
					/>
					<textarea
						className="wp-block-input-field"
						disabled="true"
						name={ name }
						required={ required }
						aria-required={ required }
					/>
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }

			{ type === 'submit' && (
				<div className="wp-block-buttons">
					<div className="wp-block-button">
						<button
							className="wp-block-button__link wp-element-button"
							disabled="true"
						>
							<RichText
								identifier="label"
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
								__unstableEmbedURLOnPaste
								__unstableAllowPrefixTransformations
							/>
						</button>
					</div>
				</div>
			) }

			{ type !== 'textarea' && type !== 'submit' && (
				/* eslint-disable jsx-a11y/label-has-associated-control */
				<label
					className={ classNames( 'wp-block-input-field-label', {
						'is-label-inline': inlineLabel,
					} ) }
				>
					<RichText
						identifier="label"
						tagName="span"
						className="wp-block-input-field-label__content"
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
						placeholder={ __( 'Type the label for this input' ) }
						__unstableEmbedURLOnPaste
						__unstableAllowPrefixTransformations
					/>
					<input
						className="wp-block-input-field"
						type={ type }
						name={ name }
						disabled="true"
						required={ required }
						aria-required={ required }
					/>
				</label>
				/* eslint-enable jsx-a11y/label-has-associated-control */
			) }
		</>
	);
}

export default InputFieldBlock;
