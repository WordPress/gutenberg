/**
 * External dependencies
 */
import { cond, matchesProperty, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { NavigableMenu, KeyboardShortcuts } from '@wordpress/components';
import { Component, findDOMNode, createRef } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import { getBlockFocusableWrapper } from '../../utils/dom';

/**
 * Browser dependencies
 */

const { Node, getSelection } = window;

/**
 * Module Constants
 */
const { ESCAPE } = keycodes;

class NavigableToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.toolbar = createRef();
		this.focusToolbar = this.focusToolbar.bind( this );
		this.focusSelection = this.focusSelection.bind( this );

		this.switchOnKeyDown = cond( [
			[ matchesProperty( [ 'keyCode' ], ESCAPE ), this.focusSelection ],
		] );
	}

	focusToolbar() {
		// Disable reason: Need DOM node for finding first focusable element
		// on keyboard interaction to shift to toolbar.
		// eslint-disable-next-line react/no-find-dom-node
		const toolbar = findDOMNode( this.toolbar.current );

		const tabbables = focus.tabbable.find( toolbar );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	/**
	 * Programmatically shifts focus to the element where the current selection
	 * exists, if there is a selection.
	 */
	focusSelection() {
		// Ensure that a selection exists.
		const selection = getSelection();
		if ( ! selection || ! selection.focusNode ) {
			return;
		}

		const { focusNode } = selection;
		const { selectedBlockUID } = this.props;
		const selectedBlockFocusableWrapper = getBlockFocusableWrapper( selectedBlockUID );
		let focusElement = focusNode;

		/*
		 * Not all blocks have editable fields that can have a selection, or they
		 * can have both editable fields and other UI parts that can't have a selection.
		 * In these cases the current selection could be the one from another block.
		 * Move focus back to the selected block wrapper.
		 */
		if ( ! selectedBlockFocusableWrapper.contains( focusNode ) ) {
			focusElement = selectedBlockFocusableWrapper;
		} else if ( focusElement.nodeType !== Node.ELEMENT_NODE ) {
			/*
			 * Focus node may be a text node, which cannot be focused directly.
			 * Find its parent element instead.
			 */
			focusElement = focusElement.parentElement;
		}

		if ( focusElement ) {
			focusElement.focus();
		}
	}

	render() {
		const { children, ...props } = omit( this.props, 'selectedBlockUID' );

		return (
			<NavigableMenu
				orientation="horizontal"
				role="toolbar"
				deep
				ref={ this.toolbar }
				onKeyDown={ this.switchOnKeyDown }
				{ ...props }
			>
				<KeyboardShortcuts
					bindGlobal
					// Use the same event that TinyMCE uses in the Classic block for its own `alt+f10` shortcut.
					eventName="keydown"
					shortcuts={ {
						'alt+f10': this.focusToolbar,
					} }
				/>
				{ children }
			</NavigableMenu>
		);
	}
}

export default withSelect( ( select ) => {
	return {
		selectedBlockUID: select( 'core/editor' ).getBlockSelectionStart(),
	};
} )( NavigableToolbar );
