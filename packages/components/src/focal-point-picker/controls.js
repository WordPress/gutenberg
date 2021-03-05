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

	const handleOnXChange = ( next ) => {
		onChange( { ...percentages, x: parseInt( next ) / 100 } );
	};
	const handleOnYChange = ( next ) => {
		onChange( { ...percentages, y: parseInt( next ) / 100 } );
	};

	return (
		<ControlWrapper className="focal-point-picker__controls">
			<UnitControl
				label={ __( 'Left' ) }
				value={ valueX }
				onChange={ handleOnXChange }
				dragDirection="e"
			/>
			<UnitControl
				label={ __( 'Top' ) }
				value={ valueY }
				onChange={ handleOnYChange }
				dragDirection="s"
			/>
		</ControlWrapper>
	);
}

function UnitControl( props ) {
	return (
		<BaseUnitControl
			className="focal-point-picker__controls-position-unit-control"
			labelPosition="side"
			max={ TEXTCONTROL_MAX }
			min={ TEXTCONTROL_MIN }
			unit="%"
			units={ [ { value: '%', label: '%' } ] }
			{ ...props }
		/>
	);
}
