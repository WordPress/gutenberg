/**
 * Internal dependencies
 */
import Swatch from '../swatch';

import { getGradientFromCSSColors } from './utils';

function DuotoneSwatch( { values } ) {
	return (
		<Swatch
			fill={ values && getGradientFromCSSColors( values, '135deg' ) }
		/>
	);
}

export default DuotoneSwatch;
