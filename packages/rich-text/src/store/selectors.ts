/**
 * WordPress dependencies
 */
import { createSelector } from '@wordpress/data';
/**
 * Internal dependencies
 */
import type { State } from '../types';

/**
 * Returns all the available format types.
 *
 * @param {State} state Data state.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as richTextStore } from '@wordpress/rich-text';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *    const { getFormatTypes } = useSelect(
 *        ( select ) => select( richTextStore ),
 *        []
 *    );
 *
 *    const availableFormats = getFormatTypes();
 *
 *    return availableFormats ? (
 *        <ul>
 *            { availableFormats?.map( ( format ) => (
 *                <li>{ format.name }</li>
 *           ) ) }
 *        </ul>
 *    ) : (
 *        __( 'No Formats available' )
 *    );
 * };
 * ```
 *
 * @return Format types.
 */
export const getFormatTypes = createSelector(
	( state: State ) => Object.values( state.formatTypes ),
	( state: State ) => [ state.formatTypes ]
);

/**
 * Returns a format type by name.
 *
 * @param state Data state.
 * @param name  Format type name.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as richTextStore } from '@wordpress/rich-text';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *    const { getFormatType } = useSelect(
 *        ( select ) => select( richTextStore ),
 *        []
 *    );
 *
 *    const boldFormat = getFormatType( 'core/bold' );
 *
 *    return boldFormat ? (
 *        <ul>
 *            { Object.entries( boldFormat )?.map( ( [ key, value ] ) => (
 *                <li>
 *                    { key } : { value }
 *                </li>
 *           ) ) }
 *       </ul>
 *    ) : (
 *        __( 'Not Found' )
 *    ;
 * };
 * ```
 *
 * @return Format type.
 */
export function getFormatType( state: State, name: string ) {
	return state.formatTypes[ name ];
}

/**
 * Gets the format type, if any, that can handle a bare element (without a
 * data-format-type attribute), given the tag name of this element.
 *
 * @param state              Data state.
 * @param bareElementTagName The tag name of the element to find a
 *                           format type for.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as richTextStore } from '@wordpress/rich-text';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *    const { getFormatTypeForBareElement } = useSelect(
 *        ( select ) => select( richTextStore ),
 *        []
 *    );
 *
 *    const format = getFormatTypeForBareElement( 'strong' );
 *
 *    return format && <p>{ sprintf( __( 'Format name: %s' ), format.name ) }</p>;
 * }
 * ```
 *
 * @return Format type.
 */
export function getFormatTypeForBareElement(
	state: State,
	bareElementTagName: string
) {
	const formatTypes = getFormatTypes( state );
	return (
		formatTypes.find( ( { className, tagName } ) => {
			return className === null && bareElementTagName === tagName;
		} ) ||
		formatTypes.find( ( { className, tagName } ) => {
			return className === null && '*' === tagName;
		} )
	);
}

/**
 * Gets the format type, if any, that can handle an element, given its classes.
 *
 * @param state            Data state.
 * @param elementClassName The classes of the element to find a format
 *                         type for.
 *
 * @example
 * ```js
 * import { __, sprintf } from '@wordpress/i18n';
 * import { store as richTextStore } from '@wordpress/rich-text';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *    const { getFormatTypeForClassName } = useSelect(
 *        ( select ) => select( richTextStore ),
 *        []
 *    );
 *
 *    const format = getFormatTypeForClassName( 'has-inline-color' );
 *
 *    return format && <p>{ sprintf( __( 'Format name: %s' ), format.name ) }</p>;
 * };
 * ```
 *
 * @return Format type.
 */
export function getFormatTypeForClassName(
	state: State,
	elementClassName: string
) {
	return getFormatTypes( state ).find( ( { className } ) => {
		if ( className === null ) {
			return false;
		}

		return ` ${ elementClassName } `.indexOf( ` ${ className } ` ) >= 0;
	} );
}
