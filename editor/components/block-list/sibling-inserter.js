/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import {
	getBlock,
	getBlockOrder,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isBlockWithinSelection,
} from '../../store/selectors';
import {
	clearSelectedBlock,
} from '../../store/actions';

class BlockListSiblingInserter extends Component {
	constructor() {
		super( ...arguments );

		this.forceVisibleWhileInserting = this.forceVisibleWhileInserting.bind( this );

		this.state = {
			isForcedVisible: false,
		};
	}

	forceVisibleWhileInserting( isOpen ) {
		// Prevent mouseout and blur while navigating the open inserter menu
		// from causing the inserter to be unmounted.
		this.setState( { isForcedVisible: isOpen } );

		if ( isOpen ) {
			this.props.clearSelectedBlock();
		}
	}

	render() {
		if ( this.props.shouldDisable ) {
			return null;
		}

		const { rootUID, insertIndex, showInsertionPoint, layout } = this.props;
		const { isForcedVisible } = this.state;

		const classes = classnames( 'editor-block-list__sibling-inserter', {
			'is-forced-visible': isForcedVisible || showInsertionPoint,
		} );

		return (
			<div
				ref={ this.bindNode }
				data-insert-index={ insertIndex }
				className={ classes }>
				{ showInsertionPoint && (
					<div className="editor-block-list__insertion-point" />
				) }
				<Inserter
					key="inserter"
					position="bottom"
					rootUID={ rootUID }
					insertIndex={ insertIndex }
					layout={ layout }
					onToggle={ this.forceVisibleWhileInserting }
				/>
			</div>
		);
	}
}

export default connect(
	( state, { rootUID, uid, layout, insertBefore } ) => {
		const increment = insertBefore ? 0 : 1;
		const blockIndex = getBlockOrder( state, rootUID ).indexOf( uid );
		const block = getBlock( state, uid );

		let insertIndex, showInsertionPoint;
		if ( block && blockIndex >= 0 ) {
			insertIndex = blockIndex + increment;
			showInsertionPoint = (
				isBlockInsertionPointVisible( state, rootUID, layout ) &&
				getBlockInsertionPoint( state, rootUID ) === insertIndex
			);
		} else {
			insertIndex = 0;
			showInsertionPoint = false;
		}

		return {
			shouldDisable: isBlockWithinSelection( state, uid ),
			insertIndex,
			showInsertionPoint,
		};
	},
	{
		clearSelectedBlock,
	}
)( BlockListSiblingInserter );
