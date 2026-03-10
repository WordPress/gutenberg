/**
 * WordPress dependencies
 */
import { forwardRef, useId, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import { ToggleGroupControl } from '../../toggle-group-control';

const UnforwardedValidatedToggleGroupControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof ToggleGroupControl >,
		'__next40pxDefaultSize'
	> &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

	const nameAttr = useId();

	return (
		<div className="components-validated-control__wrapper-with-error-delegate">
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
			>
				<ToggleGroupControl
					__next40pxDefaultSize
					ref={ forwardedRef }
					{ ...restProps }
				/>
			</ControlWithError>
			<input
				className="components-validated-control__error-delegate"
				type="radio"
				ref={ validityTargetRef }
				required={ required }
				checked={ restProps.value !== undefined }
				tabIndex={ -1 }
				// A name attribute is needed for the `required` behavior to work.
				name={ nameAttr }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLButtonElement | HTMLInputElement >(
							'[data-active-item="true"]'
						)
						?.focus();
				} }
			/>
		</div>
	);
};

export const ValidatedToggleGroupControl = forwardRef(
	UnforwardedValidatedToggleGroupControl
);
ValidatedToggleGroupControl.displayName = 'ValidatedToggleGroupControl';
