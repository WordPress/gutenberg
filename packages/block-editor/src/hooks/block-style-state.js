/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';
import { getValueFromObjectPath, setImmutably } from '../utils/object';
import { DEFAULT_STATE_VALUE, hasStyleStateValue } from '../utils/style-states';

/**
 * Returns the style object path for the selected block style state.
 *
 * @param {Object} selectedState Selected block style state.
 * @return {string[]} Object path for the selected state styles.
 */
function getStyleStatePath( selectedState ) {
	if ( ! hasStyleStateValue( selectedState ) ) {
		return [];
	}

	return [ selectedState.viewport, selectedState.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	);
}

export function getStyleForState( style, selectedState ) {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return style;
	}
	return getValueFromObjectPath( style, path );
}

export function setStyleForState( style, selectedState, newStyle ) {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return cleanEmptyObject( newStyle );
	}
	return cleanEmptyObject( setImmutably( style, path, newStyle ) );
}

export function scopeResetAllFilterToState( selectedState, resetAllFilter ) {
	if ( ! resetAllFilter || ! hasStyleStateValue( selectedState ) ) {
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
