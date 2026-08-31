import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { SelectControl } from '@wordpress/components';
import { ControlWithError } from '@wordpress/ui';
import type { ValidatedControlProps } from './types';

type SelectControlProps = React.ComponentProps< typeof SelectControl >;

type ValidatedSelectControlProps = Omit<
	SelectControlProps,
	'onChange' | 'value'
> & {
	value?: string | string[];
	onChange: ( value: string | string[] ) => void;
} & ValidatedControlProps;

const UnforwardedValidatedSelectControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: ValidatedSelectControlProps,
	forwardedRef: React.ForwardedRef< HTMLSelectElement >
) => {
	const validityTargetRef = useRef< HTMLSelectElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			className="dataviews-validated-control"
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<SelectControl
				ref={ mergedRefs }
				{
					// A runtime boolean cannot statically discriminate
					// SelectControl's single/multiple props union.
					...( restProps as unknown as SelectControlProps )
				}
			/>
		</ControlWithError>
	);
};

export const ValidatedSelectControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef< ValidatedSelectControlProps > &
		React.RefAttributes< HTMLSelectElement >
> = forwardRef( UnforwardedValidatedSelectControl );
ValidatedSelectControl.displayName = 'ValidatedSelectControl';
