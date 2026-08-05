/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 *
 * @example
 * ```js
 * import { useState } from 'react';
 * import { store as customizeWidgetsStore } from '@wordpress/customize-widgets';
 * import { __ } from '@wordpress/i18n';
 * import { useDispatch } from '@wordpress/data';
 * import { Button } from '@wordpress/components';
 *
 * const ExampleComponent = () => {
 *   const { setIsInserterOpened } = useDispatch( customizeWidgetsStore );
 *   const [ isOpen, setIsOpen ] = useState( false );
 *
 *    return (
 *        <Button
 *            onClick={ () => {
 *                setIsInserterOpened( ! isOpen );
 *                setIsOpen( ! isOpen );
 *            } }
 *        >
 *            { __( 'Open/close inserter' ) }
 *        </Button>
 *    );
 * };
 * ```
 *
 * @return {Object} Action object.
 */
export function setIsInserterOpened( value ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		value,
	};
}
