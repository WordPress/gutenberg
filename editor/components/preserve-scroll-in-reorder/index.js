/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { getScrollContainer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getBlockDOMNode } from '../../utils/dom';

/**
 * Non-visual component which preserves offset of selected block within nearest
 * scrollable container while reordering.
 *
 * @example
 *
 * ```jsx
 * <PreserveScrollInReorder />
 * ```
 */
class PreserveScrollInReorder extends Component {
	componentWillUpdate( nextProps ) {
		const { blockOrder, selectionStart } = nextProps;
		if ( blockOrder !== this.props.blockOrder && selectionStart ) {
			this.setPreviousOffset( selectionStart );
		}
	}

	componentDidUpdate() {
		if ( this.previousOffset ) {
			this.restorePreviousOffset();
		}
	}

	/**
	 * Given the block UID of the start of the selection, saves the block's
	 * top offset as an instance property before a reorder is to occur.
	 *
	 * @param {string} selectionStart UID of selected block.
	 */
	setPreviousOffset( selectionStart ) {
		const blockNode = getBlockDOMNode( selectionStart );
		if ( ! blockNode ) {
			return;
		}

		this.previousOffset = blockNode.getBoundingClientRect().top;
	}

	/**
	 * After a block reordering, restores the previous viewport top offset.
	 */
	restorePreviousOffset() {
		const { selectionStart } = this.props;
		const blockNode = getBlockDOMNode( selectionStart );
		if ( blockNode ) {
			const scrollContainer = getScrollContainer( blockNode );
			if ( scrollContainer ) {
				scrollContainer.scrollTop = scrollContainer.scrollTop +
					blockNode.getBoundingClientRect().top -
					this.previousOffset;
			}
		}

		delete this.previousOffset;
	}

	render() {
		return null;
	}
}

export default withSelect( ( select ) => {
	return {
		blockOrder: select( 'core/editor' ).getBlockOrder(),
		selectionStart: select( 'core/editor' ).getBlockSelectionStart(),
	};
} )( PreserveScrollInReorder );
