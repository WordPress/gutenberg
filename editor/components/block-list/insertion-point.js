/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getBlockIndex,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	getBlockCount,
	getBlock,
	isTyping,
} from '../../store/selectors';
import {
	insertDefaultBlock,
	startTyping,
} from '../../store/actions';

function BlockInsertionPoint( { showInsertionPoint, showInserter, index, layout, rootUID, ...props } ) {
	const onClick = () => {
		props.insertDefaultBlock( { layout }, rootUID, index );
		props.startTyping();
	};

	return (
		<div className="editor-block-list__insertion-point">
			{ showInsertionPoint && <div className="editor-block-list__insertion-point-indicator" /> }
			{ showInserter && (
				<button
					className="editor-block-list__insertion-point-inserter"
					onClick={ onClick }
					aria-label={ __( 'Insert block' ) }
				/>
			) }
		</div>
	);
}

export default connect(
	( state, { uid, rootUID } ) => {
		const blockIndex = uid ? getBlockIndex( state, uid, rootUID ) : -1;
		const insertIndex = blockIndex > -1 ? blockIndex + 1 : getBlockCount( state );
		const insertionPoint = getBlockInsertionPoint( state );
		const block = uid ? getBlock( state, uid ) : null;

		return {
			showInsertionPoint: (
				isBlockInsertionPointVisible( state ) &&
				insertionPoint.index === insertIndex &&
				insertionPoint.rootUID === rootUID &&
				( ! block || ! isUnmodifiedDefaultBlock( block ) )
			),
			showInserter: ! isTyping( state ),
			index: insertIndex,
		};
	},
	{ insertDefaultBlock, startTyping }
)( BlockInsertionPoint );
