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
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import i18n from '@wordpress/dataviews-i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../../../constants';
import type { DataFormControlProps } from '../../../types';

type VALID_OPERATORS = 'inThePast' | 'over';

interface TimeUnitOption {
	value: string;
	label: string;
}

const TIME_UNITS_OPTIONS: Record< VALID_OPERATORS, TimeUnitOption[] > = {
	[ OPERATOR_IN_THE_PAST ]: [
		{ value: 'days', label: i18n.DAYS() },
		{ value: 'weeks', label: i18n.WEEKS() },
		{ value: 'months', label: i18n.MONTHS() },
		{ value: 'years', label: i18n.YEARS() },
	],
	[ OPERATOR_OVER ]: [
		{ value: 'days', label: i18n.DAYS_AGO() },
		{ value: 'weeks', label: i18n.WEEKS_AGO() },
		{ value: 'months', label: i18n.MONTHS_AGO() },
		{ value: 'years', label: i18n.YEARS_AGO() },
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

	const { id, label, description, getValue, setValue } = field;
	const disabled = field.isDisabled( { item: data, field } );
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
			className={ clsx( className, 'dataviews-controls__relative-date' ) }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			help={ description }
		>
			<Stack direction="row" gap="sm">
				<NumberControl
					className="dataviews-controls__relative-date-number"
					spinControls="none"
					min={ 1 }
					step={ 1 }
					value={ relValue }
					onChange={ onChangeValue }
					disabled={ disabled }
				/>
				<SelectControl
					className="dataviews-controls__relative-date-unit"
					label={ i18n.UNIT() }
					value={ unit }
					options={ options }
					onChange={ onChangeUnit }
					hideLabelFromVision
					disabled={ disabled }
				/>
			</Stack>
		</BaseControl>
	);
}
