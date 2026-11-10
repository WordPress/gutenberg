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
 * inline once the control has been touched or the enclosing form is
 * submitted. A blur counts as a touch unless it leaves a required control
 * empty.
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
