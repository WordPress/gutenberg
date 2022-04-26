/**
 * WordPress dependencies
 */
import {
	RangeControl,
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalUseCustomUnits as useCustomUnits,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AllInputControl from './all-input-control';
import InputControls from './input-controls';
import LinkedButton from './linked-button';
import useSetting from '../use-setting';
import {
	getAllValue,
	getAllUnit,
	hasDefinedValues,
	hasMixedValues,
} from './utils';

const DEFAULT_VALUES = {
	topLeft: null,
	topRight: null,
	bottomLeft: null,
	bottomRight: null,
};
const MIN_BORDER_RADIUS_VALUE = 0;
const MAX_BORDER_RADIUS_VALUES = {
	px: 100,
	em: 20,
	rem: 20,
};

/**
 * Control to display border radius options.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onChange Callback to handle onChange.
 * @param {Object}   props.values   Border radius values.
 *
 * @return {WPElement}              Custom border radius control.
 */
export default function BorderRadiusControl( { onChange, values } ) {
	const [ isLinked, setIsLinked ] = useState(
		! hasDefinedValues( values ) || ! hasMixedValues( values )
	);

	const units = useCustomUnits( {
		availableUnits: useSetting( 'spacing.units' ) || [ 'px', 'em', 'rem' ],
	} );

	const unit = getAllUnit( values );
	const unitConfig = units && units.find( ( item ) => item.value === unit );
	const step = unitConfig?.step || 1;

	const [ allValue ] = parseQuantityAndUnitFromRawValue(
		getAllValue( values )
	);

	const toggleLinked = () => setIsLinked( ! isLinked );

	const handleSliderChange = ( next ) => {
		onChange( next !== undefined ? `${ next }${ unit }` : undefined );
	};

	return (
		<fieldset className="components-border-radius-control">
			<legend>{ __( 'Radius' ) }</legend>
			<div className="components-border-radius-control__wrapper">
				{ isLinked ? (
					<>
						<AllInputControl
							className="components-border-radius-control__unit-control"
							values={ values }
							min={ MIN_BORDER_RADIUS_VALUE }
							onChange={ onChange }
							units={ units }
						/>
						<RangeControl
							className="components-border-radius-control__range-control"
							value={ allValue ?? '' }
							min={ MIN_BORDER_RADIUS_VALUE }
							max={ MAX_BORDER_RADIUS_VALUES[ unit ] }
							initialPosition={ 0 }
							withInputField={ false }
							onChange={ handleSliderChange }
							step={ step }
						/>
					</>
				) : (
					<InputControls
						min={ MIN_BORDER_RADIUS_VALUE }
						onChange={ onChange }
						values={ values || DEFAULT_VALUES }
						units={ units }
					/>
				) }
				<LinkedButton onClick={ toggleLinked } isLinked={ isLinked } />
			</div>
		</fieldset>
	);
}
