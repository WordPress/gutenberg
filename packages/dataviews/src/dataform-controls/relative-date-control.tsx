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
import { OPERATOR_IN_THE_PAST, OPERATOR_OVER } from '../constants';

interface RelativeDateControlProps {
	id: string;
	value: { value?: string | number; unit?: string };
	onChange: ( value: any ) => void;
	label: string;
	hideLabelFromVision?: boolean;
	options: { value: string; label: string }[];
	className?: string;
}

export const TIME_UNITS_OPTIONS = {
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

export default function RelativeDateControl( {
	id,
	value,
	onChange,
	label,
	hideLabelFromVision,
	options,
	className,
}: RelativeDateControlProps ) {
	const { value: relValue = '', unit = options[ 0 ].value } = value;

	const onChangeValue = useCallback(
		( newValue: string | undefined ) =>
			onChange( {
				[ id ]: { value: Number( newValue ), unit },
			} ),
		[ id, onChange, unit ]
	);

	const onChangeUnit = useCallback(
		( newUnit: string | undefined ) =>
			onChange( {
				[ id ]: { value: relValue, unit: newUnit },
			} ),
		[ id, onChange, relValue ]
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
