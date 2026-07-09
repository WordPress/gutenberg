/**
 * Internal dependencies
 */
import {
	cleanEmptyObject,
	getValueFromObjectPath,
	setImmutably,
} from './object';

export const DEFAULT_STATE_VALUE = 'default';

/**
 * Returns true when a viewport style state value is non-default.
 *
 * @param {Object} styleState Style state value.
 * @return {boolean} Whether a viewport state value is non-default.
 */
export function hasViewportStyleStateValue( styleState ) {
	return (
		!! styleState?.viewport && styleState.viewport !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns true when a pseudo style state value is non-default.
 *
 * @param {Object} styleState Style state value.
 * @return {boolean} Whether a pseudo state value is non-default.
 */
export function hasPseudoStyleStateValue( styleState ) {
	return !! styleState?.pseudo && styleState.pseudo !== DEFAULT_STATE_VALUE;
}

/**
 * Returns true when any style state value is non-default.
 *
 * @param {Object} styleState Style state value.
 * @return {boolean} Whether any state value is non-default.
 */
export function hasStyleStateValue( styleState ) {
	return Object.values( styleState ?? {} ).some(
		( value ) => value && value !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns the style object path for the provided style state.
 *
 * @param {Object} styleState Style state value.
 * @return {string[]} Object path for the style state.
 */
function getStyleStatePath( styleState ) {
	if ( ! hasStyleStateValue( styleState ) ) {
		return [];
	}

	return [ styleState.viewport, styleState.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns the style object value for the provided style state.
 *
 * @param {Object} style      Block style object.
 * @param {Object} styleState Style state value.
 * @return {Object|undefined} Style object value for the state.
 */
export function getStyleForState( style, styleState ) {
	const path = getStyleStatePath( styleState );
	if ( ! path.length ) {
		return style;
	}
	return getValueFromObjectPath( style, path );
}

/**
 * Sets the style object value for the provided style state.
 *
 * @param {Object} style      Block style object.
 * @param {Object} styleState Style state value.
 * @param {Object} newStyle   New style object value for the state.
 * @return {Object|undefined} Updated block style object.
 */
export function setStyleForState( style, styleState, newStyle ) {
	const path = getStyleStatePath( styleState );
	if ( ! path.length ) {
		return cleanEmptyObject( newStyle );
	}
	return cleanEmptyObject( setImmutably( style, path, newStyle ) );
}

/**
 * Scopes a reset-all filter to the provided style state.
 *
 * @param {Object}   styleState     Style state value.
 * @param {Function} resetAllFilter Reset-all filter to scope.
 * @return {Function|undefined} Scoped reset-all filter.
 */
export function scopeResetAllFilterToState( styleState, resetAllFilter ) {
	if ( ! resetAllFilter || ! hasStyleStateValue( styleState ) ) {
		return resetAllFilter;
	}

	return ( attributes ) => {
		const existingStateStyle =
			getStyleForState( attributes?.style, styleState ) || {};
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
				styleState,
				updatedStateStyle
			),
		};
	};
}
