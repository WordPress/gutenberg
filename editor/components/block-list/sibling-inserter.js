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
	getBlockUids,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isBlockWithinSelection,
} from '../../store/selectors';

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
	}

	render() {
		if ( this.props.shouldDisable ) {
			return null;
		}

		const { insertIndex, showInsertionPoint } = this.props;
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
					insertIndex={ insertIndex }
					onToggle={ this.forceVisibleWhileInserting }
				/>
			</div>
		);
	}
}

export default connect(
	( state, { uid } ) => {
		const blockIndex = uid ? getBlockUids( state ).indexOf( uid ) : -1;
		const insertIndex = blockIndex > -1 ? blockIndex + 1 : 0;

		return {
			shouldDisable: isBlockWithinSelection( state, uid ),
			insertIndex,
			showInsertionPoint: (
				isBlockInsertionPointVisible( state ) &&
				getBlockInsertionPoint( state ) === insertIndex
			),
		};
	}
)( BlockListSiblingInserter );
