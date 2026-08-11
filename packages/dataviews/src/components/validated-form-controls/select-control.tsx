import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { SelectControl } from '@wordpress/components';
import { ControlWithError } from './control-with-error';
import type { ValidatedControlProps } from './types';

const UnforwardedValidatedSelectControl = (
	{
		required,
		customValidity,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof SelectControl >,
		'multiple' | 'onChange' | 'value'
	> & {
		value?: string;
		onChange: ( value: string ) => void;
	} & ValidatedControlProps,
	forwardedRef: React.ForwardedRef< HTMLSelectElement >
) => {
	const validityTargetRef = useRef< HTMLSelectElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<SelectControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedSelectControl: React.ForwardRefExoticComponent<
	React.PropsWithoutRef<
		Omit<
			React.ComponentProps< typeof SelectControl >,
			'multiple' | 'onChange' | 'value'
		> & {
			value?: string;
			onChange: ( value: string ) => void;
		} & ValidatedControlProps
	> &
		React.RefAttributes< HTMLSelectElement >
> = forwardRef( UnforwardedValidatedSelectControl );
ValidatedSelectControl.displayName = 'ValidatedSelectControl';
