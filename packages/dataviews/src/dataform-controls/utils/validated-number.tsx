/**
 * WordPress dependencies
 */
import {
	Flex,
	BaseControl,
	__experimentalNumberControl as NumberControl,
	privateApis,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { OPERATOR_BETWEEN } from '../../constants';
import type { DataFormControlProps } from '../../types';
import { unlock } from '../../lock-unlock';
import getCustomValidity from './get-custom-validity';

const { ValidatedNumberControl } = unlock( privateApis );

type NumberBetween = [ number | string, number | string ];

function toNumberOrEmpty( value?: string ) {
	if ( value === '' || value === undefined ) {
		return '';
	}
	const number = Number( value );
	return Number.isFinite( number ) ? number : '';
}

function BetweenControls( {
	value,
	onChange,
	hideLabelFromVision,
	step,
}: {
	value: NumberBetween;
	onChange: ( [ min, max ]: NumberBetween ) => void;
	hideLabelFromVision?: boolean;
	step: number;
} ) {
	const [ min = '', max = '' ] = value;

	const onChangeMin = useCallback(
		( newValue: string | undefined ) =>
			onChange( [ toNumberOrEmpty( newValue ), max ] ),
		[ onChange, max ]
	);

	const onChangeMax = useCallback(
		( newValue: string | undefined ) =>
			onChange( [ min, toNumberOrEmpty( newValue ) ] ),
		[ onChange, min ]
	);

	return (
		<BaseControl
			__nextHasNoMarginBottom
			help={ __( 'The max. value must be greater than the min. value.' ) }
		>
			<Flex direction="row" gap={ 4 }>
				<NumberControl
					label={ __( 'Min.' ) }
					value={ min }
					max={ max ? Number( max ) - step : undefined }
					onChange={ onChangeMin }
					__next40pxDefaultSize
					hideLabelFromVision={ hideLabelFromVision }
					step={ step }
				/>
				<NumberControl
					label={ __( 'Max.' ) }
					value={ max }
					min={ min ? Number( min ) + step : undefined }
					onChange={ onChangeMax }
					__next40pxDefaultSize
					hideLabelFromVision={ hideLabelFromVision }
					step={ step }
				/>
			</Flex>
		</BaseControl>
	);
}

export type DataFormValidatedNumberControlProps< Item > =
	DataFormControlProps< Item > & {
		/**
		 * Number of decimals, acceps non-negative integer.
		 */
		decimals: number;
	};

export default function ValidatedNumber< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
	decimals,
	validity,
}: DataFormValidatedNumberControlProps< Item > ) {
	const step = Math.pow( 10, Math.abs( decimals ) * -1 );
	const { label, description, getValue, setValue, isValid } = field;
	const value = getValue( { item: data } ) ?? '';

	const onChangeControl = useCallback(
		( newValue: string | undefined ) => {
			onChange(
				setValue( {
					item: data,
					// Do not convert an empty string or undefined to a number,
					// otherwise there's a mismatch between the UI control (empty)
					// and the data relied by onChange (0).
					value: [ '', undefined ].includes( newValue )
						? undefined
						: Number( newValue ),
				} )
			);
		},
		[ data, onChange, setValue ]
	);

	const onChangeBetweenControls = useCallback(
		( newValue: NumberBetween ) => {
			onChange(
				setValue( {
					item: data,
					value: newValue,
				} )
			);
		},
		[ data, onChange, setValue ]
	);

	if ( operator === OPERATOR_BETWEEN ) {
		let valueBetween: NumberBetween = [ '', '' ];
		if (
			Array.isArray( value ) &&
			value.length === 2 &&
			value.every(
				( element ) => typeof element === 'number' || element === ''
			)
		) {
			valueBetween = value as NumberBetween;
		}
		return (
			<BetweenControls
				value={ valueBetween }
				onChange={ onChangeBetweenControls }
				hideLabelFromVision={ hideLabelFromVision }
				step={ step }
			/>
		);
	}

	return (
		<ValidatedNumberControl
			required={ !! isValid?.required }
			customValidity={ getCustomValidity( isValid, validity ) }
			label={ label }
			help={ description }
			value={ value }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			hideLabelFromVision={ hideLabelFromVision }
			step={ step }
		/>
	);
}
