import { createContext, useContext } from '@wordpress/element';
import { cleanEmptyObject } from './utils';
import { getValueFromObjectPath, setImmutably } from '../utils/object';
import type { BlockStyle, BlockStyleState, ResetAllFilter } from './types';

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
 * @return The current block style state.
 */
export function useBlockStyleState(): BlockStyleState {
	return useContext( BlockStyleStateContext );
}

/**
 * Returns true when a viewport style state is selected.
 *
 * @param selectedState Selected block style state.
 * @return Whether a viewport state is selected.
 */
export function hasViewportBlockStyleState(
	selectedState: BlockStyleState | undefined
): boolean {
	return (
		!! selectedState?.viewport &&
		selectedState.viewport !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns true when a pseudo style state is selected.
 *
 * @param selectedState Selected block style state.
 * @return Whether a pseudo state is selected.
 */
export function hasPseudoBlockStyleState(
	selectedState: BlockStyleState | undefined
): boolean {
	return (
		!! selectedState?.pseudo && selectedState.pseudo !== DEFAULT_STATE_VALUE
	);
}

/**
 * Returns true when the default style state is selected.
 *
 * @param selectedState Selected block style state.
 * @return Whether the default style state is selected.
 */
export function isDefaultBlockStyleState(
	selectedState: BlockStyleState | undefined
): boolean {
	return (
		! hasViewportBlockStyleState( selectedState ) &&
		! hasPseudoBlockStyleState( selectedState )
	);
}

/**
 * Returns the style object path for the selected block style state.
 *
 * @param selectedState Selected block style state.
 * @return Object path for the selected state styles.
 */
function getStyleStatePath(
	selectedState: BlockStyleState | undefined
): string[] {
	if ( isDefaultBlockStyleState( selectedState ) ) {
		return [];
	}

	// A non-default state is always set, and the filter drops the unset parts.
	return [ selectedState!.viewport, selectedState!.pseudo ].filter(
		( state ) => state && state !== DEFAULT_STATE_VALUE
	) as string[];
}

/**
 * Returns the style object for the selected block style state.
 *
 * @param {Object} style         The block style object.
 * @param {Object} selectedState Selected block style state.
 * @return {Object} The style object for the selected state, if found.
 *
 * @example
 * ```js
 * const state = { viewport: '@mobile' };
 * const stateStyle = getStyleForState( attributes.style, state ) || {};
 * ```
 */
export function getStyleForState(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState | undefined
): BlockStyle | undefined {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return style;
	}
	// Style attributes are not validated against a schema.
	return getValueFromObjectPath( style, path ) as BlockStyle | undefined;
}

/**
 * Returns a style object with the selected block style state updated.
 *
 * @param {Object} style         The block style object.
 * @param {Object} selectedState Selected block style state.
 * @param {Object} newStyle      New style for the selected state.
 * @return {Object} The updated style object.
 *
 * @example
 * ```js
 * const state = { viewport: '@mobile' };
 * const stateStyle = getStyleForState( attributes.style, state ) || {};
 * setAttributes( {
 * 	style: setStyleForState( attributes.style, state, {
 * 		...stateStyle,
 * 		dimensions: { ...stateStyle.dimensions, minHeight: '50vh' },
 * 	} ),
 * } );
 * ```
 */
export function setStyleForState(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState | undefined,
	newStyle: BlockStyle | undefined
): BlockStyle | undefined {
	const path = getStyleStatePath( selectedState );
	if ( ! path.length ) {
		return cleanEmptyObject( newStyle );
	}
	// Setting a path on the style object keeps it an object.
	return cleanEmptyObject(
		setImmutably( style, path, newStyle ) as BlockStyle
	);
}

export function scopeResetAllFilterToState<
	Filter extends ResetAllFilter | undefined,
>(
	selectedState: BlockStyleState | undefined,
	resetAllFilter: Filter
): Filter | ResetAllFilter {
	if ( ! resetAllFilter || isDefaultBlockStyleState( selectedState ) ) {
		return resetAllFilter;
	}

	return ( attributes: { style?: BlockStyle } ) => {
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
