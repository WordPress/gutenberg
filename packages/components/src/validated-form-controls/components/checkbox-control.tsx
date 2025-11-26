/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import CheckboxControl from '../../checkbox-control';
import type { CheckboxControlProps } from '../../checkbox-control/types';

type Value = CheckboxControlProps[ 'checked' ];

const UnforwardedValidatedCheckboxControl = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof CheckboxControl >,
		'__nextHasNoMarginBottom'
	> &
		ValidatedControlProps< Value >,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );
	const valueRef = useRef< Value >( restProps.checked );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			ref={ mergedRefs }
			onValidate={ () => {
				return onValidate?.( valueRef.current );
			} }
			customValidity={ customValidity }
			getValidityTarget={ () =>
				validityTargetRef.current?.querySelector< HTMLInputElement >(
					'input[type="checkbox"]'
				)
			}
		>
			<CheckboxControl
				__nextHasNoMarginBottom
				onChange={ ( value ) => {
					valueRef.current = value;
					onChange?.( value );
				} }
				// TODO: Upstream limitation - CheckboxControl doesn't support uncontrolled mode, visually.
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedCheckboxControl = forwardRef(
	UnforwardedValidatedCheckboxControl
);
