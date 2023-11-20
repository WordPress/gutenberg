const EMPTY_INSERTION_POINT = {
	rootClientId: undefined,
	insertionIndex: undefined,
};

/**
 * Returns true if the inserter is opened.
 *
 * @param {Object} state Global application state.
 *
 * @example
 * ```js
 * import { store as customizeWidgetsStore } from '@wordpress/customize-widgets';
 * import { __ } from '@wordpress/i18n';
 * import { useSelect } from '@wordpress/data';
 *
 * const ExampleComponent = () => {
 *    const { isInserterOpened } = useSelect(
 *        ( select ) => select( customizeWidgetsStore ),
 *        []
 *    );
 *
 *    return isInserterOpened()
 *        ? __( 'Inserter is open' )
 *        : __( 'Inserter is closed.' );
 * };
 * ```
 *
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID and index to insert at.
 */
export function __experimentalGetInsertionPoint( state ) {
	if ( typeof state.blockInserterPanel === 'boolean' ) {
		return EMPTY_INSERTION_POINT;
	}

	return state.blockInserterPanel;
}
