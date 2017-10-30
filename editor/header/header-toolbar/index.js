/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, NavigableMenu } from '@wordpress/components';
import { Component, findDOMNode } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import { hasEditorUndo, hasEditorRedo } from '../../selectors';
import { isMac } from '../../utils/dom';

/**
 * Module Constants
 */
const { ESCAPE, F10 } = keycodes;

function metaKeyPressed( event ) {
	return isMac() ? event.metaKey : ( event.ctrlKey && ! event.altKey );
}

class HeaderToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.bindNode = this.bindNode.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onToolbarKeyDown = this.onToolbarKeyDown.bind( this );

		// it's not easy to know if the user only clicked on a "meta" key without simultaneously clicking on another key
		// We keep track of the key counts to ensure it's reliable
		this.metaCount = 0;
	}

	componentDidMount() {
		document.addEventListener( 'keyup', this.onKeyUp );
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keyup', this.onKeyUp );
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	bindNode( ref ) {
		// Disable reason: Need DOM node for finding first focusable element
		// on keyboard interaction to shift to toolbar.
		// eslint-disable-next-line react/no-find-dom-node
		this.toolbar = findDOMNode( ref );
	}

	onKeyDown( event ) {
		if ( metaKeyPressed( event ) ) {
			this.metaCount++;
		}
	}

	onKeyUp( event ) {
		const shouldFocusToolbar = this.metaCount === 1 || ( event.keyCode === F10 && event.altKey );
		this.metaCount = 0;

		if ( shouldFocusToolbar ) {
			const tabbables = focus.tabbable.find( this.toolbar );
			if ( tabbables.length ) {
				tabbables[ 0 ].focus();
			}
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
		const { hasUndo, hasRedo, undo, redo } = this.props;
		return (
			<NavigableMenu
				className="editor-header-toolbar"
				orientation="horizontal"
				role="toolbar"
				deep
				aria-label={ __( 'Editor Toolbar' ) }
				ref={ this.bindNode }
				onKeyDown={ this.onToolbarKeyDown }
			>
				<Inserter position="bottom right" />
				<IconButton
					icon="undo"
					label={ __( 'Undo' ) }
					disabled={ ! hasUndo }
					onClick={ undo } />
				<IconButton
					icon="redo"
					label={ __( 'Redo' ) }
					disabled={ ! hasRedo }
					onClick={ redo } />
				<div className="editor-header-toolbar__block-toolbar">
					<Slot name="Editor.Header" />
				</div>
			</NavigableMenu>
		);
	}
}

export default connect(
	( state ) => ( {
		hasUndo: hasEditorUndo( state ),
		hasRedo: hasEditorRedo( state ),
	} ),
	( dispatch ) => ( {
		undo: () => dispatch( { type: 'UNDO' } ),
		redo: () => dispatch( { type: 'REDO' } ),
	} )
)( HeaderToolbar );
