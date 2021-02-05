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

export default function CustomDuotoneBar( { value, onChange } ) {
	const background = getGradientFromValues( value?.values );
	const controlPoints = getColorStopsFromValues( value?.values );
	const hasGradient = !! background;
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
