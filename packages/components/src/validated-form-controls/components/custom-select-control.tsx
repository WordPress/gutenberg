import { forwardRef, useRef } from '@wordpress/element';
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import CustomSelectControl from '../../custom-select-control';

/**
 * The element the user actually interacts with. `ValidatedCustomSelectControl`
 * validates through a hidden delegate `<select>`, so this has to be resolved
 * from the DOM — both to delegate focus and to attach the validity message.
 */
const INTERACTIVE_TARGET_SELECTOR = '[role="combobox"]';

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

	const getInteractiveTarget = () =>
		validityTargetRef.current?.previousElementSibling?.querySelector(
			INTERACTIVE_TARGET_SELECTOR
		);

	return (
		<div
			className="components-validated-control__wrapper-with-error-delegate"
			ref={ forwardedRef }
		>
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
				getInteractiveTarget={ getInteractiveTarget }
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
							INTERACTIVE_TARGET_SELECTOR
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
