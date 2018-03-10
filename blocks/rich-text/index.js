/**
 * External dependencies
 */
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
	reject,
} from 'lodash';
import { nodeListToReact } from 'dom-react';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { createElement, Component, renderToString } from '@wordpress/element';
import { keycodes, createBlobURL, isHorizontalEdge, getRectangleFromRange } from '@wordpress/utils';
import { withSafeTimeout, Slot, Fill } from '@wordpress/components';

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

export function createTinyMCEElement( type, props, ...children ) {
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

/**
 * Returns true if the node is the inline node boundary. This is used in node
 * filtering prevent the inline boundary from being included in the split which
 * occurs while within but at the end of an inline node, since TinyMCE includes
 * a placeholder caret character at the end.
 *
 * @see https://github.com/tinymce/tinymce/blob/master/src/plugins/link/main/ts/core/Utils.ts
 *
 * @param {Node} node Node to test.
 *
 * @return {boolean} Whether node is inline boundary.
 */
export function isEmptyInlineBoundary( node ) {
	const text = node.nodeName === 'A' ? node.innerText : node.textContent;
	return text === '\uFEFF';
}

/**
 * Returns true if the node is empty, meaning it contains only the placeholder
 * caret character or is an empty text node.
 *
 * @param {Node} node Node to test.
 *
 * @return {boolean} Whether node is empty.
 */
export function isEmptyNode( node ) {
	return (
		'' === node.nodeValue ||
		isEmptyInlineBoundary( node )
	);
}

/**
 * Given a set of Nodes, filters to set to exclude any empty nodes: those with
 * either empty text nodes or only including the inline boundary caret.
 *
 * @param {Node[]} childNodes Nodes to filter.
 *
 * @return {Node[]} Non-empty nodes.
 */
export function filterEmptyNodes( childNodes ) {
	return reject( childNodes, isEmptyNode );
}

export function getFormatProperties( formatName, parents ) {
	switch ( formatName ) {
		case 'link' : {
			const anchor = find( parents, node => node.nodeName.toLowerCase() === 'a' );
			return !! anchor ? { value: anchor.getAttribute( 'href' ) || '', node: anchor } : {};
		}
		default:
			return {};
	}
}

const DEFAULT_FORMATS = [ 'bold', 'italic', 'strikethrough', 'link' ];

export class RichText extends Component {
	constructor( props ) {
		super( ...arguments );

		const { value } = props;
		if ( 'production' !== process.env.NODE_ENV && undefined !== value &&
					! Array.isArray( value ) ) {
			// eslint-disable-next-line no-console
			console.error(
				`Invalid value of type ${ typeof value } passed to RichText ` +
				'(expected array). Attribute values should be sourced using ' +
				'the `children` source when used with RichText.\n\n' +
				'See: https://wordpress.org/gutenberg/handbook/block-api/attributes/#children'
			);
		}

		this.onInit = this.onInit.bind( this );
		this.getSettings = this.getSettings.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNewBlock = this.onNewBlock.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.onPropagateUndo = this.onPropagateUndo.bind( this );
		this.onPastePreProcess = this.onPastePreProcess.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onCreateUndoLevel = this.onCreateUndoLevel.bind( this );

		this.state = {
			formats: {},
			selectedNodeId: 0,
		};

		this.isEmpty = ! value || ! value.length;
	}

	/**
	 * Retrieves the settings for this block.
	 *
	 * Allows passing in settings which will be overwritten.
	 *
	 * @param {Object} settings The settings to overwrite.
	 * @return {Object} The settings for this block.
	 */
	getSettings( settings ) {
		return ( this.props.getSettings || identity )( {
			...settings,
			forced_root_block: this.props.multiline || false,
			// Allow TinyMCE to keep one undo level for comparing changes.
			// Prevent it otherwise from accumulating any history.
			custom_undo_redo_levels: 1,
		} );
	}

	/**
	 * Handles the onSetup event for the tinyMCE component.
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
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'BeforeExecCommand', this.onPropagateUndo );
		editor.on( 'PastePreProcess', this.onPastePreProcess, true /* Add before core handlers */ );
		editor.on( 'paste', this.onPaste, true /* Add before core handlers */ );
		editor.on( 'input', this.onChange );
		// The change event in TinyMCE fires every time an undo level is added.
		editor.on( 'change', this.onCreateUndoLevel );

		patterns.apply( this, [ editor ] );

		if ( this.props.onSetup ) {
			this.props.onSetup( editor );
		}
	}

	/**
	 * Allows prop event handlers to handle an event.
	 *
	 * Allow props an opportunity to handle the event, before default RichText
	 * behavior takes effect. Should the event be handled by a prop, it should
	 * `stopImmediatePropagation` on the event to stop continued event handling.
	 *
	 * @param {string} name The name of the event.
	 *
	 * @return {void} Void.
	*/
	proxyPropHandler( name ) {
		return ( event ) => {
			// Allow props an opportunity to handle the event, before default
			// RichText behavior takes effect. Should the event be handled by a
			// prop, it should `stopImmediatePropagation` on the event to stop
			// continued event handling.
			if ( 'function' === typeof this.props[ 'on' + name ] ) {
				this.props[ 'on' + name ]( event );
			}
		};
	}

	onInit() {
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

	/**
	 * Handles an undo event from tinyMCE.
	 *
	 * @param {UndoEvent} event The undo event as triggered by TinyMCE.
	 */
	onPropagateUndo( event ) {
		const { onUndo, onRedo } = this.context;
		const { command } = event;

		if ( command === 'Undo' && onUndo ) {
			defer( onUndo );
			event.preventDefault();
		}

		if ( command === 'Redo' && onRedo ) {
			defer( onRedo );
			event.preventDefault();
		}
	}

	/**
	 * Handles a paste event from tinyMCE.
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {PasteEvent} event The paste event as triggered by tinyMCE.
	 */
	onPaste( event ) {
		const dataTransfer =
			event.clipboardData ||
			event.dataTransfer ||
			this.editor.getDoc().dataTransfer ||
			// Removes the need for further `dataTransfer` checks.
			{ getData: () => '' };

		const { items = [], files = [], types = [] } = dataTransfer;
		const item = find( [ ...items, ...files ], ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) );
		const plainText = dataTransfer.getData( 'text/plain' );
		const HTML = dataTransfer.getData( 'text/html' );

		// Only process file if no HTML is present.
		// Note: a pasted file may have the URL as plain text.
		if ( item && ! HTML ) {
			const blob = item.getAsFile ? item.getAsFile() : item;
			const rootNode = this.editor.getBody();
			const isEmpty = this.editor.dom.isEmpty( rootNode );
			const content = rawHandler( {
				HTML: `<img src="${ createBlobURL( blob ) }">`,
				mode: 'BLOCKS',
				tagName: this.props.tagName,
			} );

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received item:\n\n', blob );

			if ( isEmpty && this.props.onReplace ) {
				// Necessary to allow the paste bin to be removed without errors.
				this.props.setTimeout( () => this.props.onReplace( content ) );
			} else if ( this.props.onSplit ) {
				// Necessary to get the right range.
				// Also done in the TinyMCE paste plugin.
				this.props.setTimeout( () => this.splitContent( content ) );
			}

			event.preventDefault();
		}

		this.pastedPlainText = plainText;
		this.isPlainTextPaste = types.length === 1 && types[ 0 ] === 'text/plain';
	}

	/**
	 * Handles a PrePasteProcess event from tinyMCE.
	 *
	 * Will call the paste handler with the pasted data. If it is a string tries
	 * to put it in the containing tinyMCE editor. Otherwise call the `onSplit`
	 * handler.
	 *
	 * @param {PrePasteProcessEvent} event The PrePasteProcess event as triggered
	 *                                     by tinyMCE.
	 */
	onPastePreProcess( event ) {
		const HTML = this.isPlainTextPaste ? this.pastedPlainText : event.content;
		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', HTML );
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
			HTML,
			plainText: this.pastedPlainText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.context.canUserUseUnfilteredHTML,
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

	/**
	 * Handles any case where the content of the tinyMCE instance has changed.
	 */

	onChange() {
		this.isEmpty = this.editor.dom.isEmpty( this.editor.getBody() );
		this.savedContent = this.isEmpty ? [] : this.getContent();
		this.props.onChange( this.savedContent );
	}

	onCreateUndoLevel() {
		// Always ensure the content is up-to-date.
		this.onChange();
		this.context.onCreateUndoLevel();
	}

	/**
	 * Calculates the relative position where the link toolbar should be.
	 *
	 * Based on the selection of the text inside this element a position is
	 * calculated where the toolbar should be. This can be used downstream to
	 * absolutely position the toolbar. It does this by finding the closest
	 * relative element.
	 *
	 * @return {{top: number, left: number}} The desired position of the toolbar.
	 */
	getFocusPosition() {
		const position = getRectangleFromRange( this.editor.selection.getRng() );

		// Find the parent "relative" or "absolute" positioned container
		const findRelativeParent = ( node ) => {
			const style = window.getComputedStyle( node );
			if ( style.position === 'relative' || style.position === 'absolute' ) {
				return node;
			}
			return findRelativeParent( node.parentNode );
		};
		const container = findRelativeParent( this.editor.getBody() );
		const containerPosition = container.getBoundingClientRect();
		const toolbarOffset = { top: 10, left: 0 };
		const linkModalWidth = 298;

		return {
			top: position.top - containerPosition.top + ( position.height ) + toolbarOffset.top,
			left: position.left - containerPosition.left - ( linkModalWidth / 2 ) + ( position.width / 2 ) + toolbarOffset.left,
		};
	}

	/**
	 * Handles a keydown event from tinyMCE.
	 *
	 * @param {KeydownEvent} event The keydow event as triggered by tinyMCE.
	 */
	onKeyDown( event ) {
		const dom = this.editor.dom;
		const rootNode = this.editor.getBody();

		if (
			( event.keyCode === BACKSPACE && isHorizontalEdge( rootNode, true ) ) ||
			( event.keyCode === DELETE && isHorizontalEdge( rootNode, false ) )
		) {
			if ( ! this.props.onMerge && ! this.props.onRemove ) {
				return;
			}

			this.onCreateUndoLevel();

			const forward = event.keyCode === DELETE;

			if ( this.props.onMerge ) {
				this.props.onMerge( forward );
			}

			if ( this.props.onRemove && dom.isEmpty( rootNode ) ) {
				this.props.onRemove( forward );
			}

			event.preventDefault();

			// Calling onMerge() or onRemove() will destroy the editor, so it's important
			// that we stop other handlers (e.g. ones registered by TinyMCE) from
			// also handling this event.
			event.stopImmediatePropagation();
		}

		// If we click shift+Enter on inline RichTexts, we avoid creating two contenteditables
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
				this.onCreateUndoLevel();

				const childNodes = Array.from( rootNode.childNodes );
				const index = dom.nodeIndex( selectedNode );
				const beforeNodes = childNodes.slice( 0, index );
				const afterNodes = childNodes.slice( index + 1 );
				const beforeElement = nodeListToReact( beforeNodes, createTinyMCEElement );
				const afterElement = nodeListToReact( afterNodes, createTinyMCEElement );

				this.restoreContentAndSplit( beforeElement, afterElement );
			} else {
				event.preventDefault();
				this.onCreateUndoLevel();

				if ( event.shiftKey || ! this.props.onSplit ) {
					this.editor.execCommand( 'InsertLineBreak', false, event );
				} else {
					this.splitContent();
				}
			}
		}
	}

	/**
	 * Handles tinyMCE key up event.
	 *
	 * @param {number} keyCode The key code that has been pressed on the keyboard.
	 */
	onKeyUp( { keyCode } ) {
		// The input event does not fire when the whole field is selected and
		// BACKSPACE is pressed.
		if ( keyCode === BACKSPACE ) {
			this.onChange();
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
		if ( ! this.props.onSplit ) {
			return;
		}

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
			const afterElement = nodeListToReact( filterEmptyNodes( afterFragment.childNodes ), createTinyMCEElement );

			this.restoreContentAndSplit( beforeElement, afterElement, blocks );
		} else {
			this.restoreContentAndSplit( [], [], blocks );
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

		this.restoreContentAndSplit(
			nodeListToReact( before, createTinyMCEElement ),
			nodeListToReact( after, createTinyMCEElement )
		);
	}

	onNodeChange( { parents } ) {
		if ( document.activeElement !== this.editor.getBody() ) {
			return;
		}
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
		// Do not trigger a change event coming from the TinyMCE undo manager.
		// Our global state is already up-to-date.
		this.editor.undoManager.ignore( () => {
			const bookmark = this.editor.selection.getBookmark( 2, true );

			this.savedContent = this.props.value;
			this.setContent( this.savedContent );
			this.editor.selection.moveToBookmark( bookmark );
		} );
	}

	setContent( content = '' ) {
		this.editor.setContent( renderToString( content ) );
	}

	getContent() {
		return nodeListToReact( this.editor.getBody().childNodes || [], createTinyMCEElement );
	}

	componentWillUnmount() {
		this.onChange();
	}

	componentDidUpdate( prevProps ) {
		// The `savedContent` var allows us to avoid updating the content right after an `onChange` call
		if (
			!! this.editor &&
			this.props.tagName === prevProps.tagName &&
			this.props.value !== prevProps.value &&
			this.props.value !== this.savedContent &&

			// Comparing using isEqual is necessary especially to avoid unnecessary updateContent calls
			// This fixes issues in multi richText blocks like quotes when moving the focus between
			// the different editables.
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
					this.applyFormat( 'link', { href: formatValue.value }, anchor );
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
	}

	/**
	 * Calling onSplit means we need to abort the change done by TinyMCE.
	 * we need to call updateContent to restore the initial content before calling onSplit.
	 *
	 * @param {Array}  before content before the split position
	 * @param {Array}  after  content after the split position
	 * @param {?Array} blocks blocks to insert at the split position
	 */
	restoreContentAndSplit( before, after, blocks = [] ) {
		this.updateContent();
		this.props.onSplit( before, after, ...blocks );
	}

	render() {
		const {
			tagName: Tagname = 'div',
			style,
			value,
			wrapperClassName,
			className,
			inlineToolbar = false,
			formattingControls,
			placeholder,
			multiline: MultilineTag,
			keepPlaceholderOnFocus = false,
			isSelected = false,
			formatters,
		} = this.props;

		const ariaProps = { ...pickAriaProps( this.props ), 'aria-multiline': !! MultilineTag };

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ( ! isSelected || keepPlaceholderOnFocus ) && this.isEmpty;
		const classes = classnames( wrapperClassName, 'blocks-rich-text' );

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
				{ isSelected &&
					<Fill name="Formatting.Toolbar">
						{ ! inlineToolbar && formatToolbar }
					</Fill>
				}
				{ isSelected && inlineToolbar &&
					<div className="block-rich-text__inline-toolbar">
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
						className={ classnames( 'blocks-rich-text__tinymce', className ) }
						style={ style }
					>
						{ MultilineTag ? <MultilineTag>{ placeholder }</MultilineTag> : placeholder }
					</Tagname>
				}
				{ isSelected && <Slot name="RichText.Siblings" /> }
			</div>
		);
	}
}

RichText.contextTypes = {
	onUndo: noop,
	onRedo: noop,
	canUserUseUnfilteredHTML: noop,
	onCreateUndoLevel: noop,
};

RichText.defaultProps = {
	formattingControls: DEFAULT_FORMATS,
	formatters: [],
};

export default withSafeTimeout( RichText );
