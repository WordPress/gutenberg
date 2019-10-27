/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { NavigableMenu, KeyboardShortcuts } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/dom';

class NavigableToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.focusToolbar = this.focusToolbar.bind( this );

		this.toolbar = createRef();
	}

	focusToolbar() {
		const tabbables = focus.tabbable.find( this.toolbar.current );
		if ( tabbables.length ) {
			tabbables[ 0 ].focus();
		}
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.focusToolbar();
		}

		// We use DOM event listeners instead of React event listeners
		// because we want to catch events from the underlying DOM tree
		// The React Tree can be different from the DOM tree when using
		// portals. Block Toolbars for instance are rendered in a separate
		// React Tree.
		this.toolbar.current.addEventListener( 'keydown', this.switchOnKeyDown );
	}

	componentwillUnmount() {
		this.toolbar.current.removeEventListener( 'keydown', this.switchOnKeyDown );
	}

	render() {
		const { children, ...props } = this.props;
		return (
			<NavigableMenu
				orientation="horizontal"
				role="toolbar"
				ref={ this.toolbar }
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
