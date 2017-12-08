/**
 * WordPress dependencies
 */
import { NavigableMenu, KeyboardShortcuts } from '@wordpress/components';
import { Component, findDOMNode } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Module Constants
 */
const { ESCAPE } = keycodes;

class NavigableToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.bindNode = this.bindNode.bind( this );
		this.focusToolbar = this.focusToolbar.bind( this );
		this.onToolbarKeyDown = this.onToolbarKeyDown.bind( this );
	}

	bindNode( ref ) {
		// Disable reason: Need DOM node for finding first focusable element
		// on keyboard interaction to shift to toolbar.
		// eslint-disable-next-line react/no-find-dom-node
		this.toolbar = findDOMNode( ref );
	}

	focusToolbar() {
		const tabbables = focus.tabbable.find( this.toolbar );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	onToolbarKeyDown( event ) {
		if ( event.keyCode !== ESCAPE ) {
			return;
		}

		// Is there a better way to focus the selected block
		// TODO: separate focused/selected block state and use Redux actions instead
		const selectedBlock = document.querySelector( '.editor-block-list__block.is-selected .editor-block-list__block-edit' );
		if ( !! selectedBlock ) {
			event.stopPropagation();
			selectedBlock.focus();
		}
	}

	render() {
		const { children, ...props } = this.props;
		return (
			<NavigableMenu
				orientation="horizontal"
				role="toolbar"
				deep
				ref={ this.bindNode }
				onKeyDown={ this.onToolbarKeyDown }
				{ ...props }
			>
				<KeyboardShortcuts
					bindGlobal
					eventName="keyup"
					shortcuts={ {
						'alt+f10': this.focusToolbar,
					} }
				/>
				{ children }
			</NavigableMenu>
		);
	}
}

export default NavigableToolbar;
