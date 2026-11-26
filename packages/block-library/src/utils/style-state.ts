import {
	getStyleForState,
	setStyleForState,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import type { BlockStyle, BlockStyleState } from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';
import type {
	ActiveDimensionValueOptions,
	DimensionResetOptions,
	Dimensions,
	DimensionUpdateOptions,
} from './types';

const { cleanEmptyObject } = unlock( blockEditorPrivateApis );

function getStateStyle(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState | undefined
): BlockStyle {
	return getStyleForState( style, selectedState ) || {};
}

function getMappedDimensions(
	dimensions: Dimensions,
	dimensionKeyMap: Record< string, string > = {}
): Dimensions {
	return Object.fromEntries(
		Object.entries( dimensions ).map( ( [ key, value ] ) => [
			dimensionKeyMap[ key ] || key,
			value,
		] )
	);
}

function getControlledDimensions(
	dimensions: Dimensions,
	dimensionKeys: string[] | undefined
): Dimensions {
	if ( ! dimensionKeys ) {
		return dimensions;
	}

	return Object.fromEntries(
		dimensionKeys.map( ( key ) => [ key, dimensions[ key ] ] )
	);
}

export function getStyleStateKey(
	selectedState: BlockStyleState | undefined
): string {
	return [
		selectedState?.viewport || 'default',
		selectedState?.pseudo || 'default',
	].join( ':' );
}

export function getStateDimensions(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState | undefined
): Dimensions {
	// Style attributes are not validated against a schema.
	return (
		( getStateStyle( style, selectedState )?.dimensions as
			Dimensions | undefined ) || {}
	);
}

export function getActiveDimensionValue(
	options: ActiveDimensionValueOptions = {}
): unknown {
	const {
		attributes = {},
		style = attributes?.style,
		selectedState,
		hasSelectedStyleState,
		attributeKey,
		styleKey = attributeKey,
		rootValue,
	} = options;

	// Callers always pass the key to read.
	if ( hasSelectedStyleState ) {
		return getStateDimensions( style, selectedState )?.[ styleKey! ];
	}

	if ( Object.hasOwn( options, 'rootValue' ) ) {
		return rootValue;
	}

	return attributes?.[ attributeKey! ];
}

export function setStateDimensions(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState | undefined,
	nextDimensions: Dimensions
): BlockStyle | undefined {
	const stateStyle = getStateStyle( style, selectedState );

	return setStyleForState(
		style,
		selectedState,
		cleanEmptyObject( {
			...stateStyle,
			dimensions: cleanEmptyObject( {
				...( stateStyle?.dimensions as Dimensions | undefined ),
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
}: DimensionUpdateOptions ): Dimensions | { style: BlockStyle | undefined } {
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

export function resetDimensions(
	style: BlockStyle | undefined,
	keys: string[]
): BlockStyle | undefined {
	const dimensionsReset = Object.fromEntries(
		keys.map( ( key ) => [ key, undefined ] )
	);

	return cleanEmptyObject( {
		...style,
		dimensions: cleanEmptyObject( {
			...( style?.dimensions as Dimensions | undefined ),
			...dimensionsReset,
		} ),
	} );
}

export function resetStateDimensions(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState | undefined,
	keys: string[]
): BlockStyle | undefined {
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
}: DimensionResetOptions ): Record< string, unknown > {
	return {
		...( hasSelectedStyleState
			? {}
			: { ...attributes, ...defaultAttributes } ),
		style: hasSelectedStyleState
			? resetStateDimensions( style, selectedState, keys )
			: resetDimensions( style, keys ),
	};
}
