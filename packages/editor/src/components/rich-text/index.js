/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	find,
	isNil,
	isEqual,
	omit,
	pickBy,
	get,
	isPlainObject,
} from 'lodash';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { Component, Fragment, RawHTML } from '@wordpress/element';
import { isHorizontalEdge } from '@wordpress/dom';
import { createBlobURL } from '@wordpress/blob';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import { withDispatch, withSelect } from '@wordpress/data';
import { pasteHandler, children, getBlockTransforms, findTransform } from '@wordpress/blocks';
import { withInstanceId, withSafeTimeout, compose } from '@wordpress/compose';
import { isURL } from '@wordpress/url';
import {
	isEmpty,
	create,
	apply,
	applyFormat,
	split,
	toHTMLString,
	getTextContent,
	insert,
	insertLineSeparator,
	isEmptyLine,
	unstableToDom,
	getSelectionStart,
	getSelectionEnd,
	remove,
	removeFormat,
	isCollapsed,
	LINE_SEPARATOR,
	charAt,
} from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { withFilters, IsolatedEventContainer } from '@wordpress/components';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import FormatEdit from './format-edit';
import FormatToolbar from './format-toolbar';
import TinyMCE, { TINYMCE_ZWSP } from './tinymce';
import { pickAriaProps } from './aria';
import { getPatterns } from './patterns';
import { withBlockEditContext } from '../block-edit/context';
import { ListEdit } from './list-edit';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';

/**
 * Browser dependencies
 */

const { getSelection } = window;

export class RichText extends Component {
	constructor( { value, onReplace, multiline } ) {
		super( ...arguments );

		if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
			this.multilineTag = multiline === true ? 'p' : multiline;
		}

		if ( this.multilineTag === 'li' ) {
			this.multilineWrapperTags = [ 'ul', 'ol' ];
		}

		if ( this.props.onSplit ) {
			this.onSplit = this.props.onSplit;

			deprecated( 'wp.editor.RichText onSplit prop', {
				plugin: 'Gutenberg',
				alternative: 'wp.editor.RichText unstableOnSplit prop',
			} );
		} else if ( this.props.unstableOnSplit ) {
			this.onSplit = this.props.unstableOnSplit;
		}

		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.onChange = this.onChange.bind( this );
		this.onDeleteKeyDown = this.onDeleteKeyDown.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onCreateUndoLevel = this.onCreateUndoLevel.bind( this );
		this.setFocusedElement = this.setFocusedElement.bind( this );
		this.onInput = this.onInput.bind( this );
		this.onCompositionEnd = this.onCompositionEnd.bind( this );
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.getRecord = this.getRecord.bind( this );
		this.createRecord = this.createRecord.bind( this );
		this.applyRecord = this.applyRecord.bind( this );
		this.isEmpty = this.isEmpty.bind( this );
		this.valueToFormat = this.valueToFormat.bind( this );
		this.setRef = this.setRef.bind( this );
		this.valueToEditableHTML = this.valueToEditableHTML.bind( this );

		this.formatToValue = memize( this.formatToValue.bind( this ), { size: 1 } );

		this.savedContent = value;
		this.patterns = getPatterns( {
			onReplace,
			onCreateUndoLevel: this.onCreateUndoLevel,
			valueToFormat: this.valueToFormat,
			onChange: this.onChange,
		} );
		this.enterPatterns = getBlockTransforms( 'from' )
			.filter( ( { type } ) => type === 'enter' );

		this.state = {};

