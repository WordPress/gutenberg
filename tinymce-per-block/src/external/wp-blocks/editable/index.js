/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import tinymce from 'tinymce';
import { isEqual, last } from 'lodash';

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
		setup: onSetup,
		formats: {
			strikethrough: { inline: 'del' }
		}
	};

	if ( inline ) {
		config.valid_elements = '#p,br,b,i,strong,em,del,a[href|target]';
	}

	tinymce.init( config );
}

export default class EditableComponent extends Component {
	static defaultProps = {
		onChange: () => {},
		splitValue: () => {},
		onFocusChange: () => {},
		onType: () => {},
		initialContent: '',
		inline: false,
		single: false,
	};

	componentDidMount() {
		initialize( this.node, this.props.inline, this.onSetup );
		if ( this.props.focusConfig ) {
			this.focus();
		}
	}

	updateContent() {
		// This could not be called on each content change, it used to change the cursor position
		let bookmark;
		if ( this.props.focusConfig ) {
			bookmark = this.editor.selection.getBookmark( 2, true );
		}
		this.editor.setContent( this.props.content );
		if ( this.props.focusConfig ) {
			this.editor.selection.moveToBookmark( bookmark );
		}
	}

	executeCommand = ( ...args ) => {
		this.editor.execCommand( ...args );
	};

	componentWillUnmount() {
		if ( this.editor ) {
			this.editor.destroy();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.focusConfig !== prevProps.focusConfig && this.props.focusConfig ) {
			this.focus();
		}

		if ( this.props.content !== prevProps.content ) {
			this.updateContent();
		}
	}

	focus() {
		if ( this.props.focusConfig.bookmark ) {
			return;
		}
		const { start = false, end = false, bookmark = false } = this.props.focusConfig;
		this.editor.focus();
		if ( start ) {
			this.editor.focus();
			this.editor.selection.setCursorLocation( undefined, 0 );
		} else if ( end ) {
			this.editor.selection.select( this.editor.getBody(), true );
			this.editor.selection.collapse( false );
		} else if ( bookmark ) {
			// this.editor.selection.moveToBookmark( bookmark );
		}
	}

	isStartOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.startOffset !== 0 || ! range.collapsed ) {
			return false;
		}
		const start = range.startContainer;
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
		if ( event.keyCode === 38 || event.keyCode === 37 ) {
			if ( this.isStartOfEditor() ) {
				event.preventDefault();
				this.props.moveCursorUp();
			}
		} else if ( event.keyCode === 40 || event.keyCode === 39 ) {
			const bookmark = this.editor.selection.getBookmark();
			this.editor.selection.select( this.editor.getBody(), true );
			this.editor.selection.collapse( false );
			const finalBookmark = this.editor.selection.getBookmark( 2, true );
			this.editor.selection.moveToBookmark( bookmark );
			if ( isEqual( this.editor.selection.getBookmark( 2, true ), finalBookmark ) ) {
				event.preventDefault();
				this.props.moveCursorDown();
			}
		} else if ( event.keyCode === 13 ) {
			// Wait for the event to propagate
			setTimeout( () => {
				this.editor.selection.getStart();
				// Remove bogus nodes to avoid grammar bugs
				Array.from( this.editor.getBody().querySelectorAll( '[data-mce-bogus]' ) )
					.forEach( node => node.removeAttribute( 'data-mce-bogus' ) );

				const childNodes = Array.from( this.editor.getBody().childNodes );
				const splitIndex = childNodes.indexOf( this.editor.selection.getStart() );
				const getHtml = ( nodes ) => nodes.reduce( ( memo, node ) => memo + node.outerHTML, '' );
				const beforeNodes = childNodes.slice( 0, splitIndex );
				const lastNodeBeforeCursor = last( beforeNodes );
				let before = getHtml( beforeNodes );
				const after = getHtml( childNodes.slice( splitIndex ) );
				const hasAfter = !! childNodes.slice( splitIndex )
					.reduce( ( memo, node ) => memo + node.textContent, '' );

				// Single enter adds a new inline
				// Double enter adds a new block
				if (
					! this.props.single &&
					!! lastNodeBeforeCursor &&
					lastNodeBeforeCursor.innerHTML !== '<br>'
				) {
					return;
				} else if (
					! this.props.single &&
					!! lastNodeBeforeCursor &&
					lastNodeBeforeCursor.innerHTML === '<br>'
				) {
					before = getHtml( beforeNodes.slice( 0, beforeNodes.length - 1 ) );
				}

				this.editor.setContent( this.props.content );
				this.props.splitValue( before, hasAfter ? after : '' );
			} );
		} else if ( event.keyCode === 8 ) {
			if ( this.isStartOfEditor() ) {
				event.preventDefault();
				if ( this.editor.getBody().textContent ) {
					this.onChange();
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

	syncToolbar = ( event ) => {
		if ( ! this.props.setToolbarState ) {
			return;
		}
		const formats = [
			{ id: 'bold', nodes: [ 'STRONG', 'B' ] },
			{ id: 'italic', nodes: [ 'EM', 'I' ] },
			{ id: 'strikethrough', nodes: [ 'DEL' ] }
		];
		formats.forEach( format => {
			const formatValue =
				format.nodes.indexOf( event.element.nodeName ) !== -1 ||
				!! event.parents.find( parent => format.nodes.indexOf( parent.nodeName ) !== -1 );
			this.props.setToolbarState( format.id, formatValue );
		} );

		// Link format
		const link = event.element.nodeName === 'A'
			? event.element
			: event.parents.find( parent => parent.nodeName === 'A' );
		const linkValue = link ? link.getAttribute( 'href' ) : '';
		this.props.setToolbarState( 'link', linkValue );
	};

	onFocus = () => {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.props.onFocusChange( { bookmark } );
	};

	onSetup = ( editor ) => {
		this.editor = editor;

		editor.on( 'init', this.onInit );
		editor.on( 'focusout undo redo', this.onChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'paste', this.onPaste );
		editor.on( 'nodechange', this.syncToolbar );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'paste keydown undo redo', this.props.onType );
	};

	onInit = () => {
		this.editor.setContent( this.props.content );
	};

	onChange = () => {
		// TODO: `getContent` is slow, but formats better than 'raw'. We
		// should check implication of performance and see if we can rely
		// on raw formatting instead.
		const content = this.editor.getContent();
		if ( content === this.props.content ) {
			return;
		}

		this.props.onChange( content );
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
