/**
 * External dependencies
 */
import deepMerge from 'deepmerge';

/**
 * WordPress dependencies
 */
import {
	Flex,
	BaseControl,
	__experimentalNumberControl as CoreNumberControl,
	privateApis,
} from '@wordpress/components';
import { useCallback, useState, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { OPERATOR_BETWEEN } from '../constants';
import type { DataFormControlProps } from '../types';
import { unlock } from '../lock-unlock';

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
	prefix,
	suffix,
}: {
	value: NumberBetween;
	onChange: ( [ min, max ]: NumberBetween ) => void;
	hideLabelFromVision?: boolean;
	step?: 'any' | number;
	prefix: React.ReactNode;
	suffix: React.ReactNode;
} ) {
	const [ min = '', max = '' ] = value;
	let increment = 0;
	if ( typeof step === 'number' && step > 0 ) {
		increment = step;
	}

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
				<CoreNumberControl
					label={ __( 'Min.' ) }
					value={ min }
					max={ max ? Number( max ) - increment : undefined }
					onChange={ onChangeMin }
					__next40pxDefaultSize
					hideLabelFromVision={ hideLabelFromVision }
					step={ step }
					prefix={ prefix }
					suffix={ suffix }
				/>
				<CoreNumberControl
					label={ __( 'Max.' ) }
					value={ max }
					min={ min ? Number( min ) + increment : undefined }
					onChange={ onChangeMax }
					__next40pxDefaultSize
					hideLabelFromVision={ hideLabelFromVision }
					step={ step }
					prefix={ prefix }
					suffix={ suffix }
				/>
			</Flex>
		</BaseControl>
	);
}

export default function NumberControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
	config,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const { step = 'any', prefix, suffix } = config || {};
	const value = getValue( { item: data } ) ?? '';
	const [ customValidity, setCustomValidity ] =
		useState<
			React.ComponentProps<
				typeof ValidatedNumberControl
			>[ 'customValidity' ]
		>( undefined );

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

	const onValidateControl = useCallback(
		( newValue: any ) => {
			const message = field.isValid?.custom?.(
				deepMerge(
					data,
					setValue( {
						item: data,
						value: [ undefined, '', null ].includes( newValue )
							? undefined
							: Number( newValue ),
					} ) as Partial< Item >
				),
				field
			);

			if ( message ) {
				setCustomValidity( {
					type: 'invalid',
					message,
				} );
				return;
			}

			setCustomValidity( undefined );
		},
		[ data, field, setValue ]
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
				prefix={ prefix ? createElement( prefix ) : undefined }
				suffix={ suffix ? createElement( suffix ) : undefined }
			/>
		);
	}

	return (
		<ValidatedNumberControl
			required={ !! field.isValid?.required }
			onValidate={ onValidateControl }
			customValidity={ customValidity }
			label={ label }
			help={ description }
			value={ value }
			onChange={ onChangeControl }
			__next40pxDefaultSize
			hideLabelFromVision={ hideLabelFromVision }
			step={ step }
			prefix={ prefix ? createElement( prefix ) : undefined }
			suffix={ suffix ? createElement( suffix ) : undefined }
		/>
	);
}
