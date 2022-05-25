/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	UnitControl as BaseUnitControl,
	ControlWrapper,
} from './styles/focal-point-picker-style';
import { fractionToPercentage } from './utils';

const TEXTCONTROL_MIN = 0;
const TEXTCONTROL_MAX = 100;

export default function FocalPointPickerControls( {
	onChange = noop,
	percentages = {
		x: 0.5,
		y: 0.5,
	},
} ) {
	const valueX = fractionToPercentage( percentages.x );
	const valueY = fractionToPercentage( percentages.y );

	const handleChange = ( value, axis ) => {
		const num = parseInt( value, 10 );

		if ( ! isNaN( num ) ) {
			onChange( { ...percentages, [ axis ]: num / 100 } );
		}
	};

	return (
		<ControlWrapper className="focal-point-picker__controls">
			<UnitControl
				label={ __( 'Left' ) }
				value={ [ valueX, '%' ].join( '' ) }
				onChange={ ( next ) => handleChange( next, 'x' ) }
				dragDirection="e"
			/>
			<UnitControl
				label={ __( 'Top' ) }
				value={ [ valueY, '%' ].join( '' ) }
				onChange={ ( next ) => handleChange( next, 'y' ) }
				dragDirection="s"
			/>
		</ControlWrapper>
	);
}

function UnitControl( props ) {
	return (
		<BaseUnitControl
			className="focal-point-picker__controls-position-unit-control"
			labelPosition="top"
			max={ TEXTCONTROL_MAX }
			min={ TEXTCONTROL_MIN }
			units={ [ { value: '%', label: '%' } ] }
			{ ...props }
		/>
	);
}
