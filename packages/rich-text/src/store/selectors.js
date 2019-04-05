/**
 * External dependencies
 */
import createSelector from 'rememo';
import { filter, find } from 'lodash';

/**
 * Returns all the available custom alignment types.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Custom alignment types.
 */
export const getCustomAlignmentTypes = createSelector(
	( state ) => Object.values( state.customAlignmentTypes ),
	( state ) => [
		state.customAlignmentTypes,
	]
);

/**
 * Returns the custom alignment types available for a given block.
 *
 * @param {Object} state Data state.
 * @param {string} blockName Block name.
 *
 * @return {Array} Custom alignment types.
 */
export function getCustomAlignmentTypesForBlock( state, blockName ) {
	return filter( state.customAlignmentTypes, ( type ) => type.blockName === blockName );
}

/**
 * Returns a custom alignment type.
 *
 * @param {Object} state Data state.
 * @param {string} name Alignment name.
 * @param {string} blockName Block name.
 *
 * @return {?Object} Custom alignment types.
 */
export function getCustomAlignmentType( state, name, blockName ) {
	return find( state.customAlignmentTypes, ( type ) => type.name === name && type.blockName === blockName );
}

/**
 * Returns all the available format types.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Format types.
 */
export const getFormatTypes = createSelector(
	( state ) => Object.values( state.formatTypes ),
	( state ) => [
		state.formatTypes,
	]
);

/**
 * Returns a format type by name.
 *
 * @param {Object} state Data state.
 * @param {string} name Format type name.
 *
 * @return {Object?} Format type.
 */
export function getFormatType( state, name ) {
	return state.formatTypes[ name ];
}

/**
 * Gets the format type, if any, that can handle a bare element (without a
 * data-format-type attribute), given the tag name of this element.
 *
 * @param {Object} state              Data state.
 * @param {string} bareElementTagName The tag name of the element to find a
 *                                    format type for.
 * @return {?Object} Format type.
 */
export function getFormatTypeForBareElement( state, bareElementTagName ) {
	return find( getFormatTypes( state ), ( { tagName } ) => {
		return bareElementTagName === tagName;
	} );
}

/**
 * Gets the format type, if any, that can handle an element, given its classes.
 *
 * @param {Object} state            Data state.
 * @param {string} elementClassName The classes of the element to find a format
 *                                  type for.
 * @return {?Object} Format type.
 */
export function getFormatTypeForClassName( state, elementClassName ) {
	return find( getFormatTypes( state ), ( { className } ) => {
		if ( className === null ) {
			return false;
		}

		return ` ${ elementClassName } `.indexOf( ` ${ className } ` ) >= 0;
	} );
}
