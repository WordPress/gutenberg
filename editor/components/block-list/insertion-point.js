/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isUnmodifiedDefaultBlock, withEditorSettings } from '@wordpress/blocks';
import { Component, compose } from '@wordpress/element';
import { ifCondition } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';

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

	onFocus( event ) {
		// Ensures that focus doesn't get propagated to BlockContextualToolbar
		event.stopPropagation();
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
						onFocus={ this.onFocus }
						aria-label={ __( 'Insert block' ) }
					/>
				) }
			</div>
		);
	}
}
export default compose(
	withEditorSettings( ( { templateLock } ) => ( { templateLock } ) ),
	ifCondition( ( { templateLock } ) => ! templateLock ),
	withSelect( ( select, { uid, rootUID } ) => {
		const {
			getBlockIndex,
			getBlockInsertionPoint,
			getBlock,
			isBlockInsertionPointVisible,
			isTyping,
		} = select( 'core/editor' );
		const blockIndex = uid ? getBlockIndex( uid, rootUID ) : -1;
		const insertIndex = blockIndex;
		const insertionPoint = getBlockInsertionPoint();
		const block = uid ? getBlock( uid ) : null;
		const showInsertionPoint = (
			isBlockInsertionPointVisible() &&
			insertionPoint.index === insertIndex &&
			insertionPoint.rootUID === rootUID &&
			( ! block || ! isUnmodifiedDefaultBlock( block ) )
		);

		return {
			showInserter: ! isTyping(),
			index: insertIndex,
			showInsertionPoint,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { insertDefaultBlock, startTyping } = dispatch( 'core/editor' );
		return {
			insertDefaultBlock,
			startTyping,
		};
	} )
)( BlockInsertionPoint );
