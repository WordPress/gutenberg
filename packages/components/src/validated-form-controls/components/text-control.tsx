/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import TextControl from '../../text-control';

const UnforwardedValidatedTextControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof TextControl >,
		'__next40pxDefaultSize' | '__nextHasNoMarginBottom'
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
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				ref={ mergedRefs }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedTextControl = forwardRef(
	UnforwardedValidatedTextControl
);
