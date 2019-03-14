/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';
import { View, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { BlockFormatControls } from '@wordpress/block-editor';
import { withSelect } from '@wordpress/data';
import {
	applyFormat,
	getActiveFormat,
	isEmpty,
	create,
	split,
	toHTMLString,
	insert,
	isCollapsed,
} from '@wordpress/rich-text';
import { decodeEntities } from '@wordpress/html-entities';
import { BACKSPACE } from '@wordpress/keycodes';
import { pasteHandler, children } from '@wordpress/blocks';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import FormatToolbar from './format-toolbar';

import styles from './style.scss';

const isRichTextValueEmpty = ( value ) => {
	return ! value || ! value.length;
};

const unescapeSpaces = ( text ) => {
	return text.replace( /&nbsp;|&#160;/gi, ' ' );
};

/**
 * Calls {@link pasteHandler} with a fallback to plain text when HTML processing
 * results in errors
 *
 * @param {Object}  [options]     The options to pass to {@link pasteHandler}
 *
 * @return {Array|string}         A list of blocks or a string, depending on
 *                                `handlerMode`.
 */
const saferPasteHandler = ( options ) => {
	try {
		return pasteHandler( options );
	} catch ( error ) {
		window.console.log( 'Pasting HTML failed:', error );
		window.console.log( 'HTML:', options.HTML );
		window.console.log( 'Falling back to plain text.' );
		// fallback to plain text
		return pasteHandler( { ...options, HTML: '' } );
	}
};

const gutenbergFormatNamesToAztec = {
	'core/bold': 'bold',
	'core/italic': 'italic',
	'core/strikethrough': 'strikethrough',
};

export class RichText extends Component {
	constructor() {
		super( ...arguments );
		this.isIOS = Platform.OS === 'ios';
		this.onChange = this.onChange.bind( this );
		this.onEnter = this.onEnter.bind( this );
		this.onBackspace = this.onBackspace.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.onFormatChange = this.onFormatChange.bind( this );
		// This prevents a bug in Aztec which triggers onSelectionChange twice on format change
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.valueToFormat = this.valueToFormat.bind( this );
		this.state = {
			start: 0,
			end: 0,
			formatPlaceholder: null,
		};
	}

	/**
	 * Get the current record (value and selection) from props and state.
	 *
	 * @return {Object} The current record (value and selection).
	 */
	getRecord() {
		const { formatPlaceholder, start, end } = this.state;
		// Since we get the text selection from Aztec we need to be in sync with the HTML `value`
		// Removing leading white spaces using `trim()` should make sure this is the case.
		const { formats, replacements, text } = this.formatToValue( this.props.value === undefined ? undefined : this.props.value.trimLeft() );

		return { formats, replacements, formatPlaceholder, text, start, end };
	}

	/*
	 * Splits the content at the location of the selection.
	 *
	 * Replaces the content of the editor inside this element with the contents
	 * before the selection. Sends the elements after the selection to the `onSplit`
	 * handler.
	 *
	 */
	splitContent( currentRecord, blocks = [], isPasted = false ) {
		const { onSplit } = this.props;

		if ( ! onSplit ) {
			return;
		}

		// TODO : Fix the index position in AztecNative for Android
		let [ before, after ] = split( currentRecord );

		// In case split occurs at the trailing or leading edge of the field,
		// assume that the before/after values respectively reflect the current
		// value. This also provides an opportunity for the parent component to
		// determine whether the before/after value has changed using a trivial
		//  strict equality operation.
		if ( isEmpty( after ) ) {
			before = currentRecord;
		} else if ( isEmpty( before ) ) {
			after = currentRecord;
		}

		// If pasting and the split would result in no content other than the
		// pasted blocks, remove the before and after blocks.
		if ( isPasted ) {
			before = isEmpty( before ) ? null : before;
			after = isEmpty( after ) ? null : after;
		}

		if ( before ) {
			before = this.valueToFormat( before );
		}

		if ( after ) {
			after = this.valueToFormat( after );
		}

		// The onSplit event can cause a content update event for this block.  Such event should
		// definitely be processed by our native components, since they have no knowledge of
		// how the split works.  Setting lastEventCount to undefined forces the native component to
		// always update when provided with new content.
		this.lastEventCount = undefined;

		onSplit( before, after, ...blocks );
	}

	valueToFormat( value ) {
		// remove the outer root tags
		return this.removeRootTagsProduceByAztec( toHTMLString( {
			value,
			multilineTag: this.multilineTag,
		} ) );
	}

	getActiveFormatNames( record ) {
		const {
			formatTypes,
		} = this.props;

		return formatTypes.map( ( { name } ) => name ).filter( ( name ) => {
			return getActiveFormat( record, name ) !== undefined;
		} ).map( ( name ) => gutenbergFormatNamesToAztec[ name ] ).filter( Boolean );
	}

	onFormatChange( record ) {
		let newContent;
		// valueToFormat might throw when converting the record to a tree structure
		// let's ignore the event for now and force a render update so we're still in sync
		try {
			newContent = this.valueToFormat( record );
		} catch ( error ) {
			// eslint-disable-next-line no-console
			console.log( error );
		}
		this.setState( {
			formatPlaceholder: record.formatPlaceholder,
		} );
		if ( newContent && newContent !== this.props.value ) {
			this.props.onChange( newContent );
		} else {
			// make sure the component rerenders without refreshing the text on gutenberg
			// (this can trigger other events that might update the active formats on aztec)
			this.lastEventCount = 0;
			this.forceUpdate();
		}
	}

	/*
	 * Cleans up any root tags produced by aztec.
	 * TODO: This should be removed on a later version when aztec doesn't return the top tag of the text being edited
	 */

	removeRootTagsProduceByAztec( html ) {
		let result = this.removeRootTag( this.props.tagName, html );
		// Temporary workaround for https://github.com/WordPress/gutenberg/pull/13763
		if ( this.props.rootTagsToEliminate ) {
			this.props.rootTagsToEliminate.forEach( ( element ) => {
				result = this.removeRootTag( element, result );
			} );
		}
		return result;
	}

	removeRootTag( tag, html ) {
		const openingTagRegexp = RegExp( '^<' + tag + '>', 'gim' );
		const closingTagRegexp = RegExp( '</' + tag + '>$', 'gim' );
		return html.replace( openingTagRegexp, '' ).replace( closingTagRegexp, '' );
	}

	/*
	 * Handles any case where the content of the AztecRN instance has changed
	 */
	onChange( event ) {
		this.lastEventCount = event.nativeEvent.eventCount;
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec( unescapeSpaces( event.nativeEvent.text ) );
		this.lastContent = contentWithoutRootTag;
		this.props.onChange( this.lastContent );
	}

	/**
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */

	onContentSizeChange( contentSize ) {
		const contentHeight = contentSize.height;
		this.props.onContentSizeChange( {
			aztecHeight: contentHeight,
		} );
	}

	// eslint-disable-next-line no-unused-vars
	onEnter( event ) {
		this.lastEventCount = event.nativeEvent.eventCount;
		if ( ! this.props.onSplit ) {
			// TODO: insert the \n char instead?
			return;
		}

		const currentRecord = this.createRecord( {
			...event.nativeEvent,
			currentContent: unescapeSpaces( event.nativeEvent.text ),
		} );

		this.splitContent( currentRecord );
	}

	// eslint-disable-next-line no-unused-vars
	onBackspace( event ) {
		const { onMerge, onRemove } = this.props;
		if ( ! onMerge && ! onRemove ) {
			return;
		}

		const keyCode = BACKSPACE; // TODO : should we differentiate BACKSPACE and DELETE?
		const isReverse = keyCode === BACKSPACE;

		const empty = this.isEmpty();

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
	}

	/**
	 * Handles a paste event from the native Aztec Wrapper.
	 *
	 * @param {PasteEvent} event The paste event which wraps `nativeEvent`.
	 */
	onPaste( event ) {
		const isPasted = true;
		const { onSplit } = this.props;

		const { pastedText, pastedHtml } = event.nativeEvent;
		const currentRecord = this.createRecord( event.nativeEvent );

		event.preventDefault();

		// There is a selection, check if a URL is pasted.
		if ( ! isCollapsed( currentRecord ) ) {
			const trimmedText = ( pastedHtml || pastedText ).replace( /<[^>]+>/g, '' )
				.trim();

			// A URL was pasted, turn the selection into a link
			if ( isURL( trimmedText ) ) {
				const linkedRecord = applyFormat( currentRecord, {
					type: 'a',
					attributes: {
						href: decodeEntities( trimmedText ),
					},
				} );
				this.lastContent = this.valueToFormat( linkedRecord );
				this.lastEventCount = undefined;
				this.props.onChange( this.lastContent );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', trimmedText );

				return;
			}
		}

		const shouldReplace = this.props.onReplace && this.isEmpty();

		let mode = 'INLINE';

		if ( shouldReplace ) {
			mode = 'BLOCKS';
		} else if ( onSplit ) {
			mode = 'AUTO';
		}

		const pastedContent = saferPasteHandler( {
			HTML: pastedHtml,
			plainText: pastedText,
			mode,
			tagName: this.props.tagName,
			canUserUseUnfilteredHTML: this.props.canUserUseUnfilteredHTML,
		} );

		if ( typeof pastedContent === 'string' ) {
			const recordToInsert = create( { html: pastedContent } );
			const insertedContent = insert( currentRecord, recordToInsert );
			const newContent = this.valueToFormat( insertedContent );
			this.lastEventCount = undefined;
			this.lastContent = newContent;
			this.props.onChange( this.lastContent );
		} else if ( onSplit ) {
			if ( ! pastedContent.length ) {
				return;
			}

			if ( shouldReplace ) {
				this.props.onReplace( pastedContent );
			} else {
				this.splitContent( currentRecord, pastedContent, isPasted );
			}
		}
	}

	onSelectionChange( start, end, text, event ) {
		// `end` can be less than `start` on iOS
		// Let's fix that here so `rich-text/slice` can work properly
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );
		const noChange = this.state.start === start && this.state.end === end;
		const isTyping = this.state.start + 1 === realStart;
		const shouldKeepFormats = noChange || isTyping;
		// update format placeholder to continue writing in the current format
		// or set it to null if user jumped to another part in the text
		const formatPlaceholder = shouldKeepFormats && this.state.formatPlaceholder ? {
			...this.state.formatPlaceholder,
			index: realStart,
		} : null;
		this.setState( {
			start: realStart,
			end: realEnd,
			formatPlaceholder,
		} );
		this.lastEventCount = event.nativeEvent.eventCount;
		// we don't want to refresh aztec as no content can have changed from this event
		// let's update lastContent to prevent that in shouldComponentUpdate
		this.lastContent = this.removeRootTagsProduceByAztec( unescapeSpaces( text ) );
		this.props.onChange( this.lastContent );
	}

	isEmpty() {
		return isEmpty( this.formatToValue( this.props.value ) );
	}

	/**
	 * Creates a RichText value "record" from native content and selection
	 * information
	 *
	 * @param {string} currentContent The content (usually an HTML string) from
	 *                                the native component.
	 * @param {number}    selectionStart The start of the selection.
	 * @param {number}      selectionEnd The end of the selection (same as start if
	 *                                cursor instead of selection).
	 *
   * @return {Object} A RichText value with formats and selection.
	 */
	createRecord( { currentContent, selectionStart, selectionEnd } ) {
		// strip outer <p> tags
		const innerContent = this.removeRootTagsProduceByAztec( currentContent );

		// create record (with selection) from current contents
		const currentRecord = {
			start: selectionStart,
			end: selectionEnd,
			...create( {
				html: innerContent,
				range: null,
				multilineTag: false,
			} ),
		};

		return currentRecord;
	}

	formatToValue( value ) {
		// Handle deprecated `children` and `node` sources.
		if ( Array.isArray( value ) ) {
			return create( {
				html: children.toHTML( value ),
				multilineTag: this.multilineTag,
			} );
		}

		if ( this.props.format === 'string' ) {
			return create( {
				html: value,
				multilineTag: this.multilineTag,
			} );
		}

		// Guard for blocks passing `null` in onSplit callbacks. May be removed
		// if onSplit is revised to not pass a `null` value.
		if ( value === null ) {
			return create();
		}

		return value;
	}

	shouldComponentUpdate( nextProps ) {
		if ( nextProps.tagName !== this.props.tagName || nextProps.isSelected !== this.props.isSelected ) {
			this.lastEventCount = undefined;
			this.lastContent = undefined;
			return true;
		}

		// TODO: Please re-introduce the check to avoid updating the content right after an `onChange` call.
		// It was removed in https://github.com/WordPress/gutenberg/pull/12417 to fix undo/redo problem.

		// If the component is changed React side (undo/redo/merging/splitting/custom text actions)
		// we need to make sure the native is updated as well
		if ( ( typeof nextProps.value !== 'undefined' ) &&
			( typeof this.lastContent !== 'undefined' ) &&
			nextProps.value !== this.lastContent ) {
			this.lastEventCount = undefined; // force a refresh on the native side
		}

		return true;
	}

	componentDidMount() {
		if ( this.props.isSelected ) {
			this._editor.focus();
		}
	}

	componentWillUnmount() {
		if ( this._editor.isFocused() ) {
			this._editor.blur();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.isSelected && ! prevProps.isSelected ) {
			this._editor.focus();
		} else if ( ! this.props.isSelected && prevProps.isSelected && this.isIOS ) {
			this._editor.blur();
		}
	}

	render() {
		const {
			tagName,
			style,
			formattingControls,
			isSelected,
		} = this.props;

		const record = this.getRecord();
		// Save back to HTML from React tree
		const value = this.valueToFormat( record );
		let html = `<${ tagName }>${ value }</${ tagName }>`;
		// We need to check if the value is undefined or empty, and then assign it properly otherwise the placeholder is not visible
		if ( value === undefined || value === '' ) {
			html = '';
			this.lastEventCount = undefined; // force a refresh on the native side
		}

		return (
			<View>
				{ isSelected && (
					<BlockFormatControls>
						<FormatToolbar controls={ formattingControls } />
					</BlockFormatControls>
				) }
				<RCTAztecView
					ref={ ( ref ) => {
						this._editor = ref;

						if ( this.props.setRef ) {
							this.props.setRef( ref );
						}
					} }
					text={ { text: html, eventCount: this.lastEventCount } }
					placeholder={ this.props.placeholder }
					placeholderTextColor={ this.props.placeholderTextColor || styles[ 'block-editor-rich-text' ].textDecorationColor }
					onChange={ this.onChange }
					onFocus={ this.props.onFocus }
					onBlur={ this.props.onBlur }
					onEnter={ this.onEnter }
					onBackspace={ this.onBackspace }
					onPaste={ this.onPaste }
					activeFormats={ this.getActiveFormatNames( record ) }
					onContentSizeChange={ this.onContentSizeChange }
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					onSelectionChange={ this.onSelectionChange }
					isSelected={ isSelected }
					blockType={ { tag: tagName } }
					color={ 'black' }
					maxImagesWidth={ 200 }
					style={ style }
					fontFamily={ this.props.fontFamily || styles[ 'block-editor-rich-text' ].fontFamily }
					fontSize={ this.props.fontSize }
					fontWeight={ this.props.fontWeight }
					fontStyle={ this.props.fontStyle }
				/>
				{ isSelected && <FormatEdit value={ record } onChange={ this.onFormatChange } /> }
			</View>
		);
	}
}

RichText.defaultProps = {
	formattingControls: [ 'bold', 'italic', 'link', 'strikethrough' ],
	format: 'string',
};

const RichTextContainer = compose( [
	withInstanceId,
	withSelect( ( select ) => {
		const { getFormatTypes } = select( 'core/rich-text' );

		return {
			formatTypes: getFormatTypes(),
		};
	} ),
] )( RichText );

RichTextContainer.Content = ( { value, format, tagName: Tag, ...props } ) => {
	let content;
	switch ( format ) {
		case 'string':
			content = <RawHTML>{ value }</RawHTML>;
			break;
	}

	if ( Tag ) {
		return <Tag { ...props }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = isRichTextValueEmpty;

RichTextContainer.Content.defaultProps = {
	format: 'string',
};

export default RichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { UnstableRichTextInputEvent } from './input-event';
