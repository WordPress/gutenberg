import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { ControlWithError } from '@wordpress/ui';
import type { ValidatedControlProps } from './types';

type NumberControlProps = React.ComponentProps< typeof NumberControl >;

type ValidatedNumberControlProps = NumberControlProps & ValidatedControlProps;

const UnforwardedValidatedNumberControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedNumberControlProps,
	forwardedRef: React.ForwardedRef< HTMLInputElement >
) => {
	const validityTargetRef = useRef< HTMLInputElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			className="dataviews-validated-control"
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<NumberControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedNumberControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedNumberControlProps > &
		React.RefAttributes< HTMLInputElement >
> = forwardRef( UnforwardedValidatedNumberControl );
ValidatedNumberControl.displayName = 'ValidatedNumberControl';
