import { forwardRef, useRef } from '@wordpress/element';
import { ControlWithError } from '@wordpress/ui';
import type { ValidatedControlProps } from './types';
import CustomSelectControl from '../../custom-select-control';

const UnforwardedValidatedCustomSelectControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof CustomSelectControl > &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLSelectElement >( null );

	return (
		<div
			className="components-validated-control__wrapper-with-error-delegate"
			ref={ forwardedRef }
		>
			<ControlWithError
				className="components-validated-control"
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
			>
				<CustomSelectControl
					// TODO: Upstream limitation - Required isn't passed down correctly,
					// so it needs to be set on a delegate element.
					{ ...restProps }
				/>
			</ControlWithError>
			<select
				className="components-validated-control__error-delegate"
				ref={ validityTargetRef }
				required={ required }
				tabIndex={ -1 }
				value={ restProps.value?.key ? 'hasvalue' : '' }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLButtonElement >(
							'[role="combobox"]'
						)
						?.focus();
				} }
			>
				<option value="">No selection</option>
				<option value="hasvalue">Has selection</option>
			</select>
		</div>
	);
};

export const ValidatedCustomSelectControl = forwardRef(
	UnforwardedValidatedCustomSelectControl
);
ValidatedCustomSelectControl.displayName = 'ValidatedCustomSelectControl';
