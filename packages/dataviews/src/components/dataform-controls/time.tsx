import { BaseControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, ValidatedInputControl } from '@wordpress/ui';
import type { DataFormControlProps, FormatTime } from '../../types';
import { OPERATOR_BETWEEN } from '../../constants';
import parseTime from '../../field-types/utils/parse-time';
import getCustomValidity from './utils/get-custom-validity';

type TimeBetween = [ string, string ];

// `input[type=time]` only offers a seconds field when `step` is finer than the
// default of one minute, so the input's precision follows the display format —
// or the values themselves, which need a seconds field to be editable at all.
function getStep(
	timeFormat: string | undefined,
	values: unknown[]
): number | undefined {
	// Backslash-escaped characters are literals, not format tokens.
	const tokens = ( timeFormat ?? '' ).replace( /\\./g, '' );
	const hasSeconds =
		tokens.includes( 's' ) ||
		values.some( ( value ) => ( parseTime( value ) ?? 0 ) % 60 !== 0 );
	return hasSeconds ? 1 : undefined;
}

// `input[type=time]` accepts only zero-padded `HH:mm[:ss]`, so the variants
// `parseTime` tolerates — unpadded hours, a trailing zone designator — must be
// reduced to that canonical shape before they reach the input.
function toInputValue( value: unknown ): string {
	const seconds = parseTime( value );
	if ( seconds === null ) {
		return '';
	}

	const parts = [
		Math.floor( seconds / 3600 ),
		Math.floor( ( seconds % 3600 ) / 60 ),
	];
	if ( seconds % 60 !== 0 ) {
		parts.push( seconds % 60 );
	}

	return parts
		.map( ( part ) => String( part ).padStart( 2, '0' ) )
		.join( ':' );
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
					onValueChange={ onChangeFrom }
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
					onValueChange={ onChangeTo }
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
	const timeFormat = ( field.format as FormatTime )?.time;
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
		( [ from, to ]: TimeBetween ) =>
			onChange(
				setValue( {
					item: data,
					// An unfilled bound is stored as `undefined`, which the
					// `between` operator reads as "do not apply the filter".
					value: [ from || undefined, to || undefined ],
				} )
			),
		[ data, onChange, setValue ]
	);

	if ( operator === OPERATOR_BETWEEN ) {
		let valueBetween: TimeBetween = [ '', '' ];
		if ( Array.isArray( value ) && value.length === 2 ) {
			valueBetween = [
				toInputValue( value[ 0 ] ),
				toInputValue( value[ 1 ] ),
			];
		}
		return (
			<BetweenControls
				value={ valueBetween }
				onChange={ onChangeBetweenControls }
				hideLabelFromVision={ hideLabelFromVision }
				disabled={ disabled }
				step={ getStep( timeFormat, valueBetween ) }
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
			description={
				typeof description === 'string' ? description : undefined
			}
			details={
				typeof description === 'string' ? undefined : description
			}
			value={ toInputValue( value ) }
			onValueChange={ onChangeControl }
			hideLabelFromVision={ hideLabelFromVision }
			disabled={ disabled }
			step={ getStep( timeFormat, [ value ] ) }
			min={ min }
			max={ max }
		/>
	);
}
