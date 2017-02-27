/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import tinymce from 'tinymce';
import { isEqual } from 'lodash';

import { parse } from 'parsers/block';

function initialize( node, onSetup ) {
	if ( ! node ) {
		return;
	}

	tinymce.init( {
		target: node.querySelector( '[contenteditable=true]' ),
		theme: false,
		inline: true,
		toolbar: false,
		skin_url: '//s1.wp.com/wp-includes/js/tinymce/skins/lightgray',
		entity_encoding: 'raw',
		setup: onSetup
	} );
}

export default class EditableComponent extends Component {
	static defaultProps = {
		onChange: () => {},
		initialContent: ''
	};

	componentDidMount() {
		initialize( this.node, this.onSetup );
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

	onKeyDown = ( event ) => {
		if ( event.keyCode === 38 ) {
			const range = this.editor.selection.getRng();
			if ( range.startOffset === 0 && this.editor.getBody().firstChild === this.editor.selection.getStart() ) {
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
		}
	}

	onSetup = ( editor ) => {
		this.editor = editor;

		editor.on( 'init', this.setInitialContent );
		editor.on( 'change focusout undo redo', this.onChange );
		editor.on( 'keydown', this.onKeyDown );
	};

	setInitialContent = () => {
		this.editor.setContent( this.props.initialContent );
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
