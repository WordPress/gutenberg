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

function getStateStyle( style, selectedState, viewportState ) {
	return getStyleForState( style, selectedState, viewportState ) || {};
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

export function getStyleStateKey( selectedState, viewportState ) {
	return [
		viewportState || 'default',
		selectedState?.pseudo || 'default',
	].join( ':' );
}

export function getStateDimensions( style, selectedState, viewportState ) {
	return (
		getStateStyle( style, selectedState, viewportState )?.dimensions || {}
	);
}

export function getActiveDimensionValue( options = {} ) {
	const {
		attributes = {},
		style = attributes?.style,
		selectedState,
		viewportState,
		hasSelectedStyleState,
		attributeKey,
		styleKey = attributeKey,
		rootValue,
	} = options;

	if ( hasSelectedStyleState ) {
		return getStateDimensions( style, selectedState, viewportState )?.[
			styleKey
		];
	}

	if ( Object.hasOwn( options, 'rootValue' ) ) {
		return rootValue;
	}

	return attributes?.[ attributeKey ];
}

export function setStateDimensions(
	style,
	selectedState,
	viewportState,
	nextDimensions
) {
	const stateStyle = getStateStyle( style, selectedState, viewportState );

	return setStyleForState(
		style,
		selectedState,
		cleanEmptyObject( {
			...stateStyle,
			dimensions: cleanEmptyObject( {
				...stateStyle?.dimensions,
				...nextDimensions,
			} ),
		} ),
		viewportState
	);
}

export function getDimensionUpdateAttributes( {
	style,
	selectedState,
	viewportState,
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
			viewportState,
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

export function resetStateDimensions(
	style,
	selectedState,
	viewportState,
	keys
) {
	return setStyleForState(
		style,
		selectedState,
		resetDimensions(
			getStateStyle( style, selectedState, viewportState ),
			keys
		),
		viewportState
	);
}

export function getDimensionResetAttributes( {
	attributes = {},
	style = attributes?.style,
	selectedState,
	viewportState,
	hasSelectedStyleState,
	keys,
	defaultAttributes = {},
} ) {
	return {
		...( hasSelectedStyleState
			? {}
			: { ...attributes, ...defaultAttributes } ),
		style: hasSelectedStyleState
			? resetStateDimensions( style, selectedState, viewportState, keys )
			: resetDimensions( style, keys ),
	};
}
