import { forwardRef, useId, useRef } from '@wordpress/element';
import { __experimentalToggleGroupControl as ToggleGroupControl } from '@wordpress/components';
import { ControlWithError } from './control-with-error';
import type { ValidatedControlProps } from './types';

type ToggleGroupControlProps = React.ComponentProps<
	typeof ToggleGroupControl
>;

type ValidatedToggleGroupControlProps = ToggleGroupControlProps &
	ValidatedControlProps;

const UnforwardedValidatedToggleGroupControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedToggleGroupControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

	const nameAttr = useId();

	return (
		<div className="dataviews-validated-control__wrapper-with-error-delegate">
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
			>
				<ToggleGroupControl ref={ forwardedRef } { ...restProps } />
			</ControlWithError>
			<input
				className="dataviews-validated-control__error-delegate"
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

export const ValidatedToggleGroupControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedToggleGroupControlProps > &
		React.RefAttributes< HTMLInputElement >
> = forwardRef( UnforwardedValidatedToggleGroupControl );
ValidatedToggleGroupControl.displayName = 'ValidatedToggleGroupControl';
