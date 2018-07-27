/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { Component } from '@wordpress/element';
import { IconButton } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { ifCondition, compose } from '@wordpress/compose';

class BlockInsertionPoint extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isInserterFocused: false,
		};

		this.onBlurInserter = this.onBlurInserter.bind( this );
		this.onFocusInserter = this.onFocusInserter.bind( this );
		this.onClick = this.onClick.bind( this );
	}

	onFocusInserter( event ) {
		// We stop propagation of the focus event to avoid selecting the current block
		// While we're trying to insert a new block
		event.stopPropagation();

		this.setState( {
			isInserterFocused: true,
		} );
	}

	onBlurInserter() {
		this.setState( {
			isInserterFocused: false,
		} );
	}

	onClick() {
		const { layout, rootClientId, index, ...props } = this.props;
		props.insertDefaultBlock( { layout }, rootClientId, index );
		props.startTyping();
		this.onBlurInserter();
		if ( props.onInsert ) {
			this.props.onInsert();
		}
	}

	render() {
		const { isInserterFocused } = this.state;
		const { showInsertionPoint, showInserter } = this.props;

		return (
			<div className="editor-block-list__insertion-point">
				{ showInsertionPoint && <div className="editor-block-list__insertion-point-indicator" /> }
				{ showInserter && (
					<div className={ classnames( 'editor-block-list__insertion-point-inserter', { 'is-visible': isInserterFocused } ) }>
						<IconButton
							icon="insert"
							className="editor-block-list__insertion-point-button"
							onClick={ this.onClick }
							label={ __( 'Insert block' ) }
							onFocus={ this.onFocusInserter }
							onBlur={ this.onBlurInserter }
						/>
					</div>
				) }
			</div>
		);
	}
}
export default compose(
	withSelect( ( select, { clientId, rootClientId, canShowInserter } ) => {
		const {
			canInsertBlockType,
			getBlockIndex,
			getBlockInsertionPoint,
			getBlock,
			isBlockInsertionPointVisible,
			isTyping,
		} = select( 'core/editor' );
		const {
			getDefaultBlockName,
		} = select( 'core/blocks' );
		const blockIndex = clientId ? getBlockIndex( clientId, rootClientId ) : -1;
		const insertIndex = blockIndex;
		const insertionPoint = getBlockInsertionPoint();
		const block = clientId ? getBlock( clientId ) : null;
		const showInsertionPoint = (
			isBlockInsertionPointVisible() &&
			insertionPoint.index === insertIndex &&
			insertionPoint.rootClientId === rootClientId &&
			( ! block || ! isUnmodifiedDefaultBlock( block ) )
		);

		const defaultBlockName = getDefaultBlockName();
		return {
			canInsertDefaultBlock: canInsertBlockType( defaultBlockName, rootClientId ),
			showInserter: ! isTyping() && canShowInserter,
			index: insertIndex,
			showInsertionPoint,
		};
	} ),
	ifCondition( ( { canInsertDefaultBlock } ) => canInsertDefaultBlock ),
	withDispatch( ( dispatch ) => {
		const { insertDefaultBlock, startTyping } = dispatch( 'core/editor' );
		return {
			insertDefaultBlock,
			startTyping,
		};
	} )
)( BlockInsertionPoint );
