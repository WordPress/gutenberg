/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Component, compose } from '@wordpress/element';
import { ifCondition, withContext } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getBlockIndex,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	getBlock,
	isTyping,
} from '../../store/selectors';
import {
	insertDefaultBlock,
	startTyping,
} from '../../store/actions';

class BlockInsertionPoint extends Component {
	constructor() {
		super( ...arguments );
		this.onClick = this.onClick.bind( this );
	}
	onClick() {
		const { layout, rootUID, index, ...props } = this.props;
		props.insertDefaultBlock( { layout }, rootUID, index );
		props.startTyping();
	}

	render() {
		const { showInsertionPoint, showInserter } = this.props;

		return (
			<div className="editor-block-list__insertion-point">
				{ showInsertionPoint && <div className="editor-block-list__insertion-point-indicator" /> }
				{ showInserter && (
					<button
						className="editor-block-list__insertion-point-inserter"
						onClick={ this.onClick }
						aria-label={ __( 'Insert block' ) }
					/>
				) }
			</div>
		);
	}
}
export default compose(
	withContext( 'editor' )( ( { templateLock } ) => ( { templateLock } ) ),
	ifCondition( ( { templateLock } ) => ! templateLock ),
	connect(
		( state, { uid, rootUID } ) => {
			const blockIndex = uid ? getBlockIndex( state, uid, rootUID ) : -1;
			const insertIndex = blockIndex;
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
	)
)( BlockInsertionPoint );
