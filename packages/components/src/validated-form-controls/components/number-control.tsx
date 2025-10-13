/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import NumberControl from '../../number-control';
import type { ValidatedControlProps } from './types';
import type { NumberControlProps } from '../../number-control/types';

type Value = NumberControlProps[ 'value' ];

const UnforwardedValidatedNumberControl = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof NumberControl >,
		'__next40pxDefaultSize'
	> &
		ValidatedControlProps< Value >,
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
			<NumberControl
				__next40pxDefaultSize
				ref={ mergedRefs }
				// TODO: Upstream limitation - When form is submitted when value is undefined, it will
				// automatically set a clamped value (as defined by `min` attribute, so 0 by default).
				onChange={ ( value, ...args ) => {
					valueRef.current = value;
					onChange?.( value, ...args );
				} }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedNumberControl = forwardRef(
	UnforwardedValidatedNumberControl
);
