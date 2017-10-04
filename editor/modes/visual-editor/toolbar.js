/**
 * External Dependencies
 */
import { Slot } from 'react-slot-fill';

/**
 * WordPress Dependencies
 */
import { Component } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';

const { LEFT, RIGHT, ESCAPE, ALT } = keycodes;

class VisualEditorToolbar extends Component {
	constructor() {
		super( ...arguments );
		this.bindNode = this.bindNode.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keyup', this.onKeyUp );
	}

	componentWillUnmout() {
		document.removeEventListener( 'keyup', this.onKeyUp );
	}

	bindNode( ref ) {
		this.toolbar = ref;
	}

	onKeyUp( event ) {
		const selectedBlock = document.querySelector( '.editor-visual-editor__block.is-selected' );
		const tabbables = focus.tabbable.find( this.toolbar );
		const indexOfTabbable = tabbables.indexOf( document.activeElement );

		if ( event.keyCode === ALT ) {
			if ( tabbables.length ) {
				tabbables[ 0 ].focus();
			}
			return;
		}

		switch ( event.keyCode ) {
			case ESCAPE:
				if ( indexOfTabbable !== -1 && selectedBlock ) {
					selectedBlock.focus();
				}
				break;
			case LEFT:
				if ( indexOfTabbable > 0 ) {
					tabbables[ indexOfTabbable - 1 ].focus();
				}
				break;
			case RIGHT:
				if ( indexOfTabbable !== -1 && indexOfTabbable !== tabbables.length - 1 ) {
					tabbables[ indexOfTabbable + 1 ].focus();
				}
				break;
		}
	}

	render() {
		return (
			<div
				className="editor-visual-editor__block-toolbar"
				ref={ this.bindNode }
			>
				<div className="editor-visual-editor__block-toolbar-content">
					<Slot name="Block.Toolbar" />
				</div>
			</div>
		);
	}
}

export default VisualEditorToolbar;
