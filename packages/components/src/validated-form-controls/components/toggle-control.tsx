/**
 * WordPress dependencies
 */
import { forwardRef, useRef, useCallback } from '@wordpress/element';
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
	const validityTargetRef = useRef< HTMLInputElement | null >( null );
	// TODO: Upstream limitation - The `required` attribute is not passed down to the input,
	// so we need to set it manually. Using a callback ref ensures `required` is set
	// synchronously when the element mounts, before any validation effects run.
	const setRequiredRef = useCallback(
		( element: HTMLInputElement | null ) => {
			validityTargetRef.current = element;
			if ( element ) {
				element.required = required ?? false;
			}
		},
		[ required ]
	);

	const mergedRefs = useMergeRefs( [ forwardedRef, setRequiredRef ] );

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
