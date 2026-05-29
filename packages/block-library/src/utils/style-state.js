/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

const { cleanEmptyObject, getStyleForState, setStyleForState } = unlock(
	blockEditorPrivateApis
);

function getStateStyle( style, selectedState ) {
	return getStyleForState( style, selectedState ) || {};
}

export function getStateDimensions( style, selectedState ) {
	return getStateStyle( style, selectedState )?.dimensions || {};
}

export function setStateDimensions( style, selectedState, nextDimensions ) {
	const stateStyle = getStateStyle( style, selectedState );

	return setStyleForState(
		style,
		selectedState,
		cleanEmptyObject( {
			...stateStyle,
			dimensions: cleanEmptyObject( {
				...stateStyle?.dimensions,
				...nextDimensions,
			} ),
		} )
	);
}

export function resetDimensions( style, keys ) {
	const dimensionsReset = Object.fromEntries(
		keys.map( ( key ) => [ key, undefined ] )
	);

	return cleanEmptyObject( {
		...style,
		dimensions: cleanEmptyObject( {
			...style?.dimensions,
			...dimensionsReset,
		} ),
	} );
}

export function resetStateDimensions( style, selectedState, keys ) {
	return setStyleForState(
		style,
		selectedState,
		resetDimensions( getStateStyle( style, selectedState ), keys )
	);
}
