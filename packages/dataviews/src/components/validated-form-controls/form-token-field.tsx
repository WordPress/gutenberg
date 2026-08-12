import { forwardRef, useRef } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';
import { ControlWithError } from './control-with-error';
import type { ValidatedControlProps } from './types';

type FormTokenFieldProps = React.ComponentProps< typeof FormTokenField >;

type ValidatedFormTokenFieldProps = FormTokenFieldProps & ValidatedControlProps;

const UnforwardedValidatedFormTokenField = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedFormTokenFieldProps,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );

	return (
		<div
			className="dataviews-validated-control__wrapper-with-error-delegate"
			ref={ forwardedRef }
		>
			<ControlWithError
				required={ required }
				markWhenOptional={ markWhenOptional }
				customValidity={ customValidity }
				getValidityTarget={ () => validityTargetRef.current }
			>
				<FormTokenField { ...restProps } />
			</ControlWithError>
			<input
				className="dataviews-validated-control__error-delegate"
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
							'input[type="text"]'
						)
						?.focus();
				} }
			/>
		</div>
	);
};

export const ValidatedFormTokenField: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedFormTokenFieldProps > &
		React.RefAttributes< HTMLDivElement >
> = forwardRef( UnforwardedValidatedFormTokenField );
ValidatedFormTokenField.displayName = 'ValidatedFormTokenField';
