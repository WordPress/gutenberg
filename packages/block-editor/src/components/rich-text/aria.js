/**
 * External dependencies
 */

import {
	isNil,
	pickBy,
	startsWith,
} from 'lodash';

export const pickAriaProps = ( props ) =>
	pickBy( props, ( value, key ) =>
		startsWith( key, 'aria-' ) && ! isNil( value )
	);
