/**
 * External dependencies
 */
import tinymce from 'tinymce';
import classnames from 'classnames';
import {
	last,
	isEqual,
	omitBy,
	forEach,
	merge,
	identity,
	find,
	defer,
	noop,
} from 'lodash';
import { nodeListToReact } from 'dom-react';
import { Fill } from 'react-slot-fill';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { createElement, Component, renderToString } from '@wordpress/element';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import './style.scss';
import { parse, pasteHandler } from '../api';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
import patterns from './patterns';

const { BACKSPACE, DELETE, ENTER } = keycodes;

function createTinyMCEElement( type, props, ...children ) {
	if ( props[ 'data-mce-bogus' ] === 'all' ) {
		return null;
	}

	if ( props.hasOwnProperty( 'data-mce-bogus' ) ) {
		return children;
	}

	return createElement(
		type,
		omitBy( props, ( value, key ) => key.indexOf( 'data-mce-' ) === 0 ),
		...children
	);
}

export default class Editable extends Component {
	constructor( props ) {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.getSettings = this.getSettings.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.maybePropagateUndo = this.maybePropagateUndo.bind( this );
		this.onPastePostProcess = this.onPastePostProcess.bind( this );

		this.state = {
			formats: {},
			bookmark: null,
			empty: ! props.value || ! props.value.length,
		};
	}

	getSettings( settings ) {
		return ( this.props.getSettings || identity )( {
			...settings,
			forced_root_block: this.props.multiline || false,
		} );
	}

	onSetup( editor ) {
		this.editor = editor;
		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'selectionChange', this.onSelectionChange );
		editor.on( 'BeforeExecCommand', this.maybePropagateUndo );
		editor.on( 'PastePostProcess', this.onPastePostProcess );

		patterns.apply( this, [ editor ] );

