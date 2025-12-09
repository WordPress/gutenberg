/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import TextareaControl from '../../textarea-control';

const UnforwardedValidatedTextareaControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof TextareaControl >,
		'__nextHasNoMarginBottom'
	> &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLTextAreaElement >
) => {
	const validityTargetRef = useRef< HTMLTextAreaElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<TextareaControl
				__nextHasNoMarginBottom
				ref={ mergedRefs }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedTextareaControl = forwardRef(
	UnforwardedValidatedTextareaControl
);
