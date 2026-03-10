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
import RadioControl from '../../radio-control';

const UnforwardedValidatedRadioControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: React.ComponentProps< typeof RadioControl > & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			// TODO: Upstream limitation - RadioControl does not accept a ref.
			ref={ mergedRefs }
			customValidity={ customValidity }
			getValidityTarget={ () =>
				validityTargetRef.current?.querySelector< HTMLInputElement >(
					'input[type="radio"]'
				)
			}
		>
			<RadioControl { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedRadioControl = forwardRef(
	UnforwardedValidatedRadioControl
);
ValidatedRadioControl.displayName = 'ValidatedRadioControl';
