/**
 * External dependencies
 */

import {
	difference,
	isEqual,
	pickBy,
	startsWith,
} from 'lodash';

const isAriaPropName = ( name ) =>
	startsWith( name, 'aria-' );

const getAriaKeys = ( props ) =>
	Object.keys( props ).filter( isAriaPropName );

export const pickAriaProps = ( props ) =>
	pickBy( props, ( value, key ) => isAriaPropName( key ) );

export const diffAriaProps = ( props, nextProps ) => {
	const prevAriaKeys = getAriaKeys( props );
	const nextAriaKeys = getAriaKeys( nextProps );
	const removedKeys = difference( prevAriaKeys, nextAriaKeys );
	const updatedKeys = nextAriaKeys.filter( ( key ) =>
		! isEqual( props[ key ], nextProps[ key ] ) );
	return { removedKeys, updatedKeys };
};
