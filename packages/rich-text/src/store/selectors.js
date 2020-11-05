/**
 * External dependencies
 */
import createSelector from 'rememo';
import { find } from 'lodash';

/**
 * Returns all the available format types.
 *
 * @param {Object} state Data state.
 *
 * @return {Array} Format types.
 */
export const getFormatTypes = createSelector(
	( state ) => Object.values( state.formatTypes ),
	( state ) => [ state.formatTypes ]
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
	return find( getFormatTypes( state ), ( { className, tagName } ) => {
		return className === null && bareElementTagName === tagName;
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
