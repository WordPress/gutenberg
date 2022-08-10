/**
 * WordPress dependencies
 */
import { swatch } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import type { SwatchProps } from './types';

// This component will be deprecated. Use `ColorIndicator` instead.
// TODO: Consolidate this component with `ColorIndicator`.
function Swatch( { fill }: SwatchProps ) {
	return fill ? (
		<span className="components-swatch" style={ { background: fill } } />
	) : (
		<Icon icon={ swatch } />
	);
}

export default Swatch;
