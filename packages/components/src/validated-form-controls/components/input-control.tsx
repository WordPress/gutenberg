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
import InputControl from '../../input-control';

const UnforwardedValidatedInputControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		revalidateOn,
		...restProps
	}: Omit<
		React.ComponentProps< typeof InputControl >,
		'__next40pxDefaultSize'
	> &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	const _revalidateOn =
		revalidateOn ?? ( restProps.type === 'email' ? 'blur' : 'change' );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			revalidateOn={ _revalidateOn }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<InputControl
				__next40pxDefaultSize
				ref={ mergedRefs }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedInputControl = forwardRef(
	UnforwardedValidatedInputControl
);
ValidatedInputControl.displayName = 'ValidatedInputControl';