		if ( this.props.onSetup ) {
			this.props.onSetup( editor );
		}
	}

	onInit() {
		this.updateFocus();
	}

	onFocus() {
		if ( ! this.props.onFocus ) {
			return;
		}

		// TODO: We need a way to save the focus position ( bookmark maybe )
		this.props.onFocus();
	}

	isActive() {
		return document.activeElement === this.editor.getBody();
	}

	onSelectionChange() {
		// We must check this because selectionChange is a global event.
		if ( ! this.isActive() ) {
			return;
		}

		const collapsed = this.editor.selection.isCollapsed();

		this.setState( {
			empty: tinymce.DOM.isEmpty( this.editor.getBody() ),
		} );

		if (
			this.props.focus && this.props.onFocus &&
			this.props.focus.collapsed !== collapsed
		) {
			this.props.onFocus( {
				...this.props.focus,
				collapsed,
			} );
		}
	}

	maybePropagateUndo( event ) {
		const { onUndo } = this.context;
		if ( onUndo && event.command === 'Undo' && ! this.editor.undoManager.hasUndo() ) {
			// When user attempts Undo when empty Undo stack, propagate undo
			// action to context handler. The compromise here is that: TinyMCE
			// handles Undo until change, at which point `editor.save` resets
			// history. If no history exists, let context handler have a turn.
			// Defer in case an immediate undo causes TinyMCE to be destroyed,
			// if other undo behaviors test presence of an input field.
			defer( onUndo );

			// We could return false here to stop other TinyMCE event handlers
			// from running, but we assume TinyMCE won't do anything on an
			// empty undo stack anyways.
		}
	}

	onPastePostProcess( event ) {
		const childNodes = Array.from( event.node.childNodes );
		const isBlockDelimiter = ( node ) =>
			node.nodeType === 8 && /^ wp:/.test( node.nodeValue );
		const isDoubleBR = ( node ) =>
			node.nodeName === 'BR' && node.previousSibling && node.previousSibling.nodeName === 'BR';
		const isBlockPart = ( node ) =>
			isDoubleBR( node ) || this.editor.dom.isBlock( node );

		// If there's no `onSplit` prop, content will later be converted to
		// inline content.
		if ( this.props.onSplit ) {
			let blocks = [];

			// Internal paste, so parse.
			if ( childNodes.some( isBlockDelimiter ) ) {
				blocks = parse( event.node.innerHTML.replace( /<meta[^>]+>/, '' ) );
			// External paste with block level content, so attempt to assign
			// blocks.
			} else if ( childNodes.some( isBlockPart ) ) {
				blocks = pasteHandler( childNodes );
			}

			if ( blocks.length ) {
				// We must wait for TinyMCE to clean up paste containers after this
				// event.
				window.setTimeout( () => this.splitContent( blocks ), 0 );
				event.preventDefault();
			}
		}
	}

	onChange() {
		if ( ! this.editor.isDirty() ) {
			return;
		}

		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	getRelativePosition( node ) {
		const position = node.getBoundingClientRect();

		// Find the parent "relative" positioned container
		const container = this.props.inlineToolbar
			? this.editor.getBody().closest( '.blocks-editable' )
			: this.editor.getBody().closest( '.editor-visual-editor__block' );
		const containerPosition = container.getBoundingClientRect();
		const blockPadding = 14;
		const blockMoverMargin = 18;

		// These offsets are necessary because the toolbar where the link modal lives
		// is absolute positioned and it's not shown when we compute the position here
		// so we compute the position about its parent relative position and adds the offset
		const toolbarOffset = this.props.inlineToolbar
			? { top: 50, left: 0 }
			: { top: 40, left: -( ( blockPadding * 2 ) + blockMoverMargin ) };
		const linkModalWidth = 250;

		return {
			top: position.top - containerPosition.top + ( position.height ) + toolbarOffset.top,
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left,
		};
	}

	isStartOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.startOffset !== 0 || ! range.collapsed ) {
			return false;
		}
		const start = range.startContainer;
		const body = this.editor.getBody();
		let element = start;
		while ( element !== body ) {
			const child = element;
			element = element.parentNode;
			if ( element.firstChild !== child ) {
				return false;
			}
		}
		return true;
	}

	isEndOfEditor() {
		const range = this.editor.selection.getRng();
		if ( range.endOffset !== range.endContainer.textContent.length || ! range.collapsed ) {
			return false;
		}
		const start = range.endContainer;
		const body = this.editor.getBody();
		let element = start;
		while ( element !== body ) {
			const child = element;
			element = element.parentNode;
			if ( element.lastChild !== child ) {
				return false;
			}
		}
		return true;
	}

	onKeyDown( event ) {
		if (
			this.props.onMerge && (
				( event.keyCode === BACKSPACE && this.isStartOfEditor() ) ||
				( event.keyCode === DELETE && this.isEndOfEditor() )
			)
		) {
			const forward = event.keyCode === DELETE;
			this.onChange();
			this.props.onMerge( forward );
			event.preventDefault();
			event.stopImmediatePropagation();
		}

		// If we click shift+Enter on inline Editables, we avoid creating two contenteditables
		// We also split the content and call the onSplit prop if provided.
		if ( event.keyCode === ENTER ) {
			if ( this.props.multiline ) {
				if ( ! this.props.onSplit ) {
					return;
				}

				const rootNode = this.editor.getBody();
				const selectedNode = this.editor.selection.getNode();

				if ( selectedNode.parentNode !== rootNode ) {
					return;
				}

				const dom = this.editor.dom;

				if ( ! dom.isEmpty( selectedNode ) ) {
					return;
				}

				event.preventDefault();

				const childNodes = Array.from( rootNode.childNodes );
				const index = dom.nodeIndex( selectedNode );
				const beforeNodes = childNodes.slice( 0, index );
				const afterNodes = childNodes.slice( index + 1 );
				const beforeElement = nodeListToReact( beforeNodes, createTinyMCEElement );
				const afterElement = nodeListToReact( afterNodes, createTinyMCEElement );

				this.setContent( beforeElement );
				this.props.onSplit( beforeElement, afterElement );
			} else {
				event.preventDefault();

				if ( event.shiftKey || ! this.props.onSplit ) {
					this.editor.execCommand( 'InsertLineBreak', false, event );
				} else {
					this.splitContent();
				}
			}
		}
	}

	onKeyUp( { keyCode } ) {
		if ( keyCode === BACKSPACE ) {
			this.onSelectionChange();
		}
	}

	splitContent( blocks = [] ) {
		const { dom } = this.editor;
		const rootNode = this.editor.getBody();
		const beforeRange = dom.createRng();
		const afterRange = dom.createRng();
		const selectionRange = this.editor.selection.getRng();

		if ( rootNode.childNodes.length ) {
			beforeRange.setStart( rootNode, 0 );
			beforeRange.setEnd( selectionRange.startContainer, selectionRange.startOffset );

			afterRange.setStart( selectionRange.endContainer, selectionRange.endOffset );
			afterRange.setEnd( rootNode, dom.nodeIndex( rootNode.lastChild ) + 1 );

			const beforeFragment = beforeRange.extractContents();
			const afterFragment = afterRange.extractContents();

			const beforeElement = nodeListToReact( beforeFragment.childNodes, createTinyMCEElement );
			const afterElement = nodeListToReact( afterFragment.childNodes, createTinyMCEElement );

			this.setContent( beforeElement );
			this.props.onSplit( beforeElement, afterElement, ...blocks );
		} else {
			this.setContent( [] );
			this.props.onSplit( [], [], ...blocks );
		}
	}

	onNewBlock() {
		if ( this.props.multiline !== 'p' || ! this.props.onSplit ) {
			return;
		}

		// Getting the content before and after the cursor
		const childNodes = Array.from( this.editor.getBody().childNodes );
		let selectedChild = this.editor.selection.getStart();
		while ( childNodes.indexOf( selectedChild ) === -1 && selectedChild.parentNode ) {
			selectedChild = selectedChild.parentNode;
		}
		const splitIndex = childNodes.indexOf( selectedChild );
		if ( splitIndex === -1 ) {
			return;
		}
		const beforeNodes = childNodes.slice( 0, splitIndex );
		const lastNodeBeforeCursor = last( beforeNodes );
		// Avoid splitting on single enter
		if (
			! lastNodeBeforeCursor ||
			beforeNodes.length < 2 ||
			!! lastNodeBeforeCursor.textContent
		) {
			return;
		}

		const before = beforeNodes.slice( 0, beforeNodes.length - 1 );

		// Removing empty nodes from the beginning of the "after"
		// avoids empty paragraphs at the beginning of newly created blocks.
		const after = childNodes.slice( splitIndex ).reduce( ( memo, node ) => {
			if ( ! memo.length && ! node.textContent ) {
				return memo;
			}

			memo.push( node );
			return memo;
		}, [] );

		// Splitting into two blocks
		this.setContent( this.props.value );

		this.props.onSplit(
			nodeListToReact( before, createTinyMCEElement ),
			nodeListToReact( after, createTinyMCEElement )
		);
	}

	onNodeChange( { element, parents } ) {
		const formats = {};
		const link = find( parents, ( node ) => node.nodeName.toLowerCase() === 'a' );
		if ( link ) {
			formats.link = { value: link.getAttribute( 'href' ) || '', node: link };
		}
		const activeFormats = this.editor.formatter.matchAll( [	'bold', 'italic', 'strikethrough' ] );
		activeFormats.forEach( ( activeFormat ) => formats[ activeFormat ] = true );

		const focusPosition = this.getRelativePosition( element );
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.setState( { bookmark, formats, focusPosition } );
	}

	updateContent() {
		const bookmark = this.editor.selection.getBookmark( 2, true );
		this.savedContent = this.props.value;
		this.setContent( this.savedContent );
		this.editor.selection.moveToBookmark( bookmark );

		// Saving the editor on updates avoid unecessary onChanges calls
		// These calls can make the focus jump
		this.editor.save();
	}

	setContent( content ) {
		if ( ! content ) {
			content = '';
		}

		content = renderToString( content );
		this.editor.setContent( content, { format: 'raw' } );
	}

	getContent() {
		return nodeListToReact( this.editor.getBody().childNodes || [], createTinyMCEElement );
	}

	updateFocus() {
		const { focus } = this.props;
		const isActive = this.isActive();

		if ( focus ) {
			if ( ! isActive ) {
				this.editor.focus();
			}

			// Offset = -1 means we should focus the end of the editable
			if ( focus.offset === -1 && ! this.isEndOfEditor() ) {
				this.editor.selection.select( this.editor.getBody(), true );
				this.editor.selection.collapse( false );
			}
		} else if ( isActive ) {
			this.editor.getBody().blur();
		}
	}

	componentWillUnmount() {
		this.onChange();
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( this.props.focus, prevProps.focus ) ) {
			this.updateFocus();
		}

		// The `savedContent` var allows us to avoid updating the content right after an `onChange` call
		if (
			this.props.tagName === prevProps.tagName &&
			this.props.value !== prevProps.value &&
			this.props.value !== this.savedContent &&
			! isEqual( this.props.value, prevProps.value ) &&
			! isEqual( this.props.value, this.savedContent )
		) {
			this.updateContent();
		}
	}

	isFormatActive( format ) {
		return !! this.state.formats[ format ];
	}

	changeFormats( formats ) {
		forEach( formats, ( formatValue, format ) => {
			if ( format === 'link' ) {
				if ( this.state.bookmark ) {
					this.editor.selection.moveToBookmark( this.state.bookmark );
				}

				if ( formatValue !== undefined ) {
					const anchor = this.editor.dom.getParent( this.editor.selection.getNode(), 'a' );
					if ( ! anchor ) {
						this.editor.formatter.remove( 'link' );
					}
					this.editor.formatter.apply( 'link', { href: formatValue.value }, anchor );
				} else {
					this.editor.execCommand( 'Unlink' );
				}
			} else {
				const isActive = this.isFormatActive( format );
				if ( isActive && ! formatValue ) {
					this.editor.formatter.remove( format );
				} else if ( ! isActive && formatValue ) {
					this.editor.formatter.apply( format );
				}
			}
		} );

		this.setState( ( state ) => ( {
			formats: merge( {}, state.formats, formats ),
		} ) );

		this.editor.setDirty( true );
	}

	render() {
		const {
			tagName: Tagname = 'div',
			style,
			value,
			focus,
			className,
			inlineToolbar = false,
			formattingControls,
			placeholder,
			multiline: MultilineTag,
		} = this.props;

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ! focus && this.state.empty;
		const classes = classnames( className, 'blocks-editable' );

		const formatToolbar = (
			<FormatToolbar
				focusPosition={ this.state.focusPosition }
				formats={ this.state.formats }
				onChange={ this.changeFormats }
				enabledControls={ formattingControls }
			/>
		);

		return (
			<div className={ classes }>
				{ focus &&
					<Fill name="Formatting.Toolbar">
						{ ! inlineToolbar && formatToolbar }
					</Fill>
				}
				{ focus && inlineToolbar &&
					<div className="block-editable__inline-toolbar">
						{ formatToolbar }
					</div>
				}
				<TinyMCE
					tagName={ Tagname }
					getSettings={ this.getSettings }
					onSetup={ this.onSetup }
					style={ style }
					defaultValue={ value }
					isPlaceholderVisible={ isPlaceholderVisible }
					label={ placeholder }
					key={ key }
				/>
				{ isPlaceholderVisible &&
					<Tagname
						className="blocks-editable__tinymce"
						style={ style }
					>
						{ MultilineTag ? <MultilineTag>{ placeholder }</MultilineTag> : placeholder }
					</Tagname>
				}
			</div>
		);
	}
}

Editable.contextTypes = {
	onUndo: noop,
};
