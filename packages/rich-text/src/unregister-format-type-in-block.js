/**
 * WordPress dependencies
 */
import { select, dispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as richTextStore } from './store';

/** @typedef {import('./register-format-type').WPFormat} WPFormat */

/**
 * Disables a format type for a specific block type. Unlike `unregisterFormatType`,
 * which removes the format globally, this function hides the format only when
 * editing a particular block type.
 *
 * @example
 * ```js
 * import { unregisterFormatTypeInBlock } from '@wordpress/rich-text';
 *
 * // Disable italic and bold formatting in heading blocks.
 * unregisterFormatTypeInBlock( 'core/heading', 'core/italic' );
 * unregisterFormatTypeInBlock( 'core/heading', 'core/bold' );
 * ```
 *
 * @param {string} blockName  The name of the block type (e.g. 'core/heading').
 * @param {string} formatName The name of the format type to disable (e.g. 'core/italic').
 *
 * @return {WPFormat|undefined} The format settings if successfully disabled;
 *                              otherwise `undefined`.
 */
export function unregisterFormatTypeInBlock( blockName, formatName ) {
	const formatType = select( richTextStore ).getFormatType( formatName );

	if ( ! formatType ) {
		window.console.error( `Format ${ formatName } is not registered.` );
		return;
	}

	dispatch( richTextStore ).disableFormatTypeInBlock( blockName, formatName );

	return formatType;
}