		this.usedDeprecatedChildrenSource = Array.isArray( value );
		this.lastHistoryValue = value;
	}

	componentWillUnmount() {
		document.removeEventListener( 'selectionchange', this.onSelectionChange );
	}

	setRef( node ) {
		this.editableRef = node;
	}

	setFocusedElement() {
		if ( this.props.setFocusedElement ) {
			this.props.setFocusedElement( this.props.instanceId );
		}
	}

	/**
	 * Get the current record (value and selection) from props and state.
	 *
	 * @return {Object} The current record (value and selection).
	 */
	getRecord() {
		const { formats, text } = this.formatToValue( this.props.value );
		const { start, end } = this.state;

		return { formats, text, start, end };
	}

	createRecord() {
		const range = getSelection().getRangeAt( 0 );

		return create( {
			element: this.editableRef,
			range,
			multilineTag: this.multilineTag,
			multilineWrapperTags: this.multilineWrapperTags,
			removeNode: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
			unwrapNode: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
			removeAttribute: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
			filterString: ( string ) => string.replace( TINYMCE_ZWSP, '' ),
			prepareEditableTree: this.props.prepareEditableTree,
		} );
	}

	applyRecord( record ) {
		apply( {
			value: record,
			current: this.editableRef,
			multilineTag: this.multilineTag,
			multilineWrapperTags: this.multilineWrapperTags,
			createLinePadding( doc ) {
				const element = doc.createElement( 'br' );
				element.setAttribute( 'data-mce-bogus', '1' );
				return element;
			},
			prepareEditableTree: this.props.prepareEditableTree,
		} );
	}

	isEmpty() {
		return isEmpty( this.formatToValue( this.props.value ) );
	}

	/**
	 * Handles a paste event.
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {PasteEvent} event The paste event.
	 */
	onPaste( event ) {
		const clipboardData = event.clipboardData;
		let { items, files } = clipboardData;

		// In Edge these properties can be null instead of undefined, so a more
		// rigorous test is required over using default values.
		items = isNil( items ) ? [] : items;
		files = isNil( files ) ? [] : files;

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
		const item = find( [ ...items, ...files ], ( { type } ) => /^image\/(?:jpe?g|png|gif)$/.test( type ) );
		if ( item && ! html ) {
			const file = item.getAsFile ? item.getAsFile() : item;
			const content = pasteHandler( {
				HTML: `<img src="${ createBlobURL( file ) }">`,
				mode: 'BLOCKS',
				tagName: this.props.tagName,
			} );
			const shouldReplace = this.props.onReplace && this.isEmpty();

			// Allows us to ask for this information when we get a report.
			window.console.log( 'Received item:\n\n', file );

			if ( shouldReplace ) {
				this.props.onReplace( content );
			} else if ( this.onSplit ) {
				this.splitContent( content );
			}

			return;
		}

		const record = this.getRecord();

		// There is a selection, check if a URL is pasted.
		if ( ! isCollapsed( record ) ) {
			const pastedText = ( html || plainText ).replace( /<[^>]+>/g, '' ).trim();

			// A URL was pasted, turn the selection into a link
			if ( isURL( pastedText ) ) {
				this.onChange( applyFormat( record, {
					type: 'a',
					attributes: {
						href: decodeEntities( pastedText ),
					},
				} ) );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', pastedText );

				return;
			}
		}

		const shouldReplace = this.props.onReplace && this.isEmpty();

		let mode = 'INLINE';

		if ( shouldReplace ) {
			mode = 'BLOCKS';
		} else if ( this.onSplit ) {
			mode = 'AUTO';
		}

		const content = pasteHandler( {
			HTML: html,
			plainText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.props.canUserUseUnfilteredHTML,
		} );

		if ( typeof content === 'string' ) {
			const recordToInsert = create( { html: content } );
			this.onChange( insert( record, recordToInsert ) );
		} else if ( this.onSplit ) {
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

		document.addEventListener( 'selectionchange', this.onSelectionChange );
	}

	onBlur() {
		document.removeEventListener( 'selectionchange', this.onSelectionChange );
	}

	/**
	 * Handle input on the next selection change event.
	 *
	 * @param {SyntheticEvent} event Synthetic input event.
	 */
	onInput( event ) {
		// For Input Method Editor (IME), used in Chinese, Japanese, and Korean
		// (CJK), do not trigger a change if characters are being composed.
		// Browsers setting `isComposing` to `true` will usually emit a final
		// `input` event when the characters are composed.
		if ( event.nativeEvent.isComposing ) {
			return;
		}

		const record = this.createRecord();
		const transformed = this.patterns.reduce( ( accumlator, transform ) => transform( accumlator ), record );

		this.onChange( transformed, {
			withoutHistory: true,
		} );

		// Create an undo level when input stops for over a second.
		this.props.clearTimeout( this.onInput.timeout );
		this.onInput.timeout = this.props.setTimeout( this.onCreateUndoLevel, 1000 );
	}

	onCompositionEnd() {
		// Ensure the value is up-to-date for browsers that don't emit a final
		// input event after composition.
		this.onChange( this.createRecord() );
	}

	/**
	 * Handles the `selectionchange` event: sync the selection to local state.
	 */
	onSelectionChange() {
		const { start, end, formats } = this.createRecord();

		if ( start !== this.state.start || end !== this.state.end ) {
			const isCaretWithinFormattedText = this.props.isCaretWithinFormattedText;
			if ( ! isCaretWithinFormattedText && formats[ start ] ) {
				this.props.onEnterFormattedText();
			} else if ( isCaretWithinFormattedText && ! formats[ start ] ) {
				this.props.onExitFormattedText();
			}

			this.setState( { start, end } );
		}
	}

	/**
	 * Calls all registered onChangeEditableValue handlers.
	 *
	 * @param {Array}  formats The formats of the latest rich-text value.
	 * @param {string} text    The text of the latest rich-text value.
	 */
	onChangeEditableValue( { formats, text } ) {
		get( this.props, [ 'onChangeEditableValue' ], [] ).forEach( ( eventHandler ) => {
			eventHandler( formats, text );
		} );
	}

	/**
	 * Sync the value to global state. The node tree and selection will also be
	 * updated if differences are found.
	 *
	 * @param {Object}  record            The record to sync and apply.
	 * @param {Object}  $2                Named options.
	 * @param {boolean} $2.withoutHistory If true, no undo level will be
	 *                                    created.
	 */
	onChange( record, { withoutHistory } = {} ) {
		this.applyRecord( record );

		const { start, end } = record;

		this.onChangeEditableValue( record );

		this.savedContent = this.valueToFormat( record );
		this.props.onChange( this.savedContent );
		this.setState( { start, end } );

		if ( ! withoutHistory ) {
			this.onCreateUndoLevel();
		}
	}

	onCreateUndoLevel() {
		// If the content is the same, no level needs to be created.
		if ( this.lastHistoryValue === this.savedContent ) {
			return;
		}

		this.props.onCreateUndoLevel();
		this.lastHistoryValue = this.savedContent;
	}

	/**
	 * Handles a delete keyDown event to handle merge or removal for collapsed
	 * selection where caret is at directional edge: forward for a delete key,
	 * reverse for a backspace key.
	 *
	 * @link https://en.wikipedia.org/wiki/Caret_navigation
	 *
	 * @param {KeyboardEvent} event Keydown event.
	 */
	onDeleteKeyDown( event ) {
		const { onMerge, onRemove } = this.props;
		if ( ! onMerge && ! onRemove ) {
			return;
		}

		const { keyCode } = event;
		const isReverse = keyCode === BACKSPACE;

		// Only process delete if the key press occurs at uncollapsed edge.
		if ( ! isCollapsed( this.createRecord() ) ) {
			return;
		}

		const empty = this.isEmpty();

		// It is important to consider emptiness because an empty container
		// will include a bogus TinyMCE BR node _after_ the caret, so in a
		// forward deletion the isHorizontalEdge function will incorrectly
		// interpret the presence of the bogus node as not being at the edge.
		const isEdge = ( empty || isHorizontalEdge( this.editableRef, isReverse ) );

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
		if ( onRemove && empty && isReverse ) {
			onRemove( ! isReverse );
		}

		event.preventDefault();
	}

	/**
	 * Handles a keydown event.
	 *
	 * @param {KeyboardEvent} event The keydown event.
	 */
	onKeyDown( event ) {
		const { keyCode } = event;

		if ( keyCode === DELETE || keyCode === BACKSPACE ) {
			const value = this.createRecord();
			const start = getSelectionStart( value );
			const end = getSelectionEnd( value );

			// Always handle full content deletion ourselves.
			if ( start === 0 && end !== 0 && end === value.text.length ) {
				this.onChange( remove( value ) );
				event.preventDefault();
				return;
			}

			if ( this.multilineTag ) {
				let newValue;

				if ( keyCode === BACKSPACE ) {
					if ( charAt( value, start - 1 ) === LINE_SEPARATOR ) {
						newValue = remove(
							value,
							// Only remove the line if the selection is
							// collapsed.
							isCollapsed( value ) ? start - 1 : start,
							end
						);
					}
				} else if ( charAt( value, end ) === LINE_SEPARATOR ) {
					newValue = remove(
						value,
						start,
						// Only remove the line if the selection is collapsed.
						isCollapsed( value ) ? end + 1 : end,
					);
				}

				if ( newValue ) {
					this.onChange( newValue );
					event.preventDefault();
				}
			}

			this.onDeleteKeyDown( event );
		} else if ( keyCode === ENTER ) {
			event.preventDefault();

			const record = this.createRecord();

			if ( this.props.onReplace ) {
				const text = getTextContent( record );
				const transformation = findTransform( this.enterPatterns, ( item ) => {
					return item.regExp.test( text );
				} );

				if ( transformation ) {
					this.props.onReplace( [
						transformation.transform( { content: text } ),
					] );
					return;
				}
			}

			if ( this.multilineTag ) {
				if ( this.onSplit && isEmptyLine( record ) ) {
					this.onSplit( ...split( record ).map( this.valueToFormat ) );
				} else {
					this.onChange( insertLineSeparator( record ) );
				}
			} else if ( event.shiftKey || ! this.onSplit ) {
				const text = getTextContent( record );
				const length = text.length;
				let toInsert = '\n';

				// If the caret is at the end of the text, and there is no
				// trailing line break or no text at all, we have to insert two
				// line breaks in order to create a new line visually and place
				// the caret there.
				if ( record.end === length && (
					text.charAt( length - 1 ) !== '\n' || length === 0
				) ) {
					toInsert = '\n\n';
				}

				this.onChange( insert( record, toInsert ) );
			} else {
				this.splitContent();
			}
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
		if ( ! this.onSplit ) {
			return;
		}

		const record = this.createRecord();
		let [ before, after ] = split( record );

		// In case split occurs at the trailing or leading edge of the field,
		// assume that the before/after values respectively reflect the current
		// value. This also provides an opportunity for the parent component to
		// determine whether the before/after value has changed using a trivial
		//  strict equality operation.
		if ( isEmpty( after ) ) {
			before = record;
		} else if ( isEmpty( before ) ) {
			after = record;
		}

		// If pasting and the split would result in no content other than the
		// pasted blocks, remove the before and after blocks.
		if ( context.paste ) {
			before = isEmpty( before ) ? null : before;
			after = isEmpty( after ) ? null : after;
		}

		if ( before ) {
			before = this.valueToFormat( before );
		}

		if ( after ) {
			after = this.valueToFormat( after );
		}

		this.onSplit( before, after, ...blocks );
	}

	componentDidUpdate( prevProps ) {
		const { tagName, value, isSelected } = this.props;

		if (
			tagName === prevProps.tagName &&
			value !== prevProps.value &&
			value !== this.savedContent
		) {
			// Handle deprecated `children` and `node` sources.
			// The old way of passing a value with the `node` matcher required
			// the value to be mapped first, creating a new array each time, so
			// a shallow check wouldn't work. We need to check deep equality.
			// This is only executed for a deprecated API and will eventually be
			// removed.
			if ( Array.isArray( value ) && isEqual( value, this.savedContent ) ) {
				return;
			}

			const record = this.formatToValue( value );

			if ( isSelected ) {
				const prevRecord = this.formatToValue( prevProps.value );
				const length = getTextContent( prevRecord ).length;
				record.start = length;
				record.end = length;
			}

			this.applyRecord( record );
			this.savedContent = value;
		}

		// If any format props update, reapply value.
		const shouldReapply = Object.keys( this.props ).some( ( name ) => {
			if ( name.indexOf( 'format_' ) !== 0 ) {
				return false;
			}

			// Allow primitives and arrays:
			if ( ! isPlainObject( this.props[ name ] ) ) {
				return this.props[ name ] !== prevProps[ name ];
			}

			return Object.keys( this.props[ name ] ).some( ( subName ) => {
				return this.props[ name ][ subName ] !== prevProps[ name ][ subName ];
			} );
		} );

		if ( shouldReapply ) {
			const record = this.formatToValue( value );

			// Maintain the previous selection if the instance is currently
			// selected.
			if ( isSelected ) {
				record.start = this.state.start;
				record.end = this.state.end;
			}

			this.applyRecord( record );
		}
	}

	/**
	 * Get props that are provided by formats to modify RichText.
	 *
	 * @return {Object} Props that start with 'format_'.
	 */
	getFormatProps() {
		return pickBy( this.props, ( propValue, name ) => name.startsWith( 'format_' ) );
	}

	/**
	 * Converts the outside data structure to our internal representation.
	 *
	 * @param {*} value The outside value, data type depends on props.
	 * @return {Object} An internal rich-text value.
	 */
	formatToValue( value ) {
		// Handle deprecated `children` and `node` sources.
		if ( Array.isArray( value ) ) {
			return create( {
				html: children.toHTML( value ),
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
			} );
		}

		if ( this.props.format === 'string' ) {
			return create( {
				html: value,
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
			} );
		}

		// Guard for blocks passing `null` in onSplit callbacks. May be removed
		// if onSplit is revised to not pass a `null` value.
		if ( value === null ) {
			return create();
		}

		return value;
	}

	valueToEditableHTML( value ) {
		return unstableToDom( {
			value,
			multilineTag: this.multilineTag,
			multilineWrapperTags: this.multilineWrapperTags,
			createLinePadding( doc ) {
				const element = doc.createElement( 'br' );
				element.setAttribute( 'data-mce-bogus', '1' );
				return element;
			},
			prepareEditableTree: this.props.prepareEditableTree,
		} ).body.innerHTML;
	}

	/**
	 * Removes editor only formats from the value.
	 *
	 * Editor only formats are applied using `prepareEditableTree`, so we need to
	 * remove them before converting the internal state
	 *
	 * @param {Object} value The internal rich-text value.
	 * @return {Object} A new rich-text value.
	 */
	removeEditorOnlyFormats( value ) {
		this.props.formatTypes.forEach( ( formatType ) => {
			// Remove formats created by prepareEditableTree, because they are editor only.
			if ( formatType.__experimentalCreatePrepareEditableTree ) {
				value = removeFormat( value, formatType.name, 0, value.text.length );
			}
		} );

		return value;
	}

	/**
	 * Converts the internal value to the external data format.
	 *
	 * @param {Object} value The internal rich-text value.
	 * @return {*} The external data format, data type depends on props.
	 */
	valueToFormat( value ) {
		value = this.removeEditorOnlyFormats( value );

		// Handle deprecated `children` and `node` sources.
		if ( this.usedDeprecatedChildrenSource ) {
			return children.fromDOM( unstableToDom( {
				value,
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
			} ).body.childNodes );
		}

		if ( this.props.format === 'string' ) {
			return toHTMLString( {
				value,
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
			} );
		}

		return value;
	}

	render() {
		const {
			tagName: Tagname = 'div',
			style,
			wrapperClassName,
			className,
			inlineToolbar = false,
			formattingControls,
			placeholder,
			keepPlaceholderOnFocus = false,
			isSelected,
			autocompleters,
			onTagNameChange,
		} = this.props;

		const MultilineTag = this.multilineTag;
		const ariaProps = pickAriaProps( this.props );

		// Generating a key that includes `tagName` ensures that if the tag
		// changes, we unmount and destroy the previous TinyMCE element, then
		// mount and initialize a new child element in its place.
		const key = [ 'editor', Tagname ].join();
		const isPlaceholderVisible = placeholder && ( ! isSelected || keepPlaceholderOnFocus ) && this.isEmpty();
		const classes = classnames( wrapperClassName, 'editor-rich-text' );
		const record = this.getRecord();

		return (
			<div className={ classes }
				onFocus={ this.setFocusedElement }
			>
				{ isSelected && this.multilineTag === 'li' && (
					<ListEdit
						onTagNameChange={ onTagNameChange }
						tagName={ Tagname }
						value={ record }
						onChange={ this.onChange }
					/>
				) }
				{ isSelected && ! inlineToolbar && (
					<BlockFormatControls>
						<FormatToolbar controls={ formattingControls } />
					</BlockFormatControls>
				) }
				{ isSelected && inlineToolbar && (
					<IsolatedEventContainer className="editor-rich-text__inline-toolbar">
						<FormatToolbar controls={ formattingControls } />
					</IsolatedEventContainer>
				) }
				<Autocomplete
					onReplace={ this.props.onReplace }
					completers={ autocompleters }
					record={ record }
					onChange={ this.onChange }
				>
					{ ( { listBoxId, activeId } ) => (
						<Fragment>
							<TinyMCE
								tagName={ Tagname }
								style={ style }
								record={ record }
								valueToEditableHTML={ this.valueToEditableHTML }
								isPlaceholderVisible={ isPlaceholderVisible }
								aria-label={ placeholder }
								aria-autocomplete="list"
								aria-owns={ listBoxId }
								aria-activedescendant={ activeId }
								{ ...ariaProps }
								className={ className }
								key={ key }
								onPaste={ this.onPaste }
								onInput={ this.onInput }
								onCompositionEnd={ this.onCompositionEnd }
								onKeyDown={ this.onKeyDown }
								onFocus={ this.onFocus }
								onBlur={ this.onBlur }
								multilineTag={ this.multilineTag }
								multilineWrapperTags={ this.multilineWrapperTags }
								setRef={ this.setRef }
							/>
							{ isPlaceholderVisible &&
								<Tagname
									className={ classnames( 'editor-rich-text__tinymce', className ) }
									style={ style }
								>
									{ MultilineTag ? <MultilineTag>{ placeholder }</MultilineTag> : placeholder }
								</Tagname>
							}
							{ isSelected && <FormatEdit value={ record } onChange={ this.onChange } /> }
						</Fragment>
					) }
				</Autocomplete>
				{ isSelected && <RemoveBrowserShortcuts /> }
			</div>
		);
	}
}

RichText.defaultProps = {
	formattingControls: [ 'bold', 'italic', 'link', 'strikethrough' ],
	format: 'string',
	value: '',
};

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( context, ownProps ) => {
		// When explicitly set as not selected, do nothing.
		if ( ownProps.isSelected === false ) {
			return {
				clientId: context.clientId,
			};
		}
		// When explicitly set as selected, use the value stored in the context instead.
		if ( ownProps.isSelected === true ) {
			return {
				isSelected: context.isSelected,
				clientId: context.clientId,
			};
		}

		// Ensures that only one RichText component can be focused.
		return {
			isSelected: context.isSelected && context.focusedElement === ownProps.instanceId,
			setFocusedElement: context.setFocusedElement,
			clientId: context.clientId,
		};
	} ),
	withSelect( ( select ) => {
		const { canUserUseUnfilteredHTML, isCaretWithinFormattedText } = select( 'core/editor' );
		const { getFormatTypes } = select( 'core/rich-text' );

		return {
			canUserUseUnfilteredHTML: canUserUseUnfilteredHTML(),
			isCaretWithinFormattedText: isCaretWithinFormattedText(),
			formatTypes: getFormatTypes(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			createUndoLevel,
			redo,
			undo,
			enterFormattedText,
			exitFormattedText,
		} = dispatch( 'core/editor' );

		return {
			onCreateUndoLevel: createUndoLevel,
			onRedo: redo,
			onUndo: undo,
			onEnterFormattedText: enterFormattedText,
			onExitFormattedText: exitFormattedText,
		};
	} ),
	withSafeTimeout,
	withFilters( 'experimentalRichText' ),
] )( RichText );

RichTextContainer.Content = ( { value, tagName: Tag, multiline, ...props } ) => {
	let html = value;
	let MultilineTag;

	if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
		MultilineTag = multiline === true ? 'p' : multiline;
	}

	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		html = children.toHTML( value );
	}

	if ( ! html && MultilineTag ) {
		html = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	const content = <RawHTML>{ html }</RawHTML>;

	if ( Tag ) {
		return <Tag { ...omit( props, [ 'format' ] ) }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = ( value = '' ) => {
	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		return ! value || value.length === 0;
	}

	return value.length === 0;
};

RichTextContainer.Content.defaultProps = {
	format: 'string',
	value: '',
};

export default RichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { RichTextInserterItem } from './inserter-list-item';
