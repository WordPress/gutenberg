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
	const operatorEntries = Object.entries( operators );
	const breakpointEntries = Object.entries( breakpoints );

	const setIsMatching = () => {
		const matches = Object.fromEntries(
			breakpointEntries.flatMap( ( [ name, width ] ) => {
				return operatorEntries.map( ( [ operator, condition ] ) => [
					`${ operator } ${ name }`,
					matchWidth( condition, width ),
				] );
			} )
		);

		dispatch( store ).setIsMatching( matches );
	};

	Dimensions.addEventListener( 'change', setIsMatching );

	// Set initial values.
	setIsMatching();
};

export default addDimensionsEventListener;
