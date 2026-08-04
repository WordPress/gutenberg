/**
 * External dependencies
 */
import clsx from 'clsx';

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
		className,
		...restProps
	}: React.ComponentProps< typeof ContentEditableControl > &
		ValidatedControlProps & {
			/**
			 * The field's current value as plain text, used only to drive the
			 * hidden validity delegate (e.g. `required`). The visible content
			 * is managed by the consumer through the forwarded ref, and any
			 * markup-to-text transformation is the consumer's responsibility.
			 */
			value?: string;
		},
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

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
					className={ clsx(
						'components-validated-control__content-editable',
						className
					) }
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
				// Whitespace-only content reads as empty, matching how a
				// text-oriented form field is expected to validate `required`.
				value={ value?.trim() ?? '' }
				tabIndex={ -1 }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLElement >( '[role="textbox"]' )
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
