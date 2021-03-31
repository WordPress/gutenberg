/**
 * Internal dependencies
 */
import Swatch from '../swatch';

import { getGradientFromValues } from './utils';

function DuotoneSwatch( { values } ) {
	return (
		<Swatch fill={ values && getGradientFromValues( values, '135deg' ) } />
	);
}

export default DuotoneSwatch;
