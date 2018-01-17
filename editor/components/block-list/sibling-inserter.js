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
import {
	clearSelectedBlock,
	setInsertionPointIndex,
} from '../../store/actions';

class BlockListSiblingInserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );

		this.state = {
			isForcedVisible: false,
		};
	}

	/**
	 * Handles sibling inserter behaviors to occur when the inserter is opened
	 * or closed.
	 *
	 * @param {Boolean} isOpen Whether inserter is open.
	 */
	onToggle( isOpen ) {
		// Set index at which insertion point should display
		const { setInsertionPoint, insertIndex } = this.props;
		setInsertionPoint( isOpen ? insertIndex : null );

		// Prevent mouseout and blur while navigating the open inserter menu
		// from causing the inserter to be unmounted.
		this.setState( { isForcedVisible: isOpen } );

		// Clear block selection when opening
		if ( isOpen ) {
			this.props.clearSelectedBlock();
		}
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
					onToggle={ this.onToggle }
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
	},
	{
		clearSelectedBlock,
		setInsertionPoint: setInsertionPointIndex,
	}
)( BlockListSiblingInserter );
