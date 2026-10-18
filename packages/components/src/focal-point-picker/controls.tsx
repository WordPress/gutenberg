import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { Flex } from '../flex';
import UnitControl from '../unit-control';
import styles from './style.module.scss';
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
		if ( value === undefined ) {
			return;
		}

		const num = parseInt( value, 10 );

		if ( ! isNaN( num ) ) {
			onChange( { ...point, [ axis ]: num / 100 } );
		}
	};

	return (
		<Flex
			className={ clsx( styles.controls, 'focal-point-picker__controls', {
				[ styles[ 'has-help-text' ] ]: hasHelpText,
			} ) }
			gap={ 4 }
		>
			<FocalPointUnitControl
				label={ __( 'Left' ) }
				aria-label={ __( 'Focal point left position' ) }
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
				aria-label={ __( 'Focal point top position' ) }
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
		</Flex>
	);
}

function FocalPointUnitControl( props: UnitControlProps ) {
	return (
		<UnitControl
			className={ clsx(
				styles[ 'unit-control' ],
				'focal-point-picker__controls-position-unit-control'
			) }
			labelPosition="top"
			max={ TEXTCONTROL_MAX }
			min={ TEXTCONTROL_MIN }
			units={ [ { value: '%', label: '%' } ] }
			{ ...props }
		/>
	);
}
