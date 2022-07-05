/**
 * WordPress dependencies
 */
import { swatch } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import type { SwatchProps } from './types';

function Swatch( { fill }: SwatchProps ) {
	return fill ? (
		<span className="components-swatch" style={ { background: fill } } />
	) : (
		<Icon icon={ swatch } />
	);
}

export default Swatch;
