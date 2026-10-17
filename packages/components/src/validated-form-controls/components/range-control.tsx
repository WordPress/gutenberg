import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';
import { ControlWithError } from '@wordpress/ui';
import type { ValidatedControlProps } from './types';
import RangeControl from '../../range-control';

const UnforwardedValidatedRangeControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof RangeControl > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			className="components-validated-control"
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<RangeControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedRangeControl = forwardRef(
	UnforwardedValidatedRangeControl
);
ValidatedRangeControl.displayName = 'ValidatedRangeControl';
