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
	}: Omit<
		React.ComponentProps< typeof NumberControl >,
		'__next40pxDefaultSize'
	> &
		ValidatedControlProps,
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
			<NumberControl
				__next40pxDefaultSize
				ref={ mergedRefs }
				// TODO: Upstream limitation - When form is submitted when value is undefined, it will
				// automatically set a clamped value (as defined by `min` attribute, so 0 by default).
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedNumberControl = forwardRef(
	UnforwardedValidatedNumberControl
);
