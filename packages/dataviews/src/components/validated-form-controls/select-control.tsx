import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { SelectControl } from '@wordpress/components';
import { ControlWithError } from './control-with-error';
import type { ValidatedControlProps } from './types';

const UnforwardedValidatedSelectControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof SelectControl > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLSelectElement >
) => {
	const validityTargetRef = useRef< HTMLSelectElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<SelectControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedSelectControl = forwardRef(
	UnforwardedValidatedSelectControl
);
ValidatedSelectControl.displayName = 'ValidatedSelectControl';
