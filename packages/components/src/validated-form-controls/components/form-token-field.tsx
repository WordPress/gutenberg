/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import { FormTokenField } from '../../form-token-field';
import type { FormTokenFieldProps } from '../../form-token-field/types';

type Value = FormTokenFieldProps[ 'value' ];

const UnforwardedValidatedFormTokenField = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof FormTokenField >,
		'__next40pxDefaultSize' | '__nextHasNoMarginBottom'
	> &
		ValidatedControlProps< FormTokenFieldProps[ 'value' ] >,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const valueRef = useRef< Value >( restProps.value );

	return (
		<div
			className="components-validated-control__wrapper-with-error-delegate"
			ref={ forwardedRef }
		>
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				onValidate={ () => {
					return onValidate?.( valueRef.current );
				} }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
			>
				<FormTokenField
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					{ ...restProps }
					onChange={ ( value, ...args ) => {
						valueRef.current = value;
						onChange?.( value, ...args );
					} }
				/>
			</ControlWithError>
			<input
				className="components-validated-control__error-delegate"
				type="text"
				ref={ validityTargetRef }
				required={ required }
				value={
					valueRef.current && valueRef.current.length > 0
						? 'hasvalue'
						: ''
				}
				tabIndex={ -1 }
				onChange={ () => {} }
				onFocus={ ( e ) => {
					e.target.previousElementSibling
						?.querySelector< HTMLInputElement >(
							'input[type="text"]'
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
