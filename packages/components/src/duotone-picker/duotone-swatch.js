/**
 * Internal dependencies
 */
import Swatch from '../swatch';

import { getGradientFromCSSColors } from './utils';

function DuotoneSwatch( { values } ) {
	if ( typeof values === 'string' ) {
		return <Swatch />;
	}

	return (
		<Swatch
			fill={ values && getGradientFromCSSColors( values, '135deg' ) }
		/>
	);
}

export default DuotoneSwatch;
