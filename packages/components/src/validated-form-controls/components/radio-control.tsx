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
import RadioControl from '../../radio-control';
import type { RadioControlProps } from '../../radio-control/types';

type Value = RadioControlProps[ 'selected' ];

const UnforwardedValidatedRadioControl = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof RadioControl > &
		ValidatedControlProps< Value >,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );
	const valueRef = useRef< Value >( restProps.selected );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			// TODO: Upstream limitation - RadioControl does not accept a ref.
			ref={ mergedRefs }
			onValidate={ () => {
				return onValidate?.( valueRef.current );
			} }
			customValidity={ customValidity }
			getValidityTarget={ () =>
				validityTargetRef.current?.querySelector< HTMLInputElement >(
					'input[type="radio"]'
				)
			}
		>
			<RadioControl
				onChange={ ( value ) => {
					valueRef.current = value;
					onChange?.( value );
				} }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedRadioControl = forwardRef(
	UnforwardedValidatedRadioControl
);
