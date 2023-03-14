/**
 * Internal dependencies
 */
import CustomGradientBar from '../custom-gradient-picker/gradient-bar';

import {
	getColorStopsFromColors,
	getGradientFromCSSColors,
	getColorsFromColorStops,
} from './utils';

const PLACEHOLDER_VALUES = [ '#333', '#CCC' ];

export default function CustomDuotoneBar( {
	value,
	onChange,
}: {
	value?: string[];
	onChange: ( value?: string[] ) => void;
} ) {
	const hasGradient = !! value;
	const values = hasGradient ? value : PLACEHOLDER_VALUES;
	const background = getGradientFromCSSColors( values );
	const controlPoints = getColorStopsFromColors( values );
	return (
		// @ts-expect-error Resolve after CustomGradientBar is migrated to TypeScript
		<CustomGradientBar
			disableInserter
			background={ background }
			hasGradient={ hasGradient }
			value={ controlPoints }
			// @ts-expect-error Resolve after CustomGradientBar is migrated to TypeScript
			onChange={ ( newColorStops ) => {
				const newValue = getColorsFromColorStops( newColorStops );
				onChange( newValue );
			} }
		/>
	);
}
