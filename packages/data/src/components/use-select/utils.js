/**
 * WordPress dependencies
 */
import isShallowEqual from '@wordpress/is-shallow-equal';

const isEqual = ( valueA, valueB ) => {
	// test primitive first, we only care about valueA because if it's a primitive
	// we check for reference equality.
	if (
		typeof valueA !== 'object' ||
		valueA === null
	) {
		return valueA === valueB;
	}
	// not a primitive so let's do isShallowEqual
	return isShallowEqual( valueA, valueB );
};

export default isEqual;
