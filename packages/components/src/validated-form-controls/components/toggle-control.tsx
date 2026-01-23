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

// TODO: Should we customize the default `missingValue` message? It says to "check this box".

const UnforwardedValidatedToggleControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof ToggleControl > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

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
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<ToggleControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedToggleControl = forwardRef(
	UnforwardedValidatedToggleControl
);
ValidatedToggleControl.displayName = 'ValidatedToggleControl';
