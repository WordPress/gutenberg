import { forwardRef, useEffect, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ComboboxControl } from '@wordpress/components';
import { ControlWithError } from './control-with-error';
import type { ValidatedControlProps } from './types';

type ComboboxControlProps = React.ComponentProps< typeof ComboboxControl >;

type ValidatedComboboxControlProps = Omit<
	ComboboxControlProps,
	'__next40pxDefaultSize'
> &
	ValidatedControlProps;

const UnforwardedValidatedComboboxControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedComboboxControlProps,
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
			<ComboboxControl { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedComboboxControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedComboboxControlProps > &
		React.RefAttributes< HTMLInputElement >
> = forwardRef( UnforwardedValidatedComboboxControl );
ValidatedComboboxControl.displayName = 'ValidatedComboboxControl';
