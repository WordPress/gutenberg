/**
 * Internal dependencies
 */
import RangeControlLegacy from './range-control';
import RangeControlNext from './range-control-next';

export function RangeControl( { next = true, ...props } ) {
	if ( next ) {
		return <RangeControlNext { ...props } />;
	}
	return <RangeControlLegacy { ...props } />;
}

export default RangeControl;
