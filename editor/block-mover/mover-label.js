/**
 * Wordpress dependencies
 */
import { __, sprintf } from 'i18n';

/**
 * Return a label for the block movement controls depending on block position.
 *
 * @param  {number}  selectedCount Number of blocks selected.
 * @param  {string}  type          Block type - in the case of a single block, should
 *                                 define its 'type'. I.e. 'Text', 'Heading', 'Image' etc.
 * @param  {number}  firstIndex    The index (position - 1) of the first block selected.
 * @param  {boolean} isFirst       This is the first block.
 * @param  {boolean} isLast        This is the last block.
 * @param  {number}  dir           Direction of movement (> 0 is considered to be going
 *                                 down, < 0 is up).
 * @return {string}                Label for the block movement controls.
 */
export function getBlockMoverLabel( selectedCount, type, firstIndex, isFirst, isLast, dir ) {
	const position = ( firstIndex + 1 );

	if ( selectedCount > 1 ) {
		return getMultiBlockMoverLabel( selectedCount, firstIndex, isFirst, isLast, dir );
	}

	if ( isFirst && isLast ) {
		return sprintf( __( 'Block "%s" is the only block, and cannot be moved' ), type );
	}

	if ( dir > 0 && ! isLast ) {
		// moving down
		return sprintf(
			__( 'Move "%s" block from position %s down to position %s' ),
			type,
			position,
			( position + 1 )
		);
	}

	if ( dir > 0 && isLast ) {
		// moving down, and is the last item
		return sprintf( __( 'Block "%s" is at the end of the content and can’t be moved down' ), type );
	}

	if ( dir < 0 && ! isFirst ) {
		// moving up
		return sprintf(
			__( 'Move "%s" block from position %s up to position %s' ),
			type,
			position,
			( position - 1 )
		);
	}

	if ( dir < 0 && isFirst ) {
		// moving up, and is the first item
		return sprintf( __( 'Block "%s" is at the beginning of the content and can’t be moved up' ), type );
	}
}

/**
 * Return a label for the block movement controls depending on block position.
 *
 * @param  {number}  selectedCount Number of blocks selected.
 * @param  {number}  firstIndex    The index (position - 1) of the first block selected.
 * @param  {boolean} isFirst       This is the first block.
 * @param  {boolean} isLast        This is the last block.
 * @param  {number}  dir           Direction of movement (> 0 is considered to be going
 *                                 down, < 0 is up).
 * @return {string}                Label for the block movement controls.
 */
export function getMultiBlockMoverLabel( selectedCount, firstIndex, isFirst, isLast, dir ) {
	const position = ( firstIndex + 1 );

	if ( dir < 0 && isFirst ) {
		return __( 'Blocks cannot be moved up as they are already at the top' );
	}

	if ( dir > 0 && isLast ) {
		return __( 'Blocks cannot be moved down as they are already at the bottom' );
	}

	if ( dir < 0 && ! isFirst ) {
		return sprintf(
			__( 'Move %s blocks from position %s up by one place' ),
			selectedCount,
			position
		);
	}

	if ( dir > 0 && ! isLast ) {
		return sprintf(
			__( 'Move %s blocks from position %s down by one place' ),
			selectedCount,
			position
		);
	}
}
