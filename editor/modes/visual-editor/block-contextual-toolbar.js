/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { NavigableMenu, KeyboardShortcuts } from '@wordpress/components';
import { Component, findDOMNode } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import BlockToolbar from '../../block-toolbar';
import { isFeatureActive } from '../../selectors';

/**
 * Module Constants
 */
const { ESCAPE } = keycodes;

class BlockContextualToolbar extends Component {
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
		const selectedBlock = document.querySelector( '.editor-visual-editor__block.is-selected .editor-visual-editor__block-edit' );
		if ( !! selectedBlock ) {
			event.stopPropagation();
			selectedBlock.focus();
		}
	}

	render() {
		const { hasFixedToolbar } = this.props;

		if ( hasFixedToolbar ) {
			return null;
		}

		return (
			<NavigableMenu
				className="editor-block-contextual-toolbar"
				orientation="horizontal"
				role="toolbar"
				deep
				aria-label={ __( 'Editor Toolbar' ) }
				ref={ this.bindNode }
				onKeyDown={ this.onToolbarKeyDown }
			>
				<KeyboardShortcuts
					bindGlobal
					eventName="keyup"
					shortcuts={ {
						'alt+f10': this.focusToolbar,
					} }
				/>
				<BlockToolbar />
			</NavigableMenu>
		);
	}
}

export default connect(
	( state ) => ( {
		hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
	} ),
)( BlockContextualToolbar );
