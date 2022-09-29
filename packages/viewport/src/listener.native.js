/**
 * External dependencies
 */
import { Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store } from './store';

const matchWidth = ( operator, breakpoint ) => {
	const { width } = Dimensions.get( 'window' );
	if ( operator === 'max-width' ) {
		return width < breakpoint;
	} else if ( operator === 'min-width' ) {
		return width >= breakpoint;
	}
	throw new Error( `Unsupported viewport operator: ${ operator }` );
};

const addDimensionsEventListener = ( breakpoints, operators ) => {
	const setIsMatching = () => {
		const matches = Object.entries( breakpoints ).reduce(
			( result, [ name, width ] ) => {
				Object.entries( operators ).forEach(
					( [ operator, condition ] ) => {
						const key = [ operator, name ].join( ' ' );
						result[ key ] = matchWidth( condition, width );
					}
				);

				return result;
			},
			{}
		);

		dispatch( store ).setIsMatching( matches );
	};

	Dimensions.addEventListener( 'change', setIsMatching );

	// Set initial values.
	setIsMatching();
};

export default addDimensionsEventListener;
