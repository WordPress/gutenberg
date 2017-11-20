/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { focus } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import Inserter from '../inserter';
import {
	getBlockUids,
	getBlockInsertionPoint,
	isBlockInsertionPointVisible,
	isBlockWithinSelection,
} from '../../selectors';

class BlockListSiblingInserter extends Component {
	constructor() {
		super( ...arguments );

		this.bindNode = this.bindNode.bind( this );
		this.focusFirstTabbable = this.focusFirstTabbable.bind( this );
		this.show = this.toggleVisible.bind( this, true );
		this.hide = this.toggleVisible.bind( this, false );
		this.showAndFocus = this.showAndFocus.bind( this );
		this.suspendToggleVisible = this.suspendToggleVisible.bind( this );

		this.state = {
			isVisible: false,
			isToggleVisibleSuspended: false,
		};
	}

	componentDidUpdate( prevProps, prevState ) {
		const { visibleViaFocus, state } = this;
		const { isVisible, isToggleVisibleSuspended } = state;
		if ( isVisible && ! prevState.isVisible && visibleViaFocus ) {
			this.focusFirstTabbable();

			// Reset for next toggle visible
			this.visibleViaFocus = false;
		}

		// If inserter is closed, we must check to see if focus is still within
		// the inserter, since it may have been closed by clicking outside. We
		// want to retain visible if still focused, or hide otherwise.
		if ( ! isToggleVisibleSuspended && prevState.isToggleVisibleSuspended &&
				! this.node.contains( document.activeElement ) ) {
			this.toggleVisible( false );
		}
	}

	bindNode( node ) {
		this.node = node;
	}

	focusFirstTabbable() {
		// Sibling inserter doesn't render its inserter button until after it
		// becomes visible by focus or hover. If visible by focus, move focus
		// into the now-visible button.
		const tabbable = focus.tabbable.find( this.node );
		if ( tabbable.length ) {
			tabbable[ 0 ].focus();
		}
	}

	toggleVisible( isVisible ) {
		if ( ! this.state.isToggleVisibleSuspended ) {
			this.setState( { isVisible } );
		}
	}

	showAndFocus() {
		this.toggleVisible( true );
		this.visibleViaFocus = true;
	}

	suspendToggleVisible( isOpen ) {
		// Prevent mouseout and blur while navigating the open inserter menu
		// from causing the inserter to be unmounted.
		this.setState( { isToggleVisibleSuspended: isOpen } );
	}

	render() {
		if ( this.props.shouldDisable ) {
			return null;
		}

		const { insertIndex, showInsertionPoint } = this.props;
		const { isVisible } = this.state;

		const classes = classnames( 'editor-block-list__sibling-inserter', {
			'is-visible': isVisible || showInsertionPoint,
		} );

		return (
			<div
				ref={ this.bindNode }
				data-insert-index={ insertIndex }
				className={ classes }
				onFocus={ this.showAndFocus }
				onBlur={ this.hide }
				onMouseEnter={ this.show }
				onMouseLeave={ this.hide }
				tabIndex={ isVisible ? -1 : 0 }>
				{ showInsertionPoint && (
					<div className="editor-block-list__insertion-point" />
				) }
				{ isVisible &&
					<Inserter
						key="inserter"
						position="bottom"
						insertIndex={ insertIndex }
						onToggle={ this.suspendToggleVisible }
					/>
				}
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
