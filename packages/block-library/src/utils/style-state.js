import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { cleanEmptyObject, getStyleForState, setStyleForState } = unlock(
	blockEditorPrivateApis
);

/**
 * CSS default for aspect-ratio. Stored explicitly in viewport/pseudo style
 * states so resetting a state does not fall back to the default-state ratio.
 */
const DEFAULT_ASPECT_RATIO = 'auto';

function getStateStyle( style, selectedState ) {
	return getStyleForState( style, selectedState ) || {};
}

/**
 * When clearing aspect ratio under a style state, persist the CSS default
 * instead of removing the key so the state still overrides the base ratio.
 *
 * @param {Object} dimensions Dimension values being written to a style state.
 * @return {Object} Dimensions with cleared aspect ratio normalized to `auto`.
 */
function normalizeStateAspectRatio( dimensions ) {
	if (
		! dimensions ||
		! Object.prototype.hasOwnProperty.call( dimensions, 'aspectRatio' )
	) {
		return dimensions;
	}

	if (
		dimensions.aspectRatio === undefined ||
		dimensions.aspectRatio === null ||
		dimensions.aspectRatio === ''
	) {
		return {
			...dimensions,
			aspectRatio: DEFAULT_ASPECT_RATIO,
		};
	}

	return dimensions;
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
	const normalizedDimensions = normalizeStateAspectRatio( nextDimensions );

	return setStyleForState(
		style,
		selectedState,
		cleanEmptyObject( {
			...stateStyle,
			dimensions: cleanEmptyObject( {
				...stateStyle?.dimensions,
				...normalizedDimensions,
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

export function resetDimensions(
	style,
	keys,
	{ persistAspectRatioDefault = false } = {}
) {
	const dimensionsReset = Object.fromEntries(
		keys.map( ( key ) => [
			key,
			key === 'aspectRatio' && persistAspectRatioDefault
				? DEFAULT_ASPECT_RATIO
				: undefined,
		] )
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
		resetDimensions( getStateStyle( style, selectedState ), keys, {
			persistAspectRatioDefault: true,
		} )
	);
}

/**
 * Builds attribute updates that reset dimension values.
 *
 * When used from a dimensions `resetAllFilter`, pass
 * `hasSelectedStyleState: false` and set `persistAspectRatioDefault` from the
 * selected viewport instead. `scopeResetAllFilterToState` already scopes the
 * style slice; using the state-aware path again nests the viewport key.
 *
 * @param {Object}   options
 * @param {Object}   [options.attributes]                Block attributes.
 * @param {Object}   [options.style]                     Style object to reset. Defaults to `attributes.style`.
 * @param {Object}   options.selectedState               Currently selected viewport/pseudo style state.
 * @param {boolean}  options.hasSelectedStyleState       Whether a style state is currently selected.
 * @param {boolean}  [options.persistAspectRatioDefault] Store cleared aspect ratio as `auto`.
 * @param {string[]} options.keys                        Dimension keys to reset.
 * @param {Object}   [options.defaultAttributes]         Attribute defaults to merge in when no style state is selected.
 */
export function getDimensionResetAttributes( {
	attributes = {},
	style = attributes?.style,
	selectedState,
	hasSelectedStyleState,
	persistAspectRatioDefault = false,
	keys,
	defaultAttributes = {},
} ) {
	return {
		...( hasSelectedStyleState
			? {}
			: { ...attributes, ...defaultAttributes } ),
		style: hasSelectedStyleState
			? resetStateDimensions( style, selectedState, keys )
			: resetDimensions( style, keys, { persistAspectRatioDefault } ),
	};
}
