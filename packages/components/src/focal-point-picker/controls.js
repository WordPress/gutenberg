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
	ControlLabel,
	ControlField,
	UnitControl as BaseUnitControl,
	ControlWrapper,
} from './styles/focal-point-picker-style';
import { fractionToPercentage } from './utils';

const TEXTCONTROL_MIN = 0;
const TEXTCONTROL_MAX = 100;

export default function FocalPointPickerControls( {
	onHorizontalChange = noop,
	onVerticalChange = noop,
	percentages = {
		x: 0.5,
		y: 0.5,
	},
} ) {
	const valueX = fractionToPercentage( percentages.x );
	const valueY = fractionToPercentage( percentages.y );

	return (
		<ControlWrapper className="focal-point-picker__controls">
			<ControlField
				className="focal-point-picker__controls-position"
				justify="left"
			>
				<ControlLabel>{ __( 'Position' ) }</ControlLabel>
				<ControlField justify="left">
					<UnitControl
						label={ __( 'Left' ) }
						value={ valueX }
						onChange={ onHorizontalChange }
						dragDirection="e"
					/>
					<UnitControl
						label={ __( 'Top' ) }
						value={ valueY }
						onChange={ onVerticalChange }
						dragDirection="s"
					/>
				</ControlField>
			</ControlField>
		</ControlWrapper>
	);
}

function UnitControl( props ) {
	return (
		<BaseUnitControl
			className="focal-point-picker__controls-position-unit-control"
			isFloatingLabel
			max={ TEXTCONTROL_MAX }
			min={ TEXTCONTROL_MIN }
			unit="%"
			units={ [ { value: '%', label: '%' } ] }
			{ ...props }
		/>
	);
}
