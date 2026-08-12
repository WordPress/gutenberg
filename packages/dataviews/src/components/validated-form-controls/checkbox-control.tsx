import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { CheckboxControl } from '@wordpress/components';
import { ControlWithError } from './control-with-error';
import type { ValidatedControlProps } from './types';

type CheckboxControlProps = React.ComponentProps< typeof CheckboxControl >;

type ValidatedCheckboxControlProps = CheckboxControlProps &
	ValidatedControlProps;

const UnforwardedValidatedCheckboxControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedCheckboxControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			ref={ mergedRefs }
			customValidity={ customValidity }
			getValidityTarget={ () =>
				validityTargetRef.current?.querySelector< HTMLInputElement >(
					'input[type="checkbox"]'
				)
			}
		>
			<CheckboxControl
				// TODO: Upstream limitation - CheckboxControl doesn't support uncontrolled mode, visually.
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedCheckboxControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedCheckboxControlProps > &
		React.RefAttributes< HTMLInputElement >
> = forwardRef( UnforwardedValidatedCheckboxControl );
ValidatedCheckboxControl.displayName = 'ValidatedCheckboxControl';
