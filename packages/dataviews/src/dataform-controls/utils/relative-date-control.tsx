/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	BaseControl,
	SelectControl,
	__experimentalNumberControl as NumberControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../../constants';
import type { DataFormControlProps } from '../../types';

type VALID_OPERATORS = 'inThePast' | 'over';

interface TimeUnitOption {
	value: string;
	label: string;
}

const TIME_UNITS_OPTIONS: Record< VALID_OPERATORS, TimeUnitOption[] > = {
	[ OPERATOR_IN_THE_PAST ]: [
		{ value: 'days', label: __( 'Days' ) },
		{ value: 'weeks', label: __( 'Weeks' ) },
		{ value: 'months', label: __( 'Months' ) },
		{ value: 'years', label: __( 'Years' ) },
	],
	[ OPERATOR_OVER ]: [
		{ value: 'days', label: __( 'Days ago' ) },
		{ value: 'weeks', label: __( 'Weeks ago' ) },
		{ value: 'months', label: __( 'Months ago' ) },
		{ value: 'years', label: __( 'Years ago' ) },
	],
};

export default function RelativeDateControl< Item >( {
	className,
	data,
	field,
	onChange,
	hideLabelFromVision,
	operator,
}: DataFormControlProps< Item > & {
	className: string;
} ) {
	const options: TimeUnitOption[] =
		TIME_UNITS_OPTIONS[
			operator === OPERATOR_IN_THE_PAST ? 'inThePast' : 'over'
		];

	const { id, label, getValue, setValue } = field;
	const fieldValue = getValue( { item: data } );
	const { value: relValue = '', unit = options[ 0 ].value } =
		fieldValue && typeof fieldValue === 'object' ? fieldValue : {};

	const onChangeValue = useCallback(
		( newValue: string | undefined ) =>
			onChange(
				setValue( {
					item: data,
					value: { value: Number( newValue ), unit },
				} )
			),
		[ onChange, setValue, data, unit ]
	);

	const onChangeUnit = useCallback(
		( newUnit: string | undefined ) =>
			onChange(
				setValue( {
					item: data,
					value: { value: relValue, unit: newUnit },
				} )
			),
		[ onChange, setValue, data, relValue ]
	);

	return (
		<BaseControl
			id={ id }
			__nextHasNoMarginBottom
			className={ clsx( className, 'dataviews-controls__relative-date' ) }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
		>
			<HStack spacing={ 2.5 }>
				<NumberControl
					__next40pxDefaultSize
					className="dataviews-controls__relative-date-number"
					spinControls="none"
					min={ 1 }
					step={ 1 }
					value={ relValue }
					onChange={ onChangeValue }
				/>
				<SelectControl
					className="dataviews-controls__relative-date-unit"
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Unit' ) }
					value={ unit }
					options={ options }
					onChange={ onChangeUnit }
					hideLabelFromVision
				/>
			</HStack>
		</BaseControl>
	);
}
