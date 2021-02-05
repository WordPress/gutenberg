/**
 * WordPress dependencies
 */
import { __experimentalCustomGradientBar as CustomGradientBar } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getColorStopsFromValues,
	getCustomDuotoneIdFromColorStops,
	getGradientFromValues,
	getValuesFromColorStops,
} from './utils';

const PLACEHOLDER_VALUES = {
	r: [ 0.2, 0.8 ],
	g: [ 0.2, 0.8 ],
	b: [ 0.2, 0.8 ],
};

export default function CustomDuotoneBar( { value, onChange } ) {
	const hasGradient = !! value?.values;
	const values = hasGradient ? value.values : PLACEHOLDER_VALUES;
	const background = getGradientFromValues( values );
	const controlPoints = getColorStopsFromValues( values );
	return (
		<div className="components-custom-duotone-picker">
			<CustomGradientBar
				disableInserter
				background={ background }
				hasGradient={ hasGradient }
				value={ controlPoints }
				onChange={ ( newColorStops ) => {
					const newDuotone = {
						id: getCustomDuotoneIdFromColorStops( newColorStops ),
						values: getValuesFromColorStops( newColorStops ),
					};
					onChange( newDuotone );
				} }
			/>
		</div>
	);
}
