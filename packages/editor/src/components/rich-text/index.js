/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	defer,
	difference,
	find,
	forEach,
	identity,
	isEqual,
	merge,
	noop,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment, RawHTML, createRef } from '@wordpress/element';
import {
	isHorizontalEdge,
	getRectangleFromRange,
	getScrollContainer,
} from '@wordpress/dom';
import { createBlobURL } from '@wordpress/blob';
import { BACKSPACE, DELETE, ENTER, LEFT, RIGHT, rawShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { Slot } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { rawHandler, children } from '@wordpress/blocks';
import { withInstanceId, withSafeTimeout, compose } from '@wordpress/compose';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import { FORMATTING_CONTROLS } from './formatting-controls';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
import { pickAriaProps } from './aria';
import patterns from './patterns';
import { withBlockEditContext } from '../block-edit/context';
import { domToFormat, valueToString } from './format';
import TokenUI from './tokens/ui';
import { isRichTextValueEmpty } from './utils';

/**
 * Browser dependencies
 */

const { Node, getSelection } = window;

/**
 * Zero-width space character used by TinyMCE as a caret landing point for
 * inline boundary nodes.
 *
 * @see tinymce/src/core/main/ts/text/Zwsp.ts
 *
 * @type {string}
 */
const TINYMCE_ZWSP = '\uFEFF';

export function getFormatValue( formatName, parents ) {
	if ( formatName === 'link' ) {
		const anchor = find( parents, ( node ) => node.nodeName === 'A' );
		if ( anchor ) {
			if ( anchor.hasAttribute( 'data-wp-placeholder' ) ) {
				return { isAdding: true };
			}
			return {
				isActive: true,
				value: anchor.getAttribute( 'href' ) || '',
				target: anchor.getAttribute( 'target' ) || '',
				node: anchor,
			};
		}
	}

	return { isActive: true };
}

export class RichText extends Component {
	constructor() {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.getSettings = this.getSettings.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onNodeChange = this.onNodeChange.bind( this );
		this.onDeleteKeyDown = this.onDeleteKeyDown.bind( this );
		this.onHorizontalNavigationKeyDown = this.onHorizontalNavigationKeyDown.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onKeyUp = this.onKeyUp.bind( this );
		this.changeFormats = this.changeFormats.bind( this );
		this.onPropagateUndo = this.onPropagateUndo.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onCreateUndoLevel = this.onCreateUndoLevel.bind( this );
		this.setFocusedElement = this.setFocusedElement.bind( this );

		this.state = {
			formats: {},
			selectedNodeId: 0,
		};

		this.containerRef = createRef();
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
		settings = {
			...settings,
			forced_root_block: this.props.multiline || false,
			// Allow TinyMCE to keep one undo level for comparing changes.
			// Prevent it otherwise from accumulating any history.
			custom_undo_redo_levels: 1,
		};

		const { unstableGetSettings } = this.props;
		if ( unstableGetSettings ) {
			settings = unstableGetSettings( settings );
		}

		return settings;
	}

	/**
	 * Handles the onSetup event for the TinyMCE component.
	 *
	 * Will setup event handlers for the TinyMCE instance.
	 * An `onSetup` function in the props will be called if it is present.
	 *
	 * @param {tinymce} editor The editor instance as passed by TinyMCE.
	 */
	onSetup( editor ) {
		this.editor = editor;

		editor.on( 'init', this.onInit );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'BeforeExecCommand', this.onPropagateUndo );
		editor.on( 'focus', this.onFocus );
		editor.on( 'input', this.onChange );
		// The change event in TinyMCE fires every time an undo level is added.
		editor.on( 'change', this.onCreateUndoLevel );

		patterns.apply( this, [ editor ] );

		const { unstableOnSetup } = this.props;
		if ( unstableOnSetup ) {
			unstableOnSetup( editor );
		}
	}

	setFocusedElement() {
		if ( this.props.setFocusedElement ) {
			this.props.setFocusedElement( this.props.instanceId );
		}
	}

	onInit() {
		this.registerCustomFormatters();

		this.editor.shortcuts.add( rawShortcut.primary( 'k' ), '', () => this.changeFormats( { link: { isAdding: true } } ) );
		this.editor.shortcuts.add( rawShortcut.access( 'a' ), '', () => this.changeFormats( { link: { isAdding: true } } ) );
		this.editor.shortcuts.add( rawShortcut.access( 's' ), '', () => this.changeFormats( { link: undefined } ) );
		this.editor.shortcuts.add( rawShortcut.access( 'd' ), '', () => this.changeFormats( { strikethrough: ! this.state.formats.strikethrough } ) );
		this.editor.shortcuts.add( rawShortcut.access( 'x' ), '', () => this.changeFormats( { code: ! this.state.formats.code } ) );
		this.editor.shortcuts.add( rawShortcut.primary( 'z' ), '', 'Undo' );
		this.editor.shortcuts.add( rawShortcut.primaryShift( 'z' ), '', 'Redo' );

		// Remove TinyMCE Core shortcut for consistency with global editor
		// shortcuts. Also clashes with Mac browsers.
		this.editor.shortcuts.remove( 'meta+y', '', 'Redo' );
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
	 * Handles an undo event from TinyMCE.
	 *
	 * @param {UndoEvent} event The undo event as triggered by TinyMCE.
	 */
	onPropagateUndo( event ) {
		const { onUndo, onRedo } = this.props;
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
	 * Handles a paste event from TinyMCE.
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {PasteEvent} event The paste event as triggered by TinyMCE.
	 */
	onPaste( event ) {
		const clipboardData = event.clipboardData;
		const { items = [], files = [] } = clipboardData;
		const item = find( [ ...items, ...files ], ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) );
		let plainText = '';
		let html = '';

		// IE11 only supports `Text` as an argument for `getData` and will
		// otherwise throw an invalid argument error, so we try the standard
		// arguments first, then fallback to `Text` if they fail.
		try {
			plainText = clipboardData.getData( 'text/plain' );
			html = clipboardData.getData( 'text/html' );
		} catch ( error1 ) {
			try {
				html = clipboardData.getData( 'Text' );
			} catch ( error2 ) {
				// Some browsers like UC Browser paste plain text by default and
				// don't support clipboardData at all, so allow default
				// behaviour.
				return;
			}
		}

		event.preventDefault();

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Received HTML:\n\n', html );
		window.console.log( 'Received plain text:\n\n', plainText );

		// Only process file if no HTML is present.
		// Note: a pasted file may have the URL as plain text.
		if ( item && ! html ) {
			const file = item.getAsFile ? item.getAsFile() : item;
			const content = rawHandler( {
				HTML: `<img src="${ createBlobURL( file ) }">`,
				mode: 'BLOCKS',
				tagName: this.props.tagName,
			} );
			const shouldReplace = this.props.onReplace && this.isEmpty();

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received item:\n\n', file );

			if ( shouldReplace ) {
				// Necessary to allow the paste bin to be removed without errors.
				this.props.setTimeout( () => this.props.onReplace( content ) );
			} else if ( this.props.onSplit ) {
				// Necessary to get the right range.
				// Also done in the TinyMCE paste plugin.
				this.props.setTimeout( () => this.splitContent( content ) );
			}

			return;
		}

		// There is a selection, check if a URL is pasted.
		if ( ! this.editor.selection.isCollapsed() ) {
			const pastedText = ( html || plainText ).replace( /<[^>]+>/g, '' ).trim();

			// A URL was pasted, turn the selection into a link
			if ( isURL( pastedText ) ) {
				this.editor.execCommand( 'mceInsertLink', false, {
					href: this.editor.dom.decode( pastedText ),
				} );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', pastedText );

				return;
			}
		}

		const shouldReplace = this.props.onReplace && this.isEmpty();

		let mode = 'INLINE';

		if ( shouldReplace ) {
			mode = 'BLOCKS';
		} else if ( this.props.onSplit ) {
			mode = 'AUTO';
		}

		const content = rawHandler( {
			HTML: html,
			plainText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.props.canUserUseUnfilteredHTML,
		} );

		if ( typeof content === 'string' ) {
			this.editor.insertContent( content );
		} else if ( this.props.onSplit ) {
			if ( ! content.length ) {
				return;
			}

			if ( shouldReplace ) {
				this.props.onReplace( content );
			} else {
				this.splitContent( content, { paste: true } );
			}
		}
	}

	/**
	 * Handles a focus event on the contenteditable field, calling the
	 * `unstableOnFocus` prop callback if one is defined. The callback does not
	 * receive any arguments.
	 *
	 * This is marked as a private API and the `unstableOnFocus` prop is not
	 * documented, as the current requirements where it is used are subject to
	 * future refactoring following `isSelected` handling.
	 *
	 * In contrast with `setFocusedElement`, this is only triggered in response
	 * to focus within the contenteditable field, whereas `setFocusedElement`
	 * is triggered on focus within any `RichText` descendent element.
	 *
	 * @see setFocusedElement
	 *
	 * @private
	 */
	onFocus() {
		const { unstableOnFocus } = this.props;
		if ( unstableOnFocus ) {
			unstableOnFocus();
		}
	}

	/**
	 * Handles any case where the content of the TinyMCE instance has changed.
	 */
	onChange() {
		this.savedContent = this.getContent();
		this.props.onChange( this.savedContent );
	}

	onCreateUndoLevel( event ) {
		// TinyMCE fires a `change` event when the first letter in an instance
		// is typed. This should not create a history record in Gutenberg.
		// https://github.com/tinymce/tinymce/blob/4.7.11/src/core/main/ts/api/UndoManager.ts#L116-L125
		// In other cases TinyMCE won't fire a `change` with at least a previous
		// record present, so this is a reliable check.
		// https://github.com/tinymce/tinymce/blob/4.7.11/src/core/main/ts/api/UndoManager.ts#L272-L275
		if ( event && event.lastLevel === null ) {
			return;
		}

		// Always ensure the content is up-to-date. This is needed because e.g.
		// making something bold will trigger a TinyMCE change event but no
		// input event. Avoid dispatching an action if the original event is
		// blur because the content will already be up-to-date.
		if ( ! event || ! event.originalEvent || event.originalEvent.type !== 'blur' ) {
			this.onChange();
		}

		this.props.onCreateUndoLevel();
	}

	/**
	 * Handles a delete keyDown event to handle merge or removal for collapsed
	 * selection where caret is at directional edge: forward for a delete key,
	 * reverse for a backspace key.
	 *
	 * @link https://en.wikipedia.org/wiki/Caret_navigation
	 *
	 * @param {tinymce.EditorEvent<KeyboardEvent>} event Keydown event.
	 */
	onDeleteKeyDown( event ) {
		const { onMerge, onRemove } = this.props;
		if ( ! onMerge && ! onRemove ) {
			return;
		}

		const { keyCode } = event;
		const isReverse = keyCode === BACKSPACE;

		// User is using the Remove Block shortcut, so allow the event to bubble
		// up to the BlockSettingsMenu component
		if ( isKeyboardEvent.primaryAlt( event, 'Backspace' ) ) {
			return;
		}

		const { isCollapsed } = getSelection();

		// Only process delete if the key press occurs at uncollapsed edge.
		if ( ! isCollapsed ) {
			return;
		}

		// It is important to consider emptiness because an empty container
		// will include a bogus TinyMCE BR node _after_ the caret, so in a
		// forward deletion the isHorizontalEdge function will incorrectly
		// interpret the presence of the bogus node as not being at the edge.
		const isEmpty = this.isEmpty();
		const isEdge = (
			isEmpty ||
			isHorizontalEdge( this.editor.getBody(), isReverse )
		);

		if ( ! isEdge ) {
			return;
		}

		if ( onMerge ) {
			onMerge( ! isReverse );
		}

		// Only handle remove on Backspace. This serves dual-purpose of being
		// an intentional user interaction distinguishing between Backspace and
		// Delete to remove the empty field, but also to avoid merge & remove
		// causing destruction of two fields (merge, then removed merged).
		if ( onRemove && isEmpty && isReverse ) {
			onRemove( ! isReverse );
		}

		event.preventDefault();

		// Calling onMerge() or onRemove() will destroy the editor, so it's
		// important that we stop other handlers (e.g. ones registered by
		// TinyMCE) from also handling this event.
		event.stopImmediatePropagation();
	}

	/**
	 * Handles a horizontal navigation key down event to handle the case where
	 * TinyMCE attempts to preventDefault when on the outside edge of an inline
	 * boundary when arrowing _away_ from the boundary, not within it. Replaces
	 * the TinyMCE event `preventDefault` behavior with a noop, such that those
	 * relying on `defaultPrevented` are not misinformed about the arrow event.
	 *
	 * If TinyMCE#4476 is resolved, this handling may be removed.
	 *
	 * @see https://github.com/tinymce/tinymce/issues/4476
	 *
	 * @param {tinymce.EditorEvent<KeyboardEvent>} event Keydown event.
	 */
	onHorizontalNavigationKeyDown( event ) {
		const { focusNode } = getSelection();
		const { nodeType, nodeValue } = focusNode;

		if ( nodeType !== Node.TEXT_NODE ) {
			return;
		}

		if ( nodeValue.length !== 1 || nodeValue[ 0 ] !== TINYMCE_ZWSP ) {
			return;
		}

		const { keyCode } = event;

		// Consider to be moving away from inline boundary based on:
		//
		// 1. Within a text fragment consisting only of ZWSP.
		// 2. If in reverse, there is no previous sibling. If forward, there is
		//    no next sibling (i.e. end of node).
		const isReverse = keyCode === LEFT;
		const edgeSibling = isReverse ? 'previousSibling' : 'nextSibling';
		if ( ! focusNode[ edgeSibling ] ) {
			// Note: This is not reassigning on the native event, rather the
			// "fixed" TinyMCE copy, which proxies its preventDefault to the
			// native event. By reassigning here, we're effectively preventing
			// the proxied call on the native event, but not otherwise mutating
			// the original event object.
			event.preventDefault = noop;
		}
	}

	/**
	 * Handles a keydown event from TinyMCE.
	 *
	 * @param {KeydownEvent} event The keydown event as triggered by TinyMCE.
	 */
	onKeyDown( event ) {
		const dom = this.editor.dom;
		const rootNode = this.editor.getBody();
		const { keyCode } = event;

		const isDelete = keyCode === DELETE || keyCode === BACKSPACE;
		if ( isDelete ) {
			this.onDeleteKeyDown( event );
		}

		const isHorizontalNavigation = keyCode === LEFT || keyCode === RIGHT;
		if ( isHorizontalNavigation ) {
			this.onHorizontalNavigationKeyDown( event );
		}

		// If we click shift+Enter on inline RichTexts, we avoid creating two contenteditables
		// We also split the content and call the onSplit prop if provided.
		if ( keyCode === ENTER ) {
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

				const { format } = this.props;
				const before = domToFormat( beforeNodes, format );
				const after = domToFormat( afterNodes, format );

				this.props.onSplit( before, after );
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

	/**
	 * Handles TinyMCE key up event.
	 *
	 * @param {number} keyCode The key code that has been pressed on the keyboard.
	 */
	onKeyUp( { keyCode } ) {
		// The input event does not fire when the whole field is selected and
		// BACKSPACE is pressed.
		if ( keyCode === BACKSPACE ) {
			this.onChange();
		}

		// `scrollToRect` is called on `nodechange`, whereas calling it on
		// `keyup` *when* moving to a new RichText element results in incorrect
		// scrolling. Though the following allows false positives, it results
		// in much smoother scrolling.
		if ( this.props.isViewportSmall && keyCode !== BACKSPACE && keyCode !== ENTER ) {
			this.scrollToRect( getRectangleFromRange( this.editor.selection.getRng() ) );
		}
	}

	scrollToRect( rect ) {
		const { top: caretTop } = rect;
		const container = getScrollContainer( this.editor.getBody() );

		if ( ! container ) {
			return;
		}

		// When scrolling, avoid positioning the caret at the very top of
		// the viewport, providing some "air" and some textual context for
		// the user, and avoiding toolbars.
		const graceOffset = 100;

		// Avoid pointless scrolling by establishing a threshold under
		// which scrolling should be skipped;
		const epsilon = 10;
		const delta = caretTop - graceOffset;

		if ( Math.abs( delta ) > epsilon ) {
			container.scrollTo(
				container.scrollLeft,
				container.scrollTop + delta,
			);
		}
	}

	/**
	 * Splits the content at the location of the selection.
	 *
	 * Replaces the content of the editor inside this element with the contents
	 * before the selection. Sends the elements after the selection to the `onSplit`
	 * handler.
	 *
	 * @param {Array}  blocks  The blocks to add after the split point.
	 * @param {Object} context The context for splitting.
	 */
	splitContent( blocks = [], context = {} ) {
		const { onSplit } = this.props;
		if ( ! onSplit ) {
			return;
		}

		const rootNode = this.editor.getBody();

		let before, after;
		if ( rootNode.childNodes.length ) {
			const { dom } = this.editor;
			const beforeRange = dom.createRng();
			const afterRange = dom.createRng();
			const selectionRange = this.editor.selection.getRng();

			beforeRange.setStart( rootNode, 0 );
			beforeRange.setEnd( selectionRange.startContainer, selectionRange.startOffset );

			afterRange.setStart( selectionRange.endContainer, selectionRange.endOffset );
			afterRange.setEnd( rootNode, dom.nodeIndex( rootNode.lastChild ) + 1 );

			const beforeFragment = beforeRange.cloneContents();
			const afterFragment = afterRange.cloneContents();

			const { format } = this.props;
			before = domToFormat( beforeFragment.childNodes, format );
			after = domToFormat( afterFragment.childNodes, format );
		} else {
			before = [];
			after = [];
		}

		// In case split occurs at the trailing or leading edge of the field,
		// assume that the before/after values respectively reflect the current
		// value. This also provides an opportunity for the parent component to
		// determine whether the before/after value has changed using a trivial
		//  strict equality operation.
		if ( isRichTextValueEmpty( after ) ) {
			before = this.props.value;
		} else if ( isRichTextValueEmpty( before ) ) {
			after = this.props.value;
		}

		// If pasting and the split would result in no content other than the
		// pasted blocks, remove the before and after blocks.
		if ( context.paste ) {
			before = isRichTextValueEmpty( before ) ? null : before;
			after = isRichTextValueEmpty( after ) ? null : after;
		}

		onSplit( before, after, ...blocks );
	}

	onNodeChange( { parents } ) {
		if ( document.activeElement !== this.editor.getBody() ) {
			return;
		}

		// Remove *non-selected* placeholder links when the selection is changed.
		this.removePlaceholderLinks( parents );

		const formatNames = this.props.formattingControls;
		const formats = this.editor.formatter.matchAll( formatNames ).reduce( ( accFormats, activeFormat ) => {
			accFormats[ activeFormat ] = getFormatValue( activeFormat, parents );
			return accFormats;
		}, {} );

		this.setState( { formats, selectedNodeId: this.state.selectedNodeId + 1 } );

		if ( this.props.isViewportSmall ) {
			let rect;
			const selectedAnchor = find( parents, ( node ) => node.tagName === 'A' );
			if ( selectedAnchor ) {
				// If we selected a link, position the Link UI below the link
				rect = selectedAnchor.getBoundingClientRect();
			} else {
				// Otherwise, position the Link UI below the cursor or text selection
				rect = getRectangleFromRange( this.editor.selection.getRng() );
			}

			// Originally called on `focusin`, that hook turned out to be
			// premature. On `nodechange` we can work with the finalized TinyMCE
			// instance and scroll to proper position.
			this.scrollToRect( rect );
		}
	}

	setContent( content ) {
		const { format } = this.props;

		// If editor has focus while content is being set, save the selection
		// and restore caret position after content is set.
		let bookmark;
		if ( this.editor.hasFocus() ) {
			bookmark = this.editor.selection.getBookmark( 2, true );
		}

		this.savedContent = content;
		this.editor.setContent( valueToString( content, format ) );

		if ( bookmark ) {
			this.editor.selection.moveToBookmark( bookmark );
		}
	}

	getContent() {
		const { format } = this.props;

		return domToFormat( this.editor.getBody().childNodes, format );
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
			this.setContent( this.props.value );
		}

		if ( 'development' === process.env.NODE_ENV ) {
			if ( ! isEqual( this.props.formatters, prevProps.formatters ) ) {
				// eslint-disable-next-line no-console
				console.error( 'Formatters passed via `formatters` prop will only be registered once. Formatters can be enabled/disabled via the `formattingControls` prop.' );
			}
		}

		// When the block is unselected, remove placeholder links and hide the formatting toolbar.
		if ( ! this.props.isSelected && prevProps.isSelected ) {
			this.removePlaceholderLinks();
			this.setState( { formats: {} } );
		}
	}

	/**
	 * Removes any placeholder links from the editor DOM. Placeholder links are
	 * used when adding a link to indicate which text will become a link.
	 *
	 * @param {HTMLElement[]=} linksToKeep If specified, these links will *not*
	 *                                     be removed. Useful for keeping the
	 *                                     currently selected link as is.
	 */
	removePlaceholderLinks( linksToKeep = [] ) {
		const placeholderLinks = this.editor.$( 'a[data-wp-placeholder]' ).toArray();
		for ( const placeholderLink of difference( placeholderLinks, linksToKeep ) ) {
			this.editor.dom.remove( placeholderLink, /* keepChildren: */ true );
		}
	}

	/**
	 * Returns true if the component's value prop is currently empty, or false otherwise.
	 *
	 * @return {boolean} Whether this.props.value is empty.
	 */
	isEmpty() {
		return isRichTextValueEmpty( this.props.value );
	}

	isFormatActive( format ) {
		return this.state.formats[ format ] && this.state.formats[ format ].isActive;
	}

	removeFormat( format ) {
		this.editor.focus();
		this.editor.formatter.remove( format );
		// Formatter does not trigger a change event like `execCommand` does.
		this.onCreateUndoLevel();
	}

	applyFormat( format, args, node ) {
		this.editor.focus();
		this.editor.formatter.apply( format, args, node );
		// Formatter does not trigger a change event like `execCommand` does.
		this.onCreateUndoLevel();
	}

	changeFormats( formats ) {
		forEach( formats, ( formatValue, format ) => {
			const isActive = this.isFormatActive( format );

			if ( format === 'link' ) {
				// Remove the selected link when `formats.link` is set to a falsey value.
				if ( ! formatValue ) {
					this.editor.execCommand( 'Unlink' );
					return;
				}

				const { isAdding, value: href, target } = formatValue;
				const isSelectionCollapsed = this.editor.selection.isCollapsed();

				// Are we creating a new link?
				if ( isAdding ) {
					// If the selected text is a URL, instantly turn it into a link.
					const selectedText = this.editor.selection.getContent( { format: 'text' } );
					if ( isURL( selectedText ) ) {
						formatValue.isAdding = false;
						this.editor.execCommand( 'mceInsertLink', false, {
							href: selectedText,
						} );
						return;
					}

					// Create a placeholder <a> so that there's something to indicate which
					// text will become a link. Placeholder links are stripped from
					// getContent() and removed when the selection changes.
					if ( ! isSelectionCollapsed ) {
						this.editor.formatter.apply( format, {
							href: '#',
							'data-wp-placeholder': true,
							'data-mce-bogus': true,
						} );
					}

					// Bail early if the link is still being added. <RichText> will ask the user
					// for a URL and then update `formats.link`.
					return;
				}

				// When no link or text is selected, use the URL as the link's text.
				if ( isSelectionCollapsed && ! isActive ) {
					this.editor.insertContent( this.editor.dom.createHTML(
						'a',
						{ href, target },
						this.editor.dom.encode( href )
					) );
					return;
				}

				// Use built-in TinyMCE command turn the selection into a link. This takes
				// care of deleting any existing links within the current selection.
				this.editor.execCommand( 'mceInsertLink', false, {
					href,
					target,
					'data-wp-placeholder': null,
					'data-mce-bogus': null,
				} );
				return;
			}

			if ( isActive && ! formatValue ) {
				this.removeFormat( format );
			} else if ( ! isActive && formatValue ) {
				this.applyFormat( format );
			}
		} );

		this.setState( ( state ) => ( {
			formats: merge( {}, state.formats, formats ),
		} ) );
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
			isSelected,
			formatters,
			autocompleters,
			format,
		} = this.props;

		const ariaProps = pickAriaProps( this.props );

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ( ! isSelected || keepPlaceholderOnFocus ) && this.isEmpty();
		const classes = classnames( wrapperClassName, 'editor-rich-text' );

		const formatToolbar = (
			<FormatToolbar
				selectedNodeId={ this.state.selectedNodeId }
				formats={ this.state.formats }
				onChange={ this.changeFormats }
				enabledControls={ formattingControls }
				customControls={ formatters }
			/>
		);

		return (
			<div className={ classes }
				ref={ this.containerRef }
				onFocus={ this.setFocusedElement }
			>
				{ isSelected && ! inlineToolbar && (
					<BlockFormatControls>
						{ formatToolbar }
					</BlockFormatControls>
				) }
				{ isSelected && inlineToolbar && (
					<div className="editor-rich-text__inline-toolbar">
						{ formatToolbar }
					</div>
				) }
				{ isSelected &&
					<TokenUI
						editor={ this.editor }
						containerRef={ this.containerRef }
					/>
				}
				<Autocomplete onReplace={ this.props.onReplace } completers={ autocompleters }>
					{ ( { isExpanded, listBoxId, activeId } ) => (
						<Fragment>
							<TinyMCE
								tagName={ Tagname }
								getSettings={ this.getSettings }
								onSetup={ this.onSetup }
								style={ style }
								defaultValue={ value }
								format={ format }
								isPlaceholderVisible={ isPlaceholderVisible }
								aria-label={ placeholder }
								aria-autocomplete="list"
								aria-expanded={ isExpanded }
								aria-owns={ listBoxId }
								aria-activedescendant={ activeId }
								{ ...ariaProps }
								className={ className }
								key={ key }
								onPaste={ this.onPaste }
							/>
							{ isPlaceholderVisible &&
								<Tagname
									className={ classnames( 'editor-rich-text__tinymce', className ) }
									style={ style }
								>
									{ MultilineTag ? <MultilineTag>{ placeholder }</MultilineTag> : placeholder }
								</Tagname>
							}
							{ isSelected && <Slot name="RichText.Siblings" /> }
						</Fragment>
					) }
				</Autocomplete>
			</div>
		);
	}
}

RichText.defaultProps = {
	formattingControls: FORMATTING_CONTROLS.map( ( { format } ) => format ),
	formatters: [],
	format: 'children',
};

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( context, ownProps ) => {
		// When explicitly set as not selected, do nothing.
		if ( ownProps.isSelected === false ) {
			return {};
		}
		// When explicitly set as selected, use the value stored in the context instead.
		if ( ownProps.isSelected === true ) {
			return {
				isSelected: context.isSelected,
			};
		}

		// Ensures that only one RichText component can be focused.
		return {
			isSelected: context.isSelected && context.focusedElement === ownProps.instanceId,
			setFocusedElement: context.setFocusedElement,
		};
	} ),
	withSelect( ( select ) => {
		const { isViewportMatch = identity } = select( 'core/viewport' ) || {};
		const { canUserUseUnfilteredHTML } = select( 'core/editor' );

		return {
			isViewportSmall: isViewportMatch( '< small' ),
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			createUndoLevel,
			redo,
			undo,
		} = dispatch( 'core/editor' );

		return {
			onCreateUndoLevel: createUndoLevel,
			onRedo: redo,
			onUndo: undo,
		};
	} ),
	withSafeTimeout,
] )( RichText );

RichTextContainer.Content = ( { value, format, tagName: Tag, ...props } ) => {
	let content;
	switch ( format ) {
		case 'string':
			content = <RawHTML>{ value }</RawHTML>;
			break;

		case 'children':
			content = <RawHTML>{ children.toHTML( value ) }</RawHTML>;
			break;
	}

	if ( Tag ) {
		return <Tag { ...props }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = isRichTextValueEmpty;

RichTextContainer.Content.defaultProps = {
	format: 'children',
};

export default RichTextContainer;
