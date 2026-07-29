/**
 * WordPress dependencies
 */
import {
	BaseControl,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { DataFormControlProps, FormatTime } from '../../types';
import { OPERATOR_BETWEEN } from '../../constants';
import { unlock } from '../../lock-unlock';
import getCustomValidity from './utils/get-custom-validity';

const { ValidatedInputControl } = unlock( componentsPrivateApis );

type TimeBetween = [ string, string ];

// `input[type=time]` only offers a seconds field when `step` is finer than the
// default of one minute, so the input's precision follows the display format.
function getStep( timeFormat?: string ): number | undefined {
	// Backslash-escaped characters are literals, not format tokens.
	const tokens = ( timeFormat ?? '' ).replace( /\\./g, '' );
	return tokens.includes( 's' ) ? 1 : undefined;
}

function BetweenControls( {
	value,
	onChange,
	hideLabelFromVision,
	disabled,
	step,
	min,
	max,
}: {
	value: TimeBetween;
	onChange: ( [ from, to ]: TimeBetween ) => void;
	hideLabelFromVision?: boolean;
	disabled?: boolean;
	step?: number;
	min?: string;
	max?: string;
} ) {
	const [ from = '', to = '' ] = value;

	const onChangeFrom = useCallback(
		( newValue?: string ) => onChange( [ newValue ?? '', to ] ),
		[ onChange, to ]
	);

	const onChangeTo = useCallback(
		( newValue?: string ) => onChange( [ from, newValue ?? '' ] ),
		[ onChange, from ]
	);

	return (
		<BaseControl
			help={ __( 'The end time must be later than the start time.' ) }
		>
			<Stack direction="row" gap="sm" justify="space-between">
				<ValidatedInputControl
					type="time"
					label={ __( 'From' ) }
					value={ from }
					onChange={ onChangeFrom }
					hideLabelFromVision={ hideLabelFromVision }
					disabled={ disabled }
					step={ step }
					min={ min }
					max={ to || max }
				/>
				<ValidatedInputControl
					type="time"
					label={ __( 'To' ) }
					value={ to }
					onChange={ onChangeTo }
					hideLabelFromVision={ hideLabelFromVision }
					disabled={ disabled }
					step={ step }
					min={ from || min }
					max={ max }
				/>
			</Stack>
		</BaseControl>
	);
}

export default function Time< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	operator,
	validity,
}: DataFormControlProps< Item > ) {
	const { label, placeholder, description, getValue, setValue, isValid } =
		field;
	const value = getValue( { item: data } );
	const disabled = field.isDisabled( { item: data, field } );
	const step = getStep( ( field.format as FormatTime )?.time );
	const min =
		typeof isValid.min?.constraint === 'string'
			? isValid.min.constraint
			: undefined;
	const max =
		typeof isValid.max?.constraint === 'string'
			? isValid.max.constraint
			: undefined;

	const onChangeControl = useCallback(
		( newValue?: string ) =>
			onChange(
				setValue( {
					item: data,
					value: newValue === '' ? undefined : newValue,
				} )
			),
		[ data, onChange, setValue ]
	);

	const onChangeBetweenControls = useCallback(
		( newValue: TimeBetween ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	if ( operator === OPERATOR_BETWEEN ) {
		let valueBetween: TimeBetween = [ '', '' ];
		if (
			Array.isArray( value ) &&
			value.length === 2 &&
			value.every( ( element ) => typeof element === 'string' )
		) {
			valueBetween = value as TimeBetween;
		}
		return (
			<BetweenControls
				value={ valueBetween }
				onChange={ onChangeBetweenControls }
				hideLabelFromVision={ hideLabelFromVision }
				disabled={ disabled }
				step={ step }
				min={ min }
				max={ max }
			/>
		);
	}

	return (
		<ValidatedInputControl
			required={ !! isValid.required }
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
			type="time"
			label={ label }
			placeholder={ placeholder }
			help={ description }
			value={ value ?? '' }
			onChange={ onChangeControl }
			hideLabelFromVision={ hideLabelFromVision }
			disabled={ disabled }
			step={ step }
			min={ min }
			max={ max }
		/>
	);
}
