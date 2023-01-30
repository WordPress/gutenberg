/**
 * WordPress dependencies
 */
import { __, sprintf, isRTL } from '@wordpress/i18n';

const getMovementDirection = ( moveDirection, orientation ) => {
	if ( moveDirection === 'up' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? 'right' : 'left';
		}
		return 'up';
	} else if ( moveDirection === 'down' ) {
		if ( orientation === 'horizontal' ) {
			return isRTL() ? 'left' : 'right';
		}
		return 'down';
	}
	return null;
};

/**
 * Return a label for the block movement controls depending on block position.
 *
 * @param {number}  selectedCount Number of blocks selected.
 * @param {string}  type          Block type - in the case of a single block, should
 *                                define its 'type'. I.e. 'Text', 'Heading', 'Image' etc.
 * @param {number}  firstIndex    The index (position - 1) of the first block selected.
 * @param {boolean} isFirst       This is the first block.
 * @param {boolean} isLast        This is the last block.
 * @param {number}  dir           Direction of movement (> 0 is considered to be going
 *                                down, < 0 is up).
 * @param {string}  orientation   The orientation of the block movers, vertical or
 *                                horizontal.
 *
 * @return {string | undefined} Label for the block movement controls.
 */
export function getBlockMoverDescription(
	selectedCount,
	type,
	firstIndex,
	isFirst,
	isLast,
	dir,
	orientation
) {
	const position = firstIndex + 1;

	if ( selectedCount > 1 ) {
		return getMultiBlockMoverDescription(
			selectedCount,
			firstIndex,
			isFirst,
			isLast,
			dir,
			orientation
		);
	}

	if ( isFirst && isLast ) {
		return sprintf(
			// translators: %s: Type of block (i.e. Text, Image etc)
			__( 'Block %s is the only block, and cannot be moved' ),
			type
		);
	}

	if ( dir > 0 && ! isLast ) {
		// Moving down.
		const movementDirection = getMovementDirection( 'down', orientation );

		if ( movementDirection === 'down' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc), 2: Position of selected block, 3: New position
				__(
					'Move %1$s block from position %2$d down to position %3$d'
				),
				type,
				position,
				position + 1
			);
		}

		if ( movementDirection === 'left' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc), 2: Position of selected block, 3: New position
				__(
					'Move %1$s block from position %2$d left to position %3$d'
				),
				type,
				position,
				position + 1
			);
		}

		if ( movementDirection === 'right' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc), 2: Position of selected block, 3: New position
				__(
					'Move %1$s block from position %2$d right to position %3$d'
				),
				type,
				position,
				position + 1
			);
		}
	}

	if ( dir > 0 && isLast ) {
		// Moving down, and is the last item.
		const movementDirection = getMovementDirection( 'down', orientation );

		if ( movementDirection === 'down' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc)
				__(
					'Block %1$s is at the end of the content and can’t be moved down'
				),
				type
			);
		}

		if ( movementDirection === 'left' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc)
				__(
					'Block %1$s is at the end of the content and can’t be moved left'
				),
				type
			);
		}

		if ( movementDirection === 'right' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc)
				__(
					'Block %1$s is at the end of the content and can’t be moved right'
				),
				type
			);
		}
	}

	if ( dir < 0 && ! isFirst ) {
		// Moving up.
		const movementDirection = getMovementDirection( 'up', orientation );

		if ( movementDirection === 'up' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc), 2: Position of selected block, 3: New position
				__( 'Move %1$s block from position %2$d up to position %3$d' ),
				type,
				position,
				position - 1
			);
		}

		if ( movementDirection === 'left' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc), 2: Position of selected block, 3: New position
				__(
					'Move %1$s block from position %2$d left to position %3$d'
				),
				type,
				position,
				position - 1
			);
		}

		if ( movementDirection === 'right' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc), 2: Position of selected block, 3: New position
				__(
					'Move %1$s block from position %2$d right to position %3$d'
				),
				type,
				position,
				position - 1
			);
		}
	}

	if ( dir < 0 && isFirst ) {
		// Moving up, and is the first item.
		const movementDirection = getMovementDirection( 'up', orientation );

		if ( movementDirection === 'up' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc)
				__(
					'Block %1$s is at the beginning of the content and can’t be moved up'
				),
				type
			);
		}

		if ( movementDirection === 'left' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc)
				__(
					'Block %1$s is at the beginning of the content and can’t be moved left'
				),
				type
			);
		}

		if ( movementDirection === 'right' ) {
			return sprintf(
				// translators: 1: Type of block (i.e. Text, Image etc)
				__(
					'Block %1$s is at the beginning of the content and can’t be moved right'
				),
				type
			);
		}
	}
}

