/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import { getValueFromObjectPath, setImmutably } from '../utils/object';

const DEFAULT_STATE_VALUE = 'default';

export const DEFAULT_VIEWPORT = 'default';

export const DEFAULT_BLOCK_STYLE_STATE = {
	pseudo: DEFAULT_STATE_VALUE,
};

const DEFAULT_BLOCK_STYLE_STATE_CONTEXT = {
	selectedState: DEFAULT_BLOCK_STYLE_STATE,
	viewportState: DEFAULT_VIEWPORT,
};

const BlockStyleStateContext = createContext(
	DEFAULT_BLOCK_STYLE_STATE_CONTEXT
);

export const BlockStyleStateProvider = BlockStyleStateContext.Provider;

/**
 * Returns the selected block style state context.
 *
 * The per-block pseudo state and the globally selected viewport are tracked
 * separately but provided together so a single subscription exposes both.
 *
 * @return {{selectedState: Object, viewportState: string}} The selected pseudo
 *                                                           state and viewport.
 */
export function useBlockStyleState() {
	return useContext( BlockStyleStateContext );
}

/**
 * Returns true when a viewport state is selected.
 *
 * The viewport state is global, so this takes the viewport value directly
 * rather than a per-block style state object.
 *
 * @param {string} viewportState Selected viewport state.
 * @return {boolean} Whether a viewport state is selected.
 */
export function hasViewportState( viewportState ) {
	return !! viewportState && viewportState !== DEFAULT_VIEWPORT;
}

/**
 * Returns true when a pseudo style state is selected.
 *
 * @param {Object} selectedState Selected block style state.
 * @return {boolean} Whether a pseudo state is selected.
 */
export function hasPseudoBlockStyleState( selectedState ) {
	return (
		!! selectedState?.pseudo && selectedState.pseudo !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns true when the default style state is selected.
 *
 * The viewport state is global and tracked separately from the per-block
 * pseudo state, so it is passed as its own argument.
 *
 * @param {Object} selectedState   Selected per-block pseudo style state.
 * @param {string} [viewportState] Selected viewport state.
 * @return {boolean} Whether the default style state is selected.
 */
export function isDefaultBlockStyleState( selectedState, viewportState ) {
	return (
		! hasPseudoBlockStyleState( selectedState ) &&
		! hasViewportState( viewportState )
	);
}

/**
 * Returns the style object path for the selected block style state.
 *
 * @param {Object} selectedState   Selected per-block pseudo style state.
 * @param {string} [viewportState] Selected viewport state.
 * @return {string[]} Object path for the selected state styles.
 */
function getStyleStatePath( selectedState, viewportState ) {
	if ( isDefaultBlockStyleState( selectedState, viewportState ) ) {
		return [];
	}

	return [ viewportState, selectedState?.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	);
}

export function getStyleForState( style, selectedState, viewportState ) {
	const path = getStyleStatePath( selectedState, viewportState );
	if ( ! path.length ) {
		return style;
	}
	return getValueFromObjectPath( style, path );
}

export function setStyleForState(
	style,
	selectedState,
	newStyle,
	viewportState
) {
	const path = getStyleStatePath( selectedState, viewportState );
	if ( ! path.length ) {
		return cleanEmptyObject( newStyle );
	}
	return cleanEmptyObject( setImmutably( style, path, newStyle ) );
}

export function scopeResetAllFilterToState(
	selectedState,
	viewportState,
	resetAllFilter
) {
	if (
		! resetAllFilter ||
		isDefaultBlockStyleState( selectedState, viewportState )
	) {
		return resetAllFilter;
	}

	return ( attributes ) => {
		const existingStateStyle =
			getStyleForState(
				attributes?.style,
				selectedState,
				viewportState
			) || {};
		const updatedStateAttributes = resetAllFilter( {
			style: existingStateStyle,
		} );
		const updatedStateStyle =
			updatedStateAttributes &&
			typeof updatedStateAttributes === 'object' &&
			! Array.isArray( updatedStateAttributes ) &&
			Object.prototype.hasOwnProperty.call(
				updatedStateAttributes,
				'style'
			)
				? updatedStateAttributes.style
				: updatedStateAttributes;

		return {
			style: setStyleForState(
				attributes?.style,
				selectedState,
				updatedStateStyle,
				viewportState
			),
		};
	};
}
