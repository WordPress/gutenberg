/**
 * External dependencies
 */

import {
	pickBy,
	startsWith,
} from 'lodash';

const isAriaPropName = ( name ) =>
	startsWith( name, 'aria-' );

export const getAriaKeys = ( props ) =>
	Object.keys( props ).filter( isAriaPropName );

export const pickAriaProps = ( props ) =>
	pickBy( props, ( value, key ) => isAriaPropName( key ) );
