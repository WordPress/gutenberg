/**
 * External dependencies
 */
import { cond, matchesProperty, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { NavigableMenu, KeyboardShortcuts } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Browser dependencies
 */

const { Node, getSelection } = window;

class NavigableToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.focusToolbar = this.focusToolbar.bind( this );
		this.focusSelection = this.focusSelection.bind( this );

		this.switchOnKeyDown = cond( [
			[ matchesProperty( [ 'keyCode' ], ESCAPE ), this.focusSelection ],
		] );
		this.toolbar = createRef();
	}

	focusToolbar() {
		const tabbables = focus.tabbable.find( this.toolbar.current );
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
		if ( ! selection ) {
			return;
		}

		// Focus node may be a text node, which cannot be focused directly.
		// Find its parent element instead.
		const { focusNode } = selection;
		let focusElement = focusNode;
		if ( focusElement.nodeType !== Node.ELEMENT_NODE ) {
			focusElement = focusElement.parentElement;
		}

		if ( focusElement ) {
			focusElement.focus();
		}
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.focusToolbar();
		}
	}

	render() {
		const { children, ...props } = this.props;
		return (
			<NavigableMenu
				orientation="horizontal"
				role="toolbar"
				ref={ this.toolbar }
				onKeyDown={ this.switchOnKeyDown }
				{ ...omit( props, [
					'focusOnMount',
				] ) }
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

export default NavigableToolbar;
