/**
 * WordPress dependencies
 */
import { createContext, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { cleanEmptyObject } from './utils';

export const DEFAULT_BLOCK_STYLE_STATE = 'default';

const BlockStyleStateContext = createContext( DEFAULT_BLOCK_STYLE_STATE );

export const BlockStyleStateProvider = BlockStyleStateContext.Provider;

export function useBlockStyleState() {
	return useContext( BlockStyleStateContext );
}

export function getStyleForState( style, selectedState ) {
	if ( ! selectedState || selectedState === DEFAULT_BLOCK_STYLE_STATE ) {
		return style;
	}
	return style?.[ selectedState ];
}

export function setStyleForState( style, selectedState, newStyle ) {
	if ( ! selectedState || selectedState === DEFAULT_BLOCK_STYLE_STATE ) {
		return cleanEmptyObject( newStyle );
	}
	return cleanEmptyObject( {
		...style,
		[ selectedState ]: newStyle,
	} );
}

export function scopeResetAllFilterToState( selectedState, resetAllFilter ) {
	if (
		! resetAllFilter ||
		! selectedState ||
		selectedState === DEFAULT_BLOCK_STYLE_STATE
	) {
		return resetAllFilter;
	}

	return ( attributes ) => {
		const existingStateStyle = attributes?.style?.[ selectedState ] || {};
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
			style: cleanEmptyObject( {
				...attributes?.style,
				[ selectedState ]: updatedStateStyle,
			} ),
		};
	};
}
