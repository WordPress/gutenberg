import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { RadioControl } from '@wordpress/components';
import { ControlWithError } from '@wordpress/ui';
import type { ValidatedControlProps } from './types';

type RadioControlProps = React.ComponentProps< typeof RadioControl >;

type ValidatedRadioControlProps = RadioControlProps & ValidatedControlProps;

const UnforwardedValidatedRadioControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedRadioControlProps,
	forwardedRef: React.ForwardedRef< HTMLDivElement >
) => {
	const validityTargetRef = useRef< HTMLDivElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			className="dataviews-validated-control"
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

export const ValidatedRadioControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedRadioControlProps > &
		React.RefAttributes< HTMLDivElement >
> = forwardRef( UnforwardedValidatedRadioControl );
ValidatedRadioControl.displayName = 'ValidatedRadioControl';
