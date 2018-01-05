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
import 'element-closest';

/**
 * WordPress dependencies
 */
import { createElement, Component, renderToString } from '@wordpress/element';
import { keycodes, createBlobURL } from '@wordpress/utils';
import { Slot, Fill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { rawHandler } from '../api';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
import { pickAriaProps } from './aria';
import patterns from './patterns';
import { EVENTS } from './constants';

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

function isLinkBoundary( fragment ) {
	return fragment.childNodes && fragment.childNodes.length === 1 &&
		fragment.childNodes[ 0 ].nodeName === 'A' && fragment.childNodes[ 0 ].text.length === 1 &&
		fragment.childNodes[ 0 ].text[ 0 ] === '\uFEFF';
}

function getFormatProperties( formatName, parents ) {
	switch ( formatName ) {
		case 'link' : {
			const anchor = find( parents, node => node.nodeName.toLowerCase() === 'a' );
			return !! anchor ? { value: anchor.getAttribute( 'href' ) || '', target: anchor.getAttribute( 'target' ) || '', node: anchor } : {};
		}
		default:
			return {};
	}
}

const DEFAULT_FORMATS = [ 'bold', 'italic', 'strikethrough', 'link' ];

export default class Editable extends Component {
	constructor( props ) {
		super( ...arguments );

		const { value } = props;
		if ( 'production' !== process.env.NODE_ENV && undefined !== value &&
					! Array.isArray( value ) ) {
			// eslint-disable-next-line no-console
			console.error(
				`Invalid value of type ${ typeof value } passed to Editable ` +
				'(expected array). Attribute values should be sourced using ' +
				'the `children` source when used with Editable.\n\n' +
				'See: https://wordpress.org/gutenberg/handbook/reference/attributes/#children'
			);
		}

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
		this.onPastePreProcess = this.onPastePreProcess.bind( this );
		this.onPaste = this.onPaste.bind( this );

		this.state = {
			formats: {},
			empty: ! value || ! value.length,
			selectedNodeId: 0,
		};
	}

	/**
	 * Retrieves the settings for this block.
	 *
	 * Allows passing in settings which will be overwritten.
	 *
	 * @param {Object} settings The settings to overwrite.
	 * @returns {Object} The settings for this block.
	 */
	getSettings( settings ) {
		return ( this.props.getSettings || identity )( {
			...settings,
			forced_root_block: this.props.multiline || false,
		} );
	}

	/**
	 * Handles the onSetup event for the tinyMCE component
	 *
	 * Will setup event handlers for the tinyMCE instance.
	 * An `onSetup` function in the props will be called if it is present.
	 *
	 * @param {tinymce} editor The editor instance as passed by tinyMCE.
	 */
	onSetup( editor ) {
		this.editor = editor;

		EVENTS.forEach( ( name ) => {
			editor.on( name, this.proxyPropHandler( name ) );
		} );

		editor.on( 'init', this.onInit );
		editor.on( 'focusout', this.onChange );
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'focusin', this.onFocus );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'selectionChange', this.onSelectionChange );
		editor.on( 'BeforeExecCommand', this.maybePropagateUndo );
		editor.on( 'PastePreProcess', this.onPastePreProcess, true /* Add before core handlers */ );
		editor.on( 'paste', this.onPaste, true /* Add before core handlers */ );

		patterns.apply( this, [ editor ] );

		if ( this.props.onSetup ) {
			this.props.onSetup( editor );
		}
	}

	/**
	 * Allows prop event handlers to handle an event
	 *
	 * Allow props an opportunity to handle the event, before default
	 * Editable behavior takes effect. Should the event be handled by a
	 * prop, it should `stopImmediatePropagation` on the event to stop
	 * continued event handling.
	 *
	 * @param {string} name The name of the event.
	 * @returns {void}
	*/
	proxyPropHandler( name ) {
		return ( event ) => {
			// TODO: Reconcile with `onFocus` instance handler which does not
			// pass the event object. Otherwise we have double focus handling
			// and editor instance being stored into state.
			if ( name === 'Focus' ) {
				return;
			}

			// Allow props an opportunity to handle the event, before default
			// Editable behavior takes effect. Should the event be handled by a
			// prop, it should `stopImmediatePropagation` on the event to stop
			// continued event handling.
			if ( 'function' === typeof this.props[ 'on' + name ] ) {
				this.props[ 'on' + name ]( event );
			}
		};
	}

	onInit() {
		this.updateFocus();
		this.registerCustomFormatters();
	}

	adaptFormatter( options ) {
		switch ( options.type ) {
			case 'inline-style': {
				return {
					inline: 'span',
					styles: { ...options.style },
				};
			}
		}
	}

	registerCustomFormatters() {
		forEach( this.props.formatters, ( formatter ) => {
			this.editor.formatter.register( formatter.format, this.adaptFormatter( formatter ) );
		} );
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

	/**
	 * Handles the global selection change event.
	 *
	 * Will call the onFocus handler if one is defined and this block is focused.
	 */
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

	/**
	 * Handles an undo event from tinyMCE
	 *
	 * When user attempts Undo when empty Undo stack, propagate undo
	 * action to context handler. The compromise here is that: TinyMCE
	 * handles Undo until change, at which point `editor.save` resets
	 * history. If no history exists, let context handler have a turn.
	 * Defer in case an immediate undo causes TinyMCE to be destroyed,
	 * if other undo behaviors test presence of an input field.
	 *
	 * @param {UndoEvent} event The undo event as triggered by tinyMCE.
	 */
	maybePropagateUndo( event ) {
		const { onUndo } = this.context;
		if ( onUndo && event.command === 'Undo' && ! this.editor.undoManager.hasUndo() ) {
			defer( onUndo );

			// We could return false here to stop other TinyMCE event handlers
			// from running, but we assume TinyMCE won't do anything on an
			// empty undo stack anyways.
		}
	}

	/**
	 * Handles a paste event from tinyMCE
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {PasteEvent} event The paste event as triggered by tinyMCE.
	 */
	onPaste( event ) {
		const dataTransfer = event.clipboardData || event.dataTransfer || this.editor.getDoc().dataTransfer;
		const { items = [], files = [] } = dataTransfer;
		const item = find( [ ...items, ...files ], ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) );

		if ( item ) {
			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received item:\n\n', item );

			const blob = item.getAsFile ? item.getAsFile() : item;

			this.pastedContent = `<img src="${ createBlobURL( blob ) }">`;
		}

		this.pastedPlainText = dataTransfer ? dataTransfer.getData( 'text/plain' ) : '';
		this.isPlainTextPaste = ( dataTransfer &&
			dataTransfer.types.length === 1 &&
			dataTransfer.types[ 0 ] === 'text/plain' );
	}

	/**
	 * Handles a PrePasteProcess event from tinyMCE
	 *
	 * Will call the paste handler with the pasted data. If it is a string tries
	 * to put it in the containing tinyMCE editor. Otherwise call the `onSplit` handler.
	 *
	 * @param {PrePasteProcessEvent} event The PrePasteProcess event as triggered by tinyMCE.
	 */
	onPastePreProcess( event ) {
		const HTML = this.isPlainTextPaste ? this.pastedPlainText : event.content;
		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', this.pastedContent || HTML );
		window.console.log( 'Received plain text:\n\n', this.pastedPlainText );

		// There is a selection, check if a link is pasted.
		if ( ! this.editor.selection.isCollapsed() ) {
			const linkRegExp = /^(?:https?:)?\/\/\S+$/i;
			const pastedText = event.content.replace( /<[^>]+>/g, '' ).trim();
			const selectedText = this.editor.selection.getContent().replace( /<[^>]+>/g, '' ).trim();

			// The pasted text is a link, and the selected text is not.
			if ( linkRegExp.test( pastedText ) && ! linkRegExp.test( selectedText ) ) {
				this.editor.execCommand( 'mceInsertLink', false, {
					href: this.editor.dom.decode( pastedText ),
				} );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', pastedText );

				event.preventDefault();

				return;
			}
		}

		const rootNode = this.editor.getBody();
		const isEmpty = this.editor.dom.isEmpty( rootNode );

		let mode = 'INLINE';

		if ( isEmpty && this.props.onReplace ) {
			mode = 'BLOCKS';
		} else if ( this.props.onSplit ) {
			mode = 'AUTO';
		}

		const content = rawHandler( {
			HTML: this.pastedContent || HTML,
			plainText: this.pastedPlainText,
			mode,
			tagName: this.props.tagName,
		} );

		if ( typeof content === 'string' ) {
			// Let MCE process further with the given content.
			event.content = content;
		} else if ( this.props.onSplit ) {
			// Abort pasting to split the content
			event.preventDefault();

			if ( ! content.length ) {
				return;
			}

			if ( isEmpty && this.props.onReplace ) {
				this.props.onReplace( content );
			} else {
				this.splitContent( content );
			}
		}
	}

	fireChange() {
		this.savedContent = this.getContent();
		this.editor.save();
		this.props.onChange( this.savedContent );
	}

	/**
	 * Handles any case where the content of the tinyMCE instance has changed.
	 */
	onChange() {
		// Note that due to efficiency, speed and low cost requirements isDirty may
		// not reflect reality for a brief period immediately after a change.
		if ( this.editor.isDirty() ) {
			this.fireChange();
		}
	}

	/**
	 * Determines the DOM rectangle for the selection in the editor.
	 *
	 * @returns {DOMRect} The DOMRect based on the selection in the editor.
	 */
	getEditorSelectionRect() {
		let range = this.editor.selection.getRng();

		// getBoundingClientRect doesn't work in Safari when range is collapsed
		if ( range.collapsed ) {
			const { startContainer, startOffset } = range;
			range = document.createRange();

			if ( ( ! startContainer.nodeValue ) || startContainer.nodeValue.length === 0 ) {
				// container has no text content, select node (empty block)
				range.selectNode( startContainer );
			} else if ( startOffset === startContainer.nodeValue.length ) {
				// at end of text content, select last character
				range.setStart( startContainer, startContainer.nodeValue.length - 1 );
				range.setEnd( startContainer, startContainer.nodeValue.length );
			} else {
				// select 1 character from current position
				range.setStart( startContainer, startOffset );
				range.setEnd( startContainer, startOffset + 1 );
			}
		}

		return range.getBoundingClientRect();
	}

	/**
	 * Calculates the relative position where the link toolbar should be.
	 *
	 * Based on the selection of the text inside this element a position is
	 * calculated where the toolbar should be. This can be used downstream to
	 * absolutely position the toolbar. It does this by finding the closest
	 * relative element.
	 *
	 * @returns {{top: number, left: number}} The desired position of the toolbar.
	 */
	getFocusPosition() {
		const position = this.getEditorSelectionRect();

		// Find the parent "relative" positioned container
		const container = this.props.inlineToolbar ?
			this.editor.getBody().closest( '.blocks-editable' ) :
			this.editor.getBody().closest( '.editor-block-list__block' );
		const containerPosition = container.getBoundingClientRect();
		const blockPadding = 14;
		const blockMoverMargin = 18;

		// These offsets are necessary because the toolbar where the link modal lives
		// is absolute positioned and it's not shown when we compute the position here
		// so we compute the position about its parent relative position and adds the offset
		const toolbarOffset = this.props.inlineToolbar ?
			{ top: 10, left: 0 } :
			{ top: 0, left: -( ( blockPadding * 2 ) + blockMoverMargin ) };
		const linkModalWidth = 305;

		return {
			top: position.top - containerPosition.top + ( position.height ) + toolbarOffset.top,
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left,
		};
	}

	/**
	 * Determines if the current selection within the editor is at the start.
	 *
	 * @returns {boolean} Whether or not the selection is at the start of the editor.
	 */
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

	/**
	 * Determines if the current selection within the editor is at the end.
	 *
	 * @returns {boolean} Whether or not the selection is at the end of the editor.
	 */
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

	/**
	 * Handles a keydown event from tinyMCE
	 *
	 * @param {KeydownEvent} event The keydow event as triggered by tinyMCE.
	 */
	onKeyDown( event ) {
		const dom = this.editor.dom;
		const rootNode = this.editor.getBody();

		if (
			( event.keyCode === BACKSPACE && this.isStartOfEditor() ) ||
			( event.keyCode === DELETE && this.isEndOfEditor() )
		) {
			if ( ! this.props.onMerge && ! this.props.onRemove ) {
				return;
			}

			this.fireChange();

			const forward = event.keyCode === DELETE;

			if ( this.props.onMerge ) {
				this.props.onMerge( forward );
			}

			if ( this.props.onRemove && dom.isEmpty( rootNode ) ) {
				this.props.onRemove( forward );
			}

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

				const selectedNode = this.editor.selection.getNode();

				if ( selectedNode.parentNode !== rootNode ) {
					return;
				}

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
					event.stopImmediatePropagation();
					this.splitContent();
				}
			}
		}
	}

	/**
	 * Handles tinyMCE key up event
	 *
	 * @param {number} keyCode The key code that has been pressed on the keyboard.
	 */
	onKeyUp( { keyCode } ) {
		if ( keyCode === BACKSPACE ) {
			this.onSelectionChange();
		}
	}

	/**
	 * Splits the content at the location of the selection.
	 *
	 * Replaces the content of the editor inside this element with the contents
	 * before the selection. Sends the elements after the selection to the `onSplit`
	 * handler.
	 *
	 * @param {Array} blocks The blocks to add after the split point.
	 */
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
			const afterElement = isLinkBoundary( afterFragment ) ? [] : nodeListToReact( afterFragment.childNodes, createTinyMCEElement );

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

	onNodeChange( { parents } ) {
		const formatNames = this.props.formattingControls;
		const formats = this.editor.formatter.matchAll( formatNames ).reduce( ( accFormats, activeFormat ) => {
			accFormats[ activeFormat ] = {
				isActive: true,
				...getFormatProperties( activeFormat, parents ),
			};

			return accFormats;
		}, {} );

		const focusPosition = this.getFocusPosition();
		this.setState( { formats, focusPosition, selectedNodeId: this.state.selectedNodeId + 1 } );
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
		// We can't update focus if the editor hasn't finished initializing.
		// Initialization callback `onInit` will call this function anyways.
		if ( ! this.editor ) {
			return;
		}

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

	componentWillReceiveProps( nextProps ) {
		if ( 'development' === process.env.NODE_ENV ) {
			if ( ! isEqual( this.props.formatters, nextProps.formatters ) ) {
				// eslint-disable-next-line no-console
				console.error( 'Formatters passed via `formatters` prop will only be registered once. Formatters can be enabled/disabled via the `formattingControls` prop.' );
			}
		}
	}

	isFormatActive( format ) {
		return this.state.formats[ format ] && this.state.formats[ format ].isActive;
	}

	removeFormat( format ) {
		this.editor.focus();
		this.editor.formatter.remove( format );
	}
	applyFormat( format, args, node ) {
		this.editor.focus();
		this.editor.formatter.apply( format, args, node );
	}

	changeFormats( formats ) {
		forEach( formats, ( formatValue, format ) => {
			if ( format === 'link' ) {
				if ( formatValue !== undefined ) {
					const anchor = this.editor.dom.getParent( this.editor.selection.getNode(), 'a' );
					if ( ! anchor ) {
						this.removeFormat( 'link' );
					}
					this.applyFormat( 'link', { href: formatValue.value, target: formatValue.target }, anchor );
				} else {
					this.editor.execCommand( 'Unlink' );
				}
			} else {
				const isActive = this.isFormatActive( format );
				if ( isActive && ! formatValue ) {
					this.removeFormat( format );
				} else if ( ! isActive && formatValue ) {
					this.applyFormat( format );
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
			wrapperClassName,
			className,
			inlineToolbar = false,
			formattingControls,
			placeholder,
			multiline: MultilineTag,
			keepPlaceholderOnFocus = false,
			formatters,
		} = this.props;

		const ariaProps = pickAriaProps( this.props );

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ( ! focus || keepPlaceholderOnFocus ) && this.state.empty;
		const classes = classnames( wrapperClassName, 'blocks-editable' );

		const formatToolbar = (
			<FormatToolbar
				selectedNodeId={ this.state.selectedNodeId }
				focusPosition={ this.state.focusPosition }
				formats={ this.state.formats }
				onChange={ this.changeFormats }
				enabledControls={ formattingControls }
				customControls={ formatters }
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
					aria-label={ placeholder }
					{ ...ariaProps }
					className={ className }
					key={ key }
				/>
				{ isPlaceholderVisible &&
					<Tagname
						className={ classnames( 'blocks-editable__tinymce', className ) }
						style={ style }
					>
						{ MultilineTag ? <MultilineTag>{ placeholder }</MultilineTag> : placeholder }
					</Tagname>
				}
				{ focus && <Slot name="Editable.Siblings" /> }
			</div>
		);
	}
}

Editable.contextTypes = {
	onUndo: noop,
};

Editable.defaultProps = {
	formattingControls: DEFAULT_FORMATS,
	formatters: [],
};
