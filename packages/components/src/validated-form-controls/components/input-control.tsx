/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import InputControl from '../../input-control';
import type { InputControlProps } from '../../input-control/types';

type Value = InputControlProps[ 'value' ];

const UnforwardedValidatedInputControl = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof InputControl >,
		'__next40pxDefaultSize'
	> &
		ValidatedControlProps< InputControlProps[ 'value' ] >,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );
	const valueRef = useRef< Value >( restProps.value );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			onValidate={ () => {
				return onValidate?.( valueRef.current );
			} }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<InputControl
				__next40pxDefaultSize
				ref={ mergedRefs }
				onChange={ ( value, ...args ) => {
					valueRef.current = value;
					onChange?.( value, ...args );
				} }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedInputControl = forwardRef(
	UnforwardedValidatedInputControl
);
