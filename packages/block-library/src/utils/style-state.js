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

function getMappedDimensions( dimensions, dimensionKeyMap = {} ) {
	return Object.fromEntries(
		Object.entries( dimensions ).map( ( [ key, value ] ) => [
			dimensionKeyMap[ key ] || key,
			value,
		] )
	);
}

function getControlledDimensions( dimensions, dimensionKeys ) {
	if ( ! dimensionKeys ) {
		return dimensions;
	}

	return Object.fromEntries(
		dimensionKeys.map( ( key ) => [ key, dimensions[ key ] ] )
	);
}

export function getStyleStateKey( selectedState ) {
	return [
		selectedState?.viewport || 'default',
		selectedState?.pseudo || 'default',
	].join( ':' );
}

export function getStateDimensions( style, selectedState ) {
	return getStateStyle( style, selectedState )?.dimensions || {};
}

export function getActiveDimensionValue( options = {} ) {
	const {
		attributes = {},
		style = attributes?.style,
		selectedState,
		hasSelectedStyleState,
		attributeKey,
		styleKey = attributeKey,
		rootValue,
	} = options;

	if ( hasSelectedStyleState ) {
		return getStateDimensions( style, selectedState )?.[ styleKey ];
	}

	if ( Object.hasOwn( options, 'rootValue' ) ) {
		return rootValue;
	}

	return attributes?.[ attributeKey ];
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

export function getDimensionUpdateAttributes( {
	style,
	selectedState,
	hasSelectedStyleState,
	nextDimensions,
	dimensionKeyMap,
	dimensionKeys,
} ) {
	const controlledDimensions = getControlledDimensions(
		nextDimensions,
		dimensionKeys
	);

	if ( ! hasSelectedStyleState ) {
		return controlledDimensions;
	}

	return {
		style: setStateDimensions(
			style,
			selectedState,
			getMappedDimensions( controlledDimensions, dimensionKeyMap )
		),
	};
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

export function getDimensionResetAttributes( {
	attributes = {},
	style = attributes?.style,
	selectedState,
	hasSelectedStyleState,
	keys,
	defaultAttributes = {},
} ) {
	return {
		...( hasSelectedStyleState
			? {}
			: { ...attributes, ...defaultAttributes } ),
		style: hasSelectedStyleState
			? resetStateDimensions( style, selectedState, keys )
			: resetDimensions( style, keys ),
	};
}
