/**
 * External dependencies
 */
import {
	kebabCase,
	reduce,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { hash, hashColor } from '@wordpress/utils';

export function generateClass( styleObject, prefix = '' ) {
	const hashString = hash( styleObject );
	return hashString ? prefix + hashString : undefined;
}

export function generateStyle( styleObject, className ) {
	if ( ! styleObject ) {
		return undefined;
	}
	const styleString = reduce( styleObject, ( memo, value, property ) => (
		value ? `${ memo }\n\t${ kebabCase( property ) }: ${ value };` : memo
	), '' );
	if ( ! styleString ) {
		return undefined;
	}
	const useClass = className || generateClass( styleObject );
	return {
		[ useClass ]: `.${ useClass } {${ styleString }\n}`,
	};
}

export function generateClassBackgroundColor( color ) {
	return color ? `background-color-${ hashColor( color ) }` : undefined;
}

export function generateStyleBackgroundColor( color, className ) {
	return color ? generateStyle( { backgroundColor: color }, className || generateClassBackgroundColor( color ) ) : undefined;
}

export function generateClassColor( color ) {
	return color ? `color-${ hashColor( color ) }` : undefined;
}

export function generateStyleColor( color, className ) {
	return color ? generateStyle( { color }, className || generateClassColor( color ) ) : undefined;
}
