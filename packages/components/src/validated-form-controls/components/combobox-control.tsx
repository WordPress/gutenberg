/**
 * WordPress dependencies
 */
import { useMergeRefs } from '@wordpress/compose';
import { forwardRef, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import type { ValidatedControlProps } from './types';
import ComboboxControl from '../../combobox-control';

const UnforwardedValidatedComboboxControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof ComboboxControl >,
		'__next40pxDefaultSize'
	> &
		ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	// TODO: Upstream limitation - The `required` attribute is not passed down to the input,
	// so we need to set it manually.
	useEffect( () => {
		const input =
			validityTargetRef.current?.querySelector< HTMLInputElement >(
				'input[role="combobox"]'
			);
		if ( input ) {
			input.required = required ?? false;
		}
	}, [ required ] );

	return (
		// TODO: Bug - Missing value error is not cleared immediately on change, waits for blur.
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			ref={ mergedRefs }
			customValidity={ customValidity }
			getValidityTarget={ () =>
				validityTargetRef.current?.querySelector< HTMLInputElement >(
					'input[role="combobox"]'
				)
			}
		>
			<ComboboxControl __next40pxDefaultSize { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedComboboxControl = forwardRef(
	UnforwardedValidatedComboboxControl
);
ValidatedComboboxControl.displayName = 'ValidatedComboboxControl';
