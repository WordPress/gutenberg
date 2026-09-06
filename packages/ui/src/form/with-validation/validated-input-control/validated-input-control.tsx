import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ControlWithError } from '../../primitives/control-with-error';
import { InputControl } from '../../input-control';
import type { ValidatedControlProps } from '../types';

/**
 * An `InputControl` with inline validation feedback, based on the native
 * Constraint Validation API.
 *
 * Native constraint violations (e.g. `required`, `pattern`) and custom
 * validity messages passed through the `customValidity` prop are reported
 * inline once the control has been touched (blurred at least once) or the
 * enclosing form is submitted.
 */
export const ValidatedInputControl = forwardRef<
	HTMLInputElement,
	React.ComponentProps< typeof InputControl > & ValidatedControlProps
>( function ValidatedInputControl(
	{ required, markWhenOptional, customValidity, ...restProps },
	forwardedRef
) {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<InputControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
} );
