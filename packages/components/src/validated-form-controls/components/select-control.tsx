/**
 * WordPress dependencies
 */
import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ControlWithError } from '../control-with-error';
import SelectControl from '../../select-control';
import type { ValidatedControlProps } from './types';
import type { SelectControlProps as _SelectControlProps } from '../../select-control/types';

// Only support single value selection
type SelectControlProps = Omit<
	_SelectControlProps,
	'multiple' | 'onChange' | 'value'
> & {
	onChange?: ( value: string ) => void;
	value?: string;
};

type Value = SelectControlProps[ 'value' ];

const UnforwardedValidatedSelectControl = (
	{
		required,
		onValidate,
		customValidity,
		onChange,
		markWhenOptional,
		...restProps
	}: Omit<
		React.ComponentProps< typeof SelectControl >,
		| '__next40pxDefaultSize'
		| '__nextHasNoMarginBottom'
		| 'multiple'
		| 'onChange'
		| 'value'
	> & {
		value?: string;
		onChange: ( value: string ) => void;
	} & ValidatedControlProps< Value >,
	forwardedRef: React.ForwardedRef< HTMLSelectElement >
) => {
	const validityTargetRef = useRef< HTMLSelectElement >( null );
	const mergedRefs = useMergeRefs( [ forwardedRef, validityTargetRef ] );
	const valueRef = useRef< Value >( restProps.value );

	return (
		<ControlWithError
			required={ required }
			markWhenOptional={ markWhenOptional }
			onValidate={ () => {
				return onValidate?.( valueRef.current );
			} }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<SelectControl
				__nextHasNoMarginBottom
				__next40pxDefaultSize
				ref={ mergedRefs }
				onChange={ ( value ) => {
					valueRef.current = value;
					onChange?.( value );
				} }
				{ ...restProps }
			/>
		</ControlWithError>
	);
};

export const ValidatedSelectControl = forwardRef(
	UnforwardedValidatedSelectControl
);
