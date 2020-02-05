/**
 * Internal dependencies
 */
import { Button } from '../../styled-primitives/button';
/**
 * External dependencies
 */
import { css } from '@emotion/core';

const allowedStates = [
	'focus',
	'active',
	'enabled',
	'hover',
	'disabled',
	'visited',
];

const checkStates = ( statesString ) => {
	const splitStates = statesString.split( ':' );
	for ( let i = 0; i < splitStates.length; i++ ) {
		if ( ! allowedStates.includes( splitStates[ i ] ) ) {
			return false;
		}
	}
	return true;
};

const stringStylesFromObjectStyles = ( objectStyles ) => {
	let styles = '';
	Object.entries( objectStyles ).forEach( ( [ key, value ] ) => {
		styles += `
  ${ key }: ${ value };`;
	} );
	return styles;
};

const getCssForAdditionalStyles = ( additionalStyles ) => {
	let styles = ``;
	additionalStyles.forEach( ( record ) => {
		if ( record.states === '' ) {
			styles += `${ stringStylesFromObjectStyles( record.styles ) }`;
		}
		if ( checkStates( record.states ) ) {
			styles += `
&:${ record.states } {${ stringStylesFromObjectStyles( record.styles ) }
}
			`;
		}
	} );
	return styles;
};

export default function PrimitiveButton( {
	additionalStyles = [],
	children,
	...props
} ) {
	const styles = getCssForAdditionalStyles( additionalStyles );
	return (
		<Button { ...props } css={ css`${ styles }` }>
			{ children }
		</Button>
	);
}
