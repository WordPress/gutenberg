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

const UnforwardedValidatedNumberControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof NumberControl > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<NumberControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedNumberControl = forwardRef(
	UnforwardedValidatedNumberControl
);
ValidatedNumberControl.displayName = 'ValidatedNumberControl';
