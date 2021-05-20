/**
 * External dependencies
 */
import { isArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

export const getBlockPositionDescription = ( position, siblingCount, level ) =>
	sprintf(
		/* translators: 1: The numerical position of the block. 2: The total number of blocks. 3. The level of nesting for the block. */
		__( 'Block %1$d of %2$d, Level %3$d' ),
		position,
		siblingCount,
		level
	);

/**
 * Returns true if the client ID occurs within the block selection or multi-selection,
 * or false otherwise.
 *
 * @param {string}          clientId               Block client ID.
 * @param {string|string[]} selectedBlockClientIds Selected block client ID, or an array of multi-selected blocks client IDs.
 *
 * @return {boolean} Whether the block is in multi-selection set.
 */
export const isClientIdSelected = ( clientId, selectedBlockClientIds ) =>
	isArray( selectedBlockClientIds ) && selectedBlockClientIds.length
		? selectedBlockClientIds.indexOf( clientId ) !== -1
		: selectedBlockClientIds === clientId;
