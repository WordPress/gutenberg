/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import tinymce from 'tinymce';
import { isEqual } from 'lodash';

import { parse } from 'parsers/block';

function initialize( node, inline, onSetup ) {
	if ( ! node ) {
		return;
	}

	const config = {
		target: node.querySelector( '[contenteditable=true]' ),
		theme: false,
		inline: true,
		toolbar: false,
		skin_url: '//s1.wp.com/wp-includes/js/tinymce/skins/lightgray',
		entity_encoding: 'raw',
		setup: onSetup
	};

	if ( inline ) {
		config.valid_elements = '#p,br,b,i,strong,em';
	}

	tinymce.init( config );
}

export default class EditableComponent extends Component {
	static defaultProps = {
		onChange: () => {},
		splitValue: () => {},
		initialContent: '',
		inline: false,
		single: false,
	};

	componentDidMount() {
		initialize( this.node, this.props.inline, this.onSetup );
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.content !== this.props.content ) {
			const bookmark = this.editor.selection.getBookmark( 2, true );
			this.editor.setContent( this.props.content );
			this.editor.selection.moveToBookmark( bookmark );
		}
	}

	componentWillUnmount() {
		if ( this.editor ) {
			this.editor.destroy();
		}
	}

	focus( position ) {
		this.editor.focus();
		if ( position !== undefined ) {
			this.editor.selection.setCursorLocation( undefined, position );
		} else {
			this.editor.selection.select( this.editor.getBody(), true );
			this.editor.selection.collapse( false );
		}
	}

	isStartOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.startOffset !== 0 || ! range.collapsed ) {
			return false;
		}
		const start = this.editor.selection.getStart();
		const body = this.editor.getBody();
		let element = start;
		do {
			const child = element;
			element = element.parentNode;
			if ( element.childNodes[ 0 ] !== child ) {
				return false;
			}
		} while ( element !== body );
		return true;
	}

	onKeyDown = ( event ) => {
		if ( event.keyCode === 38 ) {
			if ( this.isStartOfEditor() ) {
				event.preventDefault();
				this.props.moveUp();
			}
		} else if ( event.keyCode === 40 ) {
			const bookmark = this.editor.selection.getBookmark();
			this.focus();
			const finalBookmark = this.editor.selection.getBookmark( 2, true );
			this.editor.selection.moveToBookmark( bookmark );
			if ( isEqual( this.editor.selection.getBookmark( 2, true ), finalBookmark ) ) {
				event.preventDefault();
				this.props.moveDown();
			}
		} else if ( event.keyCode === 13 && this.props.single ) {
			// Wait for the event to propagate
			setTimeout( () => {
				this.editor.selection.getStart();
				// Remove bogus nodes to avoid grammar bugs
				Array.from( this.editor.getBody().querySelectorAll( '[data-mce-bogus]' ) )
					.forEach( node => node.remove() );

				const childNodes = Array.from( this.editor.getBody().childNodes );
				const splitIndex = childNodes.indexOf( this.editor.selection.getStart() );
				const getHtml = ( nodes ) => nodes.reduce( ( memo, node ) => memo + node.outerHTML, '' );
				const before = getHtml( childNodes.slice( 0, splitIndex ) );
				const after = getHtml( childNodes.slice( splitIndex ) );
				const hasAfter = !! childNodes.slice( splitIndex )
					.reduce( ( memo, node ) => memo + node.textContent, '' );
				this.editor.setContent( before );
				this.props.splitValue( parse( before ), hasAfter ? parse( after ) : '' );
			} );
		} else if ( event.keyCode === 8 ) {
			if ( this.isStartOfEditor() ) {
				event.preventDefault();
				if ( this.editor.getBody().textContent ) {
					this.props.mergeWithPrevious();
				} else {
					this.props.remove();
				}
			}
		}
	}

	onPaste = ( event ) => {
		if ( this.props.inline ) {
			event.preventDefault();
			const clipboardData = event.clipboardData || window.clipboardData;
			const text = clipboardData.getData( 'Text' );
			this.editor.execCommand( 'mceInsertContent', false, text );
		}
	}

	onSetup = ( editor ) => {
		this.editor = editor;

		editor.on( 'init', this.setInitialContent );
		editor.on( 'change keyup focusout undo redo', this.onChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'paste', this.onPaste );
	};

	setInitialContent = () => {
		this.editor.setContent( this.props.content );
	};

	onChange = () => {
		// TODO: `getContent` is slow, but formats better than 'raw'. We
		// should check implication of performance and see if we can rely
		// on raw formatting instead.
		const content = this.editor.getContent();
		if ( content === this.content ) {
			return;
		}

		this.props.onChange( parse( content ) );
	};

	setRef = ( node ) => {
		this.node = node;
	};

	render() {
		return (
			<div ref={ this.setRef }>
				<div contentEditable />
			</div>
		);
	}
}
