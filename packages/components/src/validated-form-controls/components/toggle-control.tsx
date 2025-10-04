/**
 * WordPress dependencies
 */
import { forwardRef, useRef, useEffect } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import ToggleControl from '../../toggle-control';
import type { ToggleControlProps } from '../../toggle-control/types';

type Value = ToggleControlProps[ 'checked' ];

// TODO: Should we customize the default `missingValue` message? It says to "check this box".

const UnforwardedValidatedToggleControl = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof ToggleControl >,
		'__nextHasNoMarginBottom'
	> &
		ValidatedControlProps< Value >,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );
	const valueRef = useRef< Value >( restProps.checked );

	// TODO: Upstream limitation - The `required` attribute is not passed down to the input,
	// so we need to set it manually.
	useEffect( () => {
		if ( validityTargetRef.current ) {
			validityTargetRef.current.required = required ?? false;
		}
	}, [ required ] );

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
			<ToggleControl
				__nextHasNoMarginBottom
				ref={ mergedRefs }
				onChange={ ( value ) => {
					valueRef.current = value;
					onChange?.( value );
				} }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedToggleControl = forwardRef(
	UnforwardedValidatedToggleControl
);
