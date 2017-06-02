import { __, sprintf } from 'i18n';

export function blockMoverLabel( selectedCount, { type, firstIndex, isFirst, isLast, dir } ) {
	const position = ( firstIndex + 1 );

	if ( selectedCount > 1 ) {
		return multiBlockMoverLabel( selectedCount, { isFirst, isLast, firstIndex, dir } );
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

	return '';
}

export function multiBlockMoverLabel( selectedCount, { isFirst, isLast, firstIndex, dir } ) {
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
