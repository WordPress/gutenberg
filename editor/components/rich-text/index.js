/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	isEqual,
	forEach,
	merge,
	identity,
	find,
	defer,
	noop,
} from 'lodash';
import 'element-closest';

/**
 * WordPress dependencies
 */
import { Component, Fragment, compose, RawHTML, createRef } from '@wordpress/element';
import {
	isHorizontalEdge,
	getRectangleFromRange,
	getScrollContainer,
} from '@wordpress/dom';
import { createBlobURL } from '@wordpress/blob';
import { keycodes } from '@wordpress/utils';
import { withInstanceId, withSafeTimeout, Slot } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { rawHandler } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';
import TinyMCE from './tinymce';
import { pickAriaProps } from './aria';
import patterns from './patterns';
import { withBlockEditContext } from '../block-edit/context';
import { treeToFormat, valueToString } from './format';

const { BACKSPACE, DELETE, ENTER, rawShortcut } = keycodes;

export function getFormatProperties( formatName, parents ) {
	switch ( formatName ) {
		case 'link' : {
			const anchor = find( parents, ( node ) => node.nodeName.toLowerCase() === 'a' );
			return !! anchor ? { value: anchor.getAttribute( 'href' ) || '', target: anchor.getAttribute( 'target' ) || '', node: anchor } : {};
		}
		default:
			return {};
	}
}

const DEFAULT_FORMATS = [ 'bold', 'italic', 'strikethrough', 'link', 'code' ];

export class RichText extends Component {
	constructor() {
		super( ...arguments );

		this.onInit = this.onInit.bind( this );
		this.getSettings = this.getSettings.bind( this );
		this.onSetup = this.onSetup.bind( this );
		this.onFocus = this.onFocus.bind( this );
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
		const { multiline, tagName } = this.props;
		return ( this.props.getSettings || identity )( {
			...settings,
			forced_root_block: multiline || tagName,
			// Allow TinyMCE to keep one undo level for comparing changes.
			// Prevent it otherwise from accumulating any history.
			custom_undo_redo_levels: 1,
		} );
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
		editor.on( 'NewBlock', this.onNewBlock );
		editor.on( 'nodechange', this.onNodeChange );
		editor.on( 'keydown', this.onKeyDown );
		editor.on( 'keyup', this.onKeyUp );
		editor.on( 'BeforeExecCommand', this.onPropagateUndo );
		editor.on( 'PastePreProcess', this.onPastePreProcess, true /* Add before core handlers */ );
		editor.on( 'paste', this.onPaste, true /* Add before core handlers */ );
		editor.on( 'focus', this.onFocus );
		editor.on( 'input', this.onChange );
		// The change event in TinyMCE fires every time an undo level is added.
		editor.on( 'change', this.onCreateUndoLevel );

		patterns.apply( this, [ editor ] );

		if ( this.props.onSetup ) {
			this.props.onSetup( editor );
		}
	}

	setFocusedElement() {
		if ( this.props.setFocusedElement ) {
			this.props.setFocusedElement( this.props.instanceId );
		}
	}

	onInit() {
		this.registerCustomFormatters();

		// Strip default padding setting for elements in schema, in order to
		// avoid (a) new blocks being considered non-empty by non-breaking
		// space character and (b) empty string or whitespace being assigned
		// as value for the empty field.
		forEach(
			this.editor.schema.elements,
			( element ) => delete element.paddEmpty
		);

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
	 * Handles a paste event from TinyMCE.
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {PasteEvent} event The paste event as triggered by TinyMCE.
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

			event.preventDefault();
		}

