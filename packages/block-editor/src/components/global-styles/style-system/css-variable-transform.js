/**
 * External dependencies
 */
import flatten from 'flat';

export function getCssVariableValue( key ) {
	const prefix = '--wp-gs';
	const renamedKey = key.replace( /\./g, '-' );

	return `${ prefix }-${ renamedKey }`;
}

export function cssVariableTransform( state ) {
	const flattenedState = flatten( state );
	const keys = Object.keys( flattenedState );

	const cssVariableData = keys.reduce( ( data, key ) => {
		const value = flattenedState[ key ];
		const enhancedKey = getCssVariableValue( key );

		return {
			...data,
			[ enhancedKey ]: value,
		};
	}, {} );

	return cssVariableData;
}
