import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ControlWithError } from '../../primitives/control-with-error';
import { TextareaControl } from '../../textarea-control';
import type { ValidatedControlProps } from '../types';

/**
 * A `TextareaControl` with inline validation feedback, based on the native
 * Constraint Validation API.
 *
 * Native constraint violations (e.g. `required`, `minLength`) and custom
 * validity messages passed through the `customValidity` prop are reported
 * inline once focus leaves the control, or when the enclosing form is
 * submitted or `reportValidity()` is called. Focus leaving an empty required
 * control doesn't reveal its messages, unless the user has left it with a
 * value before.
 */
export const ValidatedTextareaControl = forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps< typeof TextareaControl > & ValidatedControlProps
>( function UnforwardedValidatedTextareaControl(
	{ required, markWhenOptional, customValidity, ...restProps },
	forwardedRef
) {
	const validityTargetRef = useRef< HTMLTextAreaElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<TextareaControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
} );
