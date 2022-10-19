/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	StyledUnitControl,
	ControlWrapper,
} from './styles/focal-point-picker-style';
import { fractionToPercentage } from './utils';
import type {
	UnitControlProps,
	UnitControlOnChangeCallback,
} from '../unit-control/types';
import type { FocalPointAxis, FocalPointPickerControlsProps } from './types';

const TEXTCONTROL_MIN = 0;
const TEXTCONTROL_MAX = 100;
const noop = () => {};

export default function FocalPointPickerControls( {
	__nextHasNoMarginBottom,
	hasHelpText,
	onChange = noop,
	point = {
		x: 0.5,
		y: 0.5,
	},
}: FocalPointPickerControlsProps ) {
	const valueX = fractionToPercentage( point.x );
	const valueY = fractionToPercentage( point.y );

	const handleChange = (
		value: Parameters< UnitControlOnChangeCallback >[ 0 ],
		axis: FocalPointAxis
	) => {
		if ( value === undefined ) return;

		const num = parseInt( value, 10 );

		if ( ! isNaN( num ) ) {
			onChange( { ...point, [ axis ]: num / 100 } );
		}
	};

	return (
		<ControlWrapper
			className="focal-point-picker__controls"
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			hasHelpText={ hasHelpText }
		>
			<FocalPointUnitControl
				label={ __( 'Left' ) }
				value={ [ valueX, '%' ].join( '' ) }
				onChange={
					( ( next ) =>
						handleChange(
							next,
							'x'
						) ) as UnitControlOnChangeCallback
				}
				dragDirection="e"
			/>
			<FocalPointUnitControl
				label={ __( 'Top' ) }
				value={ [ valueY, '%' ].join( '' ) }
				onChange={
					( ( next ) =>
						handleChange(
							next,
							'y'
						) ) as UnitControlOnChangeCallback
				}
				dragDirection="s"
			/>
		</ControlWrapper>
	);
}

function FocalPointUnitControl( props: UnitControlProps ) {
	return (
		<StyledUnitControl
			className="focal-point-picker__controls-position-unit-control"
			labelPosition="top"
			max={ TEXTCONTROL_MAX }
			min={ TEXTCONTROL_MIN }
			units={ [ { value: '%', label: '%' } ] }
			{ ...props }
		/>
	);
}
