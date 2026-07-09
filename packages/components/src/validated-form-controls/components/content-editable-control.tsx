/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import ContentEditableControl from '../../content-editable-control';

/**
 * A `contentEditable` field does not participate in the Constraint Validation
 * API, so — like `ValidatedToggleGroupControl` — the validity state lives on a
 * visually hidden delegate input that mirrors whether the field has content.
 */
const UnforwardedValidatedContentEditableControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		value,
		...restProps
	}: React.ComponentProps< typeof ContentEditableControl > &
		ValidatedControlProps & {
			/**
			 * The field's current HTML value. Only used to drive the hidden
			 * validity delegate (e.g. `required`); the visible content is
			 * managed by the consumer through the forwarded ref.
			 */
			value?: string;
		},
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

	/*
	 * The delegate mirrors the field's plain text so `required` validation
	 * reflects whether the field has content. Markup-only content (e.g. a
	 * lone image object) reads as empty, which matches how a text-oriented
	 * form field is expected to validate.
	 */
	const plainTextValue = value ? value.replace( /<[^>]*>/g, '' ).trim() : '';

	return (
		<div className="components-validated-control__wrapper-with-error-delegate">
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
			>
				<ContentEditableControl
					ref={ forwardedRef }
					aria-invalid={
						customValidity?.type === 'invalid' || undefined
					}
					{ ...restProps }
				/>
			</ControlWithError>
			<input
				className="components-validated-control__error-delegate"
				type="text"
				ref={ validityTargetRef }
				required={ required }
				value={ plainTextValue }
				tabIndex={ -1 }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target
						.closest(
							'.components-validated-control__wrapper-with-error-delegate'
						)
						?.querySelector< HTMLElement >(
							'.wp-components-content-editable-control'
						)
						?.focus();
				} }
			/>
		</div>
	);
};

export const ValidatedContentEditableControl = forwardRef(
	UnforwardedValidatedContentEditableControl
);
ValidatedContentEditableControl.displayName = 'ValidatedContentEditableControl';