		this.pastedPlainText = plainText;
		this.isPlainTextPaste = types.length === 1 && types[ 0 ] === 'text/plain';
	}

	/**
	 * Handles a PrePasteProcess event from TinyMCE.
	 *
	 * Will call the paste handler with the pasted data. If it is a string tries
	 * to put it in the containing TinyMCE editor. Otherwise call the `onSplit`
	 * handler.
	 *
	 * @param {PrePasteProcessEvent} event The PrePasteProcess event as triggered
	 *                                     by TinyMCE.
	 */
	onPastePreProcess( event ) {
		const HTML = this.isPlainTextPaste ? '' : event.content;

		event.preventDefault();

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
			HTML,
			plainText: this.pastedPlainText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.context.canUserUseUnfilteredHTML,
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

		this.context.onCreateUndoLevel();
	}

	/**
	 * Calculates the relative position where the link toolbar should be.
	 *
	 * Based on the selection of the text inside this element a position is
	 * calculated where the toolbar should be. This can be used downstream to
	 * absolutely position the toolbar.
	 *
	 * @param {DOMRect} position Caret range rectangle.
	 *
	 * @return {{top: number, left: number}} The desired position of the toolbar.
	 */
	getFocusPosition( position ) {
		// The container is relatively positioned.
		const containerPosition = this.containerRef.current.getBoundingClientRect();

		return {
			top: position.top - containerPosition.top + position.height,
			left: position.left - containerPosition.left + ( position.width / 2 ),
		};
	}

	/**
	 * Handles a keydown event from TinyMCE.
	 *
	 * @param {KeydownEvent} event The keydown event as triggered by TinyMCE.
	 */
	onKeyDown( event ) {
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

			if ( this.props.onRemove && this.isEmpty() ) {
				this.props.onRemove( forward );
			}

			event.preventDefault();

			// Calling onMerge() or onRemove() will destroy the editor, so it's important
			// that we stop other handlers (e.g. ones registered by TinyMCE) from
			// also handling this event.
			event.stopImmediatePropagation();
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

	onNewBlock( event ) {
		const { multiline, onSplit } = this.props;
		if ( multiline || ! onSplit ) {
			return;
		}

		const { format, value } = this.props;
		const { firstChild, lastChild } = this.editor.getContent( { format: 'tree' } );
		const isEmptyNewBlock = lastChild.isEmpty( {} );
		if ( isEmptyNewBlock ) {
			onSplit( value, [] );
		} else {
			onSplit(
				treeToFormat( firstChild, format ),
				treeToFormat( lastChild, format )
			);
		}

		event.newBlock.remove();
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

		let rect;
		const selectedAnchor = find( parents, ( node ) => node.tagName === 'A' );
		if ( selectedAnchor ) {
			// If we selected a link, position the Link UI below the link
			rect = selectedAnchor.getBoundingClientRect();
		} else {
			// Otherwise, position the Link UI below the cursor or text selection
			rect = getRectangleFromRange( this.editor.selection.getRng() );
		}
		const focusPosition = this.getFocusPosition( rect );

		this.setState( { formats, focusPosition, selectedNodeId: this.state.selectedNodeId + 1 } );

		if ( this.props.isViewportSmall ) {
			// Originally called on `focusin`, that hook turned out to be
			// premature. On `nodechange` we can work with the finalized TinyMCE
			// instance and scroll to proper position.
			this.scrollToRect( rect );
		}
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

	setContent( content ) {
		const { format } = this.props;
		this.editor.setContent( valueToString( content, format ) );
	}

	getContent() {
		const { multiline, format } = this.props;

		let tree = this.editor.getContent( { format: 'tree' } );
		if ( ! multiline ) {
			tree = tree.firstChild;
		}

		return treeToFormat( tree, format );
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

		if ( 'development' === process.env.NODE_ENV ) {
			if ( ! isEqual( this.props.formatters, prevProps.formatters ) ) {
				// eslint-disable-next-line no-console
				console.error( 'Formatters passed via `formatters` prop will only be registered once. Formatters can be enabled/disabled via the `formattingControls` prop.' );
			}
		}
	}

	/**
	 * Returns true if the field is currently empty, or false otherwise.
	 *
	 * @param {Array} value Content to check.
	 *
	 * @return {boolean} Whether field is empty.
	 */
	isEmpty( value = this.props.value ) {
		return ! value || ! value.length;
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
			if ( format === 'link' ) {
				if ( !! formatValue ) {
					if ( formatValue.isAdding ) {
						return;
					}

					const { value: href, target } = formatValue;

					if ( ! this.isFormatActive( 'link' ) && this.editor.selection.isCollapsed() ) {
						// When no link or text is selected, insert a link with the URL as its text
						const anchorHTML = this.editor.dom.createHTML(
							'a',
							{ href, target },
							this.editor.dom.encode( href )
						);
						this.editor.insertContent( anchorHTML );
					} else {
						// Use built-in TinyMCE command turn the selection into a link. This takes
						// care of deleting any existing links within the selection
						this.editor.execCommand( 'mceInsertLink', false, { href, target } );
					}
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
				focusPosition={ this.state.focusPosition }
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
				<Autocomplete onReplace={ this.props.onReplace } completers={ autocompleters }>
					{ ( { isExpanded, listBoxId, activeId } ) => (
						<Fragment>
							<TinyMCE
								tagName={ MultilineTag ? Tagname : 'div' }
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

RichText.contextTypes = {
	onUndo: noop,
	onRedo: noop,
	canUserUseUnfilteredHTML: noop,
	onCreateUndoLevel: noop,
};

RichText.defaultProps = {
	formattingControls: DEFAULT_FORMATS,
	formatters: [],
	format: 'element',
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

		return {
			isViewportSmall: isViewportMatch( '< small' ),
		};
	} ),
	withSafeTimeout,
] )( RichText );

RichTextContainer.Content = ( { value, format = 'element', tagName: Tag, ...props } ) => {
	let children;
	switch ( format ) {
		case 'string':
			children = <RawHTML>{ value }</RawHTML>;
			break;
		default:
			children = value;
			break;
	}

	if ( Tag ) {
		return <Tag { ...props }>{ children }</Tag>;
	}

	return children;
};

export default RichTextContainer;
