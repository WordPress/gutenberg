import { forwardRef, useRef } from '@wordpress/element';
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import { FormTokenField } from '../../form-token-field';

/**
 * The element the user actually interacts with. `ValidatedFormTokenField`
 * validates through a hidden delegate input, so this has to be resolved from
 * the DOM — both to delegate focus and to attach the validity message.
 *
 * This input also carries `role="combobox"`.
 */
const INTERACTIVE_TARGET_SELECTOR = 'input[type="text"]';

const UnforwardedValidatedFormTokenField = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof FormTokenField > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

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
				<FormTokenField { ...restProps } />
			</ControlWithError>
			<input
				className="components-validated-control__error-delegate"
				type="text"
				ref={ validityTargetRef }
				required={ required }
				value={
					restProps.value && restProps.value.length > 0
						? 'hasvalue'
						: ''
				}
				tabIndex={ -1 }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLInputElement >(
							INTERACTIVE_TARGET_SELECTOR
						)
						?.focus();
				} }
			/>
		</div>
	);
};

export const ValidatedFormTokenField = forwardRef(
	UnforwardedValidatedFormTokenField
);
ValidatedFormTokenField.displayName = 'ValidatedFormTokenField';
