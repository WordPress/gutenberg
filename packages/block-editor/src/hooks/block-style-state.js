import { createContext, useContext } from '@wordpress/element';
import { cleanEmptyObject } from './utils';
import { getValueFromObjectPath, setImmutably } from '../utils/object';

const DEFAULT_STATE_VALUE = 'default';

export const DEFAULT_BLOCK_STYLE_STATE = {
	viewport: DEFAULT_STATE_VALUE,
	pseudo: DEFAULT_STATE_VALUE,
};

const BlockStyleStateContext = createContext( DEFAULT_BLOCK_STYLE_STATE );

export const BlockStyleStateProvider = BlockStyleStateContext.Provider;

/**
 * Returns the current block style state.
 *
 * @return {Object} The current block style state.
 */
export function useBlockStyleState() {
	return useContext( BlockStyleStateContext );
}

/**
 * Returns true when a viewport style state is selected.
 *
 * @param {Object} selectedState Selected block style state.
 * @return {boolean} Whether a viewport state is selected.
 */
export function hasViewportBlockStyleState( selectedState ) {
	return (
		!! selectedState?.viewport &&
		selectedState.viewport !== DEFAULT_STATE_VALUE
	);
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
 * @param {Object} selectedState Selected block style state.
 * @return {boolean} Whether the default style state is selected.
 */
export function isDefaultBlockStyleState( selectedState ) {
	return (
		! hasViewportBlockStyleState( selectedState ) &&
		! hasPseudoBlockStyleState( selectedState )
	);
}

/**
 * Returns the style object path for the selected block style state.
 *
 * @param {Object} selectedState Selected block style state.
 * @return {string[]} Object path for the selected state styles.
 */
function getStyleStatePath( selectedState ) {
	if ( isDefaultBlockStyleState( selectedState ) ) {
		return [];
	}

	return [ selectedState.viewport, selectedState.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns the style object for the selected block style state.
 *
 * @param {Object} style         The block style object.
 * @param {Object} selectedState Selected block style state.
 * @return {Object} The style object for the selected state, if found.
 */
export function getStyleForState( style, selectedState ) {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return style;
	}
	return getValueFromObjectPath( style, path );
}

/**
 * Returns a style object with the selected block style state updated.
 *
 * @param {Object} style         The block style object.
 * @param {Object} selectedState Selected block style state.
 * @param {Object} newStyle      New style for the selected state.
 * @return {Object} The updated style object.
 */
export function setStyleForState( style, selectedState, newStyle ) {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return cleanEmptyObject( newStyle );
	}
	return cleanEmptyObject( setImmutably( style, path, newStyle ) );
}

export function scopeResetAllFilterToState( selectedState, resetAllFilter ) {
	if ( ! resetAllFilter || isDefaultBlockStyleState( selectedState ) ) {
		return resetAllFilter;
	}

	return ( attributes ) => {
		const existingStateStyle =
			getStyleForState( attributes?.style, selectedState ) || {};
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
				updatedStateStyle
			),
		};
	};
}