/**
 * Return a label for the block movement controls depending on block position.
 *
 * @param {number}  selectedCount Number of blocks selected.
 * @param {number}  firstIndex    The index (position - 1) of the first block selected.
 * @param {boolean} isFirst       This is the first block.
 * @param {boolean} isLast        This is the last block.
 * @param {number}  dir           Direction of movement (> 0 is considered to be going
 *                                down, < 0 is up).
 * @param {string}  orientation   The orientation of the block movers, vertical or
 *                                horizontal.
 *
 * @return {string | undefined} Label for the block movement controls.
 */
export function getMultiBlockMoverDescription(
	selectedCount,
	firstIndex,
	isFirst,
	isLast,
	dir,
	orientation
) {
	const position = firstIndex + 1;

	if ( isFirst && isLast ) {
		// All blocks are selected
		return __( 'All blocks are selected, and cannot be moved' );
	}

	if ( dir > 0 && ! isLast ) {
		// moving down
		const movementDirection = getMovementDirection( 'down', orientation );

		if ( movementDirection === 'down' ) {
			return sprintf(
				// translators: 1: Number of selected blocks, 2: Position of selected blocks
				__( 'Move %1$d blocks from position %2$d down by one place' ),
				selectedCount,
				position
			);
		}

		if ( movementDirection === 'left' ) {
			return sprintf(
				// translators: 1: Number of selected blocks, 2: Position of selected blocks
				__( 'Move %1$d blocks from position %2$d left by one place' ),
				selectedCount,
				position
			);
		}

		if ( movementDirection === 'right' ) {
			return sprintf(
				// translators: 1: Number of selected blocks, 2: Position of selected blocks
				__( 'Move %1$d blocks from position %2$d right by one place' ),
				selectedCount,
				position
			);
		}
	}

	if ( dir > 0 && isLast ) {
		// moving down, and the selected blocks are the last item
		const movementDirection = getMovementDirection( 'down', orientation );

		if ( movementDirection === 'down' ) {
			return __(
				'Blocks cannot be moved down as they are already at the bottom'
			);
		}

		if ( movementDirection === 'left' ) {
			return __(
				'Blocks cannot be moved left as they are already are at the leftmost position'
			);
		}

		if ( movementDirection === 'right' ) {
			return __(
				'Blocks cannot be moved right as they are already are at the rightmost position'
			);
		}
	}

	if ( dir < 0 && ! isFirst ) {
		// moving up
		const movementDirection = getMovementDirection( 'up', orientation );

		if ( movementDirection === 'up' ) {
			return sprintf(
				// translators: 1: Number of selected blocks, 2: Position of selected blocks
				__( 'Move %1$d blocks from position %2$d up by one place' ),
				selectedCount,
				position
			);
		}

		if ( movementDirection === 'left' ) {
			return sprintf(
				// translators: 1: Number of selected blocks, 2: Position of selected blocks
				__( 'Move %1$d blocks from position %2$d left by one place' ),
				selectedCount,
				position
			);
		}

		if ( movementDirection === 'right' ) {
			return sprintf(
				// translators: 1: Number of selected blocks, 2: Position of selected blocks
				__( 'Move %1$d blocks from position %2$d right by one place' ),
				selectedCount,
				position
			);
		}
	}

	if ( dir < 0 && isFirst ) {
		// moving up, and the selected blocks are the first item
		const movementDirection = getMovementDirection( 'up', orientation );

		if ( movementDirection === 'up' ) {
			return __(
				'Blocks cannot be moved up as they are already at the top'
			);
		}

		if ( movementDirection === 'left' ) {
			return __(
				'Blocks cannot be moved left as they are already are at the leftmost position'
			);
		}

		if ( movementDirection === 'right' ) {
			return __(
				'Blocks cannot be moved right as they are already are at the rightmost position'
			);
		}
	}
}
