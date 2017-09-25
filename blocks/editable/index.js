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
import { pasteHandler } from '../api';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
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
				'See: http://gutenberg-devdoc.surge.sh/reference/attributes/#children'
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
		this.onBeforePastePreProcess = this.onBeforePastePreProcess.bind( this );

		this.state = {
			formats: {},
			empty: ! value || ! value.length,
			selectedNodeId: 0,
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
		editor.on( 'BeforePastePreProcess', this.onBeforePastePreProcess );

		patterns.apply( this, [ editor ] );

		if ( this.props.onSetup ) {
			this.props.onSetup( editor );
		}
	}

	proxyPropHandler( name ) {
		return ( event ) => {
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

	onBeforePastePreProcess( event ) {
		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', event.content );

		const content = pasteHandler( {
			content: event.content,
			inline: ! this.props.onSplit,
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

			const rootNode = this.editor.getBody();

			if ( this.editor.dom.isEmpty( rootNode ) && this.props.onReplace ) {
				this.props.onReplace( content );
			} else {
				this.splitContent( content );
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

	getFocusPosition() {
		const position = this.getEditorSelectionRect();

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
		const formats = {};
		const link = find( parents, ( node ) => node.nodeName.toLowerCase() === 'a' );
		if ( link ) {
			formats.link = { value: link.getAttribute( 'href' ) || '', target: link.getAttribute( 'target' ) || '', node: link };
		}
		const activeFormats = this.editor.formatter.matchAll( [	'bold', 'italic', 'strikethrough' ] );
		activeFormats.forEach( ( activeFormat ) => formats[ activeFormat ] = true );

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
			wrapperClassname,
			className,
			inlineToolbar = false,
			formattingControls,
			placeholder,
			multiline: MultilineTag,
			keepPlaceholderOnFocus = false,
		} = this.props;

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ( ! focus || keepPlaceholderOnFocus ) && this.state.empty;
		const classes = classnames( wrapperClassname, 'blocks-editable' );

		const formatToolbar = (
			<FormatToolbar
				selectedNodeId={ this.state.selectedNodeId }
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
			</div>
		);
	}
}

Editable.contextTypes = {
	onUndo: noop,
};
