import { forwardRef, useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { ControlWithError } from '../control-with-error';
import SelectControl from '../../select-control';
import type { WordPressComponentProps } from '../../context';
import type {
	SelectControlSingleSelectionProps,
	SelectControlMultipleSelectionProps,
} from '../../select-control/types';
import type { ValidatedControlProps } from './types';

/**
 * `onChange` is redeclared as required — a validated control is always
 * controlled — and without `SelectControl`'s optional `extra` argument, which
 * consumers of this wrapper have no use for.
 */
export type ValidatedSelectControlSingleSelectionProps = Omit<
	WordPressComponentProps<
		SelectControlSingleSelectionProps< string >,
		'select',
		false
	>,
	'onChange'
> &
	ValidatedControlProps & {
		onChange: ( value: string ) => void;
	};

export type ValidatedSelectControlMultipleSelectionProps = Omit<
	WordPressComponentProps<
		SelectControlMultipleSelectionProps< string >,
		'select',
		false
	>,
	'onChange'
> &
	ValidatedControlProps & {
		onChange: ( value: string[] ) => void;
	};

/**
 * Mirrors `SelectControl`'s own single/multiple discriminated union, so that
 * `multiple` selects are typed with an array `value` and an array `onChange`.
 */
export type ValidatedSelectControlProps =
	| ValidatedSelectControlSingleSelectionProps
	| ValidatedSelectControlMultipleSelectionProps;

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
			required={ required }
			markWhenOptional={ markWhenOptional }
			customValidity={ customValidity }
			getValidityTarget={ () => validityTargetRef.current }
		>
			<SelectControl ref={ mergedRefs } { ...restProps } />
		</ControlWithError>
	);
};

export const ValidatedSelectControl = forwardRef(
	UnforwardedValidatedSelectControl
);
ValidatedSelectControl.displayName = 'ValidatedSelectControl';
