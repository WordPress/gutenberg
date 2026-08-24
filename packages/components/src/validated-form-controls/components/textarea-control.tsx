import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ControlWithError } from '@wordpress/ui';
import type { ValidatedControlProps } from './types';
import TextareaControl from '../../textarea-control';

const UnforwardedValidatedTextareaControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof TextareaControl > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLTextAreaElement >
) => {
	const validityTargetRef = useRef< HTMLTextAreaElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			className="components-validated-control"
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<TextareaControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedTextareaControl = forwardRef(
	UnforwardedValidatedTextareaControl
);
ValidatedTextareaControl.displayName = 'ValidatedTextareaControl';
