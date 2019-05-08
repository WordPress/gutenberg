/*eslint no-console: ["error", { allow: ["warn"] }] */

/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';
import { View, Platform } from 'react-native';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { Component, RawHTML } from '@wordpress/element';
import { withInstanceId, compose } from '@wordpress/compose';
import { BlockFormatControls } from '@wordpress/block-editor';
import { withSelect, withDispatch } from '@wordpress/data';
import {
	applyFormat,
	getActiveFormat,
	__unstableGetActiveFormats as getActiveFormats,
	isEmpty,
	create,
	split,
	toHTMLString,
	insert,
	__unstableInsertLineSeparator as insertLineSeparator,
	__unstableIsEmptyLine as isEmptyLine,
	isCollapsed,
	getTextContent,
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
import { withBlockEditContext } from '../block-edit/context';
import { ListEdit } from './list-edit';

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
	constructor( { value, multiline, selectionStart, selectionEnd } ) {
		super( ...arguments );

		this.isMultiline = false;
		if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
			this.multilineTag = multiline === true ? 'p' : multiline;
			this.isMultiline = true;
		}

		if ( this.multilineTag === 'li' ) {
			this.multilineWrapperTags = [ 'ul', 'ol' ];
		}

		if ( this.props.onSplit ) {
			this.onSplit = this.props.onSplit;
		} else if ( this.props.unstableOnSplit ) {
			this.onSplit = this.props.unstableOnSplit;
		}

		this.isIOS = Platform.OS === 'ios';
		this.onChange = this.onChange.bind( this );
		this.onEnter = this.onEnter.bind( this );
		this.onBackspace = this.onBackspace.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.onTextUpdate = this.onTextUpdate.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.onFormatChangeForceChild = this.onFormatChangeForceChild.bind( this );
		this.onFormatChange = this.onFormatChange.bind( this );
		this.formatToValue = memize(
			this.formatToValue.bind( this ),
			{ maxSize: 1 }
		);

		// This prevents a bug in Aztec which triggers onSelectionChange twice on format change
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionChangeFromAztec = this.onSelectionChangeFromAztec.bind( this );
		this.valueToFormat = this.valueToFormat.bind( this );
		this.willTrimSpaces = this.willTrimSpaces.bind( this );
		this.state = {
			activeFormats: [],
			selectedFormat: null,
			height: 0,
		};
		this.needsSelectionUpdate = false;
		this.savedContent = '';
		this.isTouched = false;

		// Internal values that are update synchronously, unlike props.
		this.value = value;
		this.selectionStart = selectionStart;
		this.selectionEnd = selectionEnd;
	}

	/**
	 * Get the current record (value and selection) from props and state.
	 *
	 * @return {Object} The current record (value and selection).
	 */
	getRecord() {
		const { selectionStart: start, selectionEnd: end } = this.props;
		let { value } = this.props;

		// Since we get the text selection from Aztec we need to be in sync with the HTML `value`
		// Removing leading white spaces using `trim()` should make sure this is the case.
		if ( typeof value === 'string' || value instanceof String ) {
			value = value.trimLeft();
		}

		const { formats, replacements, text } = this.formatToValue( value );
		const { activeFormats } = this.state;

		return { formats, replacements, text, start, end, activeFormats };
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
	createRecord() {
		return {
			start: this.selectionStart,
			end: this.selectionEnd,
			...create( {
				html: this.value,
				range: null,
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
			} ),
		};
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
		if ( ! this.onSplit ) {
			return;
		}

		// TODO : Fix the index position in AztecNative for Android
		let [ before, after ] = split( currentRecord );

		// In case split occurs at the trailing or leading edge of the field,
		// assume that the before/after values respectively reflect the current
		// value. This also provides an opportunity for the parent component to
		// determine whether the before/after value has changed using a trivial
		//  strict equality operation.
		if ( isEmpty( after ) && before.text.length === currentRecord.text.length ) {
			before = currentRecord;
		} else if ( isEmpty( before ) && after.text.length === currentRecord.text.length ) {
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

		this.onSplit( before, after, ...blocks );
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

	onFormatChangeForceChild( record ) {
		this.onFormatChange( record, true );
	}

	onFormatChange( record, doUpdateChild ) {
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
			activeFormats: record.activeFormats,
		} );
		if ( newContent && newContent !== this.props.value ) {
			this.props.onChange( newContent );
			if ( record.needsSelectionUpdate && record.start && record.end && doUpdateChild ) {
				this.forceSelectionUpdate( record.start, record.end );
			}
		} else {
			if ( doUpdateChild ) {
				this.lastEventCount = undefined;
			} else {
				// make sure the component rerenders without refreshing the text on gutenberg
				// (this can trigger other events that might update the active formats on aztec)
				this.lastEventCount = 0;
			}
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
		this.firedAfterTextChanged = true; // the onChange event always fires after the fact
		this.onTextUpdate( event );
	}

	onTextUpdate( event, refresh = false ) {
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec( unescapeSpaces( event.nativeEvent.text ) );

		this.value = contentWithoutRootTag;
		this.comesFromAztec = true;

		// we don't want to refresh if our goal is just to create a record
		if ( refresh ) {
			this.props.onChange( contentWithoutRootTag );
		}
	}

	/*
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */
	onContentSizeChange( contentSize ) {
		const contentHeight = contentSize.height;
		this.setState( { height: contentHeight } );
	}

	// eslint-disable-next-line no-unused-vars
	onEnter( event ) {
		this.lastEventCount = event.nativeEvent.eventCount;
		this.comesFromAztec = true;
		this.firedAfterTextChanged = event.nativeEvent.firedAfterTextChanged;

		const currentRecord = this.createRecord();

		if ( this.multilineTag ) {
			if ( event.shiftKey ) {
				const insertedLineBreak = { needsSelectionUpdate: true, ...insert( currentRecord, '\n' ) };
				this.onFormatChangeForceChild( insertedLineBreak );
			} else if ( this.onSplit && isEmptyLine( currentRecord ) ) {
				this.needsSelectionUpdate = false;
				this.splitContent( currentRecord );
			} else {
				const insertedLineSeparator = { needsSelectionUpdate: true, ...insertLineSeparator( currentRecord ) };
				this.onFormatChange( insertedLineSeparator, ! this.firedAfterTextChanged );
			}
		} else if ( event.shiftKey || ! this.onSplit ) {
			const insertedLineBreak = { needsSelectionUpdate: true, ...insert( currentRecord, '\n' ) };
			this.onFormatChangeForceChild( insertedLineBreak );
		} else {
			this.splitContent( currentRecord );
		}
	}

	// eslint-disable-next-line no-unused-vars
	onBackspace( event ) {
		const { onMerge, onRemove } = this.props;
		if ( ! onMerge && ! onRemove ) {
			return;
		}

		const keyCode = BACKSPACE; // TODO : should we differentiate BACKSPACE and DELETE?
		const isReverse = keyCode === BACKSPACE;

		// Only process delete if the key press occurs at uncollapsed edge.
		if ( ! isCollapsed( this.createRecord() ) ) {
			return;
		}

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

		event.preventDefault();
	}

	/**
	 * Handles a paste event from the native Aztec Wrapper.
	 *
	 * @param {PasteEvent} event The paste event which wraps `nativeEvent`.
	 */
	onPaste( event ) {
		const isPasted = true;
		const { onSplit } = this.props;

		const { pastedText, pastedHtml, files } = event.nativeEvent;
		const currentRecord = this.createRecord();

		event.preventDefault();

		// Only process file if no HTML is present.
		// Note: a pasted file may have the URL as plain text.
		if ( files && files.length > 0 ) {
			const uploadId = Number.MAX_SAFE_INTEGER;
			let html = '';
			files.forEach( ( file ) => {
				html += `<img src="${ file }" class="wp-image-${ uploadId }">`;
			} );
			const content = pasteHandler( {
				HTML: html,
				mode: 'BLOCKS',
				tagName: this.props.tagName,
			} );
			const shouldReplace = this.props.onReplace && this.isEmpty();

			if ( shouldReplace ) {
				this.props.onReplace( content );
			} else {
				this.splitContent( currentRecord, content, isPasted );
			}

			return;
		}

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
				this.value = this.valueToFormat( linkedRecord );
				this.props.onChange( this.value );

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
			this.value = newContent;

			// explicitly set selection after inline paste
			this.forceSelectionUpdate( insertedContent.start, insertedContent.end );

			this.props.onChange( this.value );
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

	onFocus( event ) {
		this.isTouched = true;

		if ( this.props.onFocus ) {
			this.props.onFocus( event );
		}
	}

	onBlur( event ) {
		this.isTouched = false;

		if ( this.props.onBlur ) {
			this.props.onBlur( event );
		}
	}

	onSelectionChange( start, end ) {
		// onSelectionChange should not be emitted when we're simply typing, but Aztec does emit it
		// Let's try to detect typing with a simple hack:
		const noChange = this.selectionStart === start && this.selectionEnd === end;
		const isTyping = this.selectionStart + 1 === start && this.value !== this.props.value;
		const shouldKeepFormats = noChange || isTyping;

		this.selectionStart = start;
		this.selectionEnd = end;

		if ( ! shouldKeepFormats ) {
			const value = this.createRecord();
			const activeFormats = getActiveFormats( value );
			this.setState( { activeFormats } );
		}

		this.props.onSelectionChange( start, end );
	}

	onSelectionChangeFromAztec( start, end, text, event ) {
		if ( ! this.props.isSelected ) {
			return;
		}

		// AztecEditor-Android may emit a selection change event with 0,0
		// when simply updating the active formats
		// let's ignore this event in that case
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec( unescapeSpaces( event.nativeEvent.text ) );
		if ( this.lastEventCount === undefined && contentWithoutRootTag === this.value && start === 0 && end === 0 ) {
			return;
		}

		// update text before updating selection
		// Make sure there are changes made to the content before upgrading it upward
		this.onTextUpdate( event, true );

		// `end` can be less than `start` on iOS
		// Let's fix that here so `rich-text/slice` can work properly
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );

		this.onSelectionChange( realStart, realEnd );

		// Update lastEventCount to prevent Aztec from re-rendering the content it just sent
		this.lastEventCount = event.nativeEvent.eventCount;
	}

	isEmpty() {
		return isEmpty( this.formatToValue( this.props.value ) );
	}

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

	componentWillReceiveProps( nextProps ) {
		if ( nextProps.value !== this.value ) {
			this.value = this.props.value;
			this.lastEventCount = undefined;
		}

		this.moveCaretToTheEndIfNeeded( nextProps );
	}

	moveCaretToTheEndIfNeeded( nextProps ) {
		const nextRecord = this.formatToValue( nextProps.value );
		const nextTextContent = getTextContent( nextRecord );

		if ( this.isTouched || ! nextProps.isSelected ) {
			this.savedContent = nextTextContent;
			return;
		}

		if ( nextTextContent === '' && this.savedContent === '' ) {
			return;
		}

		// This logic will handle the selection when two blocks are merged or when block is split
		// into two blocks
		if ( nextTextContent.startsWith( this.savedContent ) && this.savedContent && this.savedContent.length > 0 ) {
			let length = this.savedContent.length;
			if ( length === 0 && nextTextContent !== this.props.value ) {
				length = this.props.value.length;
			}

			this.forceSelectionUpdate( length, length );
			this.savedContent = nextTextContent;
		}
	}

	forceSelectionUpdate( start, end ) {
		if ( ! this.needsSelectionUpdate ) {
			this.needsSelectionUpdate = true;
			this.selectionStart = start;
			this.selectionEnd = end;
			this.forceUpdate();
		}
	}

	shouldComponentUpdate( nextProps ) {
		if ( nextProps.tagName !== this.props.tagName ) {
			this.lastEventCount = undefined;
			this.value = undefined;
			return true;
		}

		// TODO: Please re-introduce the check to avoid updating the content right after an `onChange` call.
		// It was removed in https://github.com/WordPress/gutenberg/pull/12417 to fix undo/redo problem.

		// If the component is changed React side (undo/redo/merging/splitting/custom text actions)
		// we need to make sure the native is updated as well.

		const previousValueToCheck = Platform.OS === 'android' ? this.props.value : this.value;

		// Also, don't trust the "this.lastContent" as on Android, incomplete text events arrive
		//  with only some of the text, while the virtual keyboard's suggestion system does its magic.
		// ** compare with this.lastContent for optimizing performance by not forcing Aztec with text it already has
		// , but compare with props.value to not lose "half word" text because of Android virtual keyb autosuggestion behavior
		if ( ( typeof nextProps.value !== 'undefined' ) &&
				( typeof this.props.value !== 'undefined' ) &&
				( Platform.OS === 'ios' || ( Platform.OS === 'android' && ( ! this.comesFromAztec || ! this.firedAfterTextChanged ) ) ) &&
				nextProps.value !== previousValueToCheck ) {
			this.lastEventCount = undefined; // force a refresh on the native side
		}

		if ( Platform.OS === 'android' && this.comesFromAztec === false ) {
			if ( this.needsSelectionUpdate ) {
				this.lastEventCount = undefined; // force a refresh on the native side
			}
		}

		return true;
	}

	componentDidMount() {
		if ( this.props.isSelected ) {
			this._editor.focus();
			this.onSelectionChange( this.props.selectionStart || 0, this.props.selectionEnd || 0 );
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
			// Update selection props explicitly when component is selected as Aztec won't call onSelectionChange
			// if its internal value hasn't change. When created, default value is 0, 0
			this.onSelectionChange( this.props.selectionStart || 0, this.props.selectionEnd || 0 );
		} else if ( ! this.props.isSelected && prevProps.isSelected && this.isIOS ) {
			this._editor.blur();
		}
	}

	willTrimSpaces( html ) {
		// regex for detecting spaces around html tags
		const trailingSpaces = /(\s+)<.+?>|<.+?>(\s+)/g;
		const matches = html.match( trailingSpaces );
		if ( matches && matches.length > 0 ) {
			return true;
		}

		return false;
	}

	render() {
		const {
			tagName,
			style,
			formattingControls,
			isSelected,
			onTagNameChange,
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

		let minHeight = styles[ 'block-editor-rich-text' ].minHeight;
		if ( style && style.minHeight ) {
			minHeight = style.minHeight;
		}

		let selection = null;
		if ( this.needsSelectionUpdate ) {
			this.needsSelectionUpdate = false;

			// Aztec performs some html text cleanup while parsing it so, its internal representation gets out-of-sync with the
			// representation of the format-lib on the RN side. We need to avoid trying to set the caret position because it may
			// be outside the text bounds and crash Aztec, at least on Android.
			if ( ! this.isIOS && this.willTrimSpaces( html ) ) {
				// the html will get trimmed by the cleaning up functions in Aztec and caret position will get out-of-sync.
				// So, skip forcing it, let Aztec just do its best and just log the fact.
				console.warn( 'RichText value will be trimmed for spaces! Avoiding setting the caret position manually.' );
			} else {
				selection = { start: this.selectionStart, end: this.selectionEnd };
			}
		}

		if ( this.comesFromAztec ) {
			this.comesFromAztec = false;
			this.firedAfterTextChanged = false;
		}

		return (
			<View>
				{ isSelected && this.multilineTag === 'li' && (
					<ListEdit
						onTagNameChange={ onTagNameChange }
						tagName={ tagName }
						value={ record }
						onChange={ this.onFormatChangeForceChild }
					/>
				) }
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
					style={ {
						...style,
						minHeight: Math.max( minHeight, this.state.height ),
					} }
					text={ { text: html, eventCount: this.lastEventCount, selection } }
					placeholder={ this.props.placeholder }
					placeholderTextColor={ this.props.placeholderTextColor || styles[ 'block-editor-rich-text' ].textDecorationColor }
					deleteEnter={ this.props.deleteEnter }
					onChange={ this.onChange }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
					onEnter={ this.onEnter }
					onBackspace={ this.onBackspace }
					onPaste={ this.onPaste }
					activeFormats={ this.getActiveFormatNames( record ) }
					onContentSizeChange={ this.onContentSizeChange }
					onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
					onSelectionChange={ this.onSelectionChangeFromAztec }
					isSelected={ isSelected }
					blockType={ { tag: tagName } }
					color={ 'black' }
					maxImagesWidth={ 200 }
					fontFamily={ this.props.fontFamily || styles[ 'block-editor-rich-text' ].fontFamily }
					fontSize={ this.props.fontSize }
					fontWeight={ this.props.fontWeight }
					fontStyle={ this.props.fontStyle }
					disableEditingMenu={ this.props.disableEditingMenu }
					isMultiline={ this.isMultiline }
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
	withBlockEditContext( ( { clientId } ) => ( { clientId } ) ),
	withSelect( ( select, {
		clientId,
		instanceId,
		identifier = instanceId,
		isSelected,
	} ) => {
		const { getFormatTypes } = select( 'core/rich-text' );
		const {
			getSelectionStart,
			getSelectionEnd,
		} = select( 'core/block-editor' );

		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		if ( isSelected === undefined ) {
			isSelected = (
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier
			);
		}

		return {
			formatTypes: getFormatTypes(),
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
		};
	} ),
	withDispatch( ( dispatch, {
		clientId,
		instanceId,
		identifier = instanceId,
	} ) => {
		const {
			selectionChange,
		} = dispatch( 'core/block-editor' );

		return {
			onSelectionChange( start, end ) {
				selectionChange( clientId, identifier, start, end );
			},
		};
	} ),
] )( RichText );

RichTextContainer.Content = ( { value, format, tagName: Tag, multiline, ...props } ) => {
	let content;
	let html = value;
	let MultilineTag;

	if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
		MultilineTag = multiline === true ? 'p' : multiline;
	}

	if ( ! html && MultilineTag ) {
		html = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	switch ( format ) {
		case 'string':
			content = <RawHTML>{ html }</RawHTML>;
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
export { __unstableRichTextInputEvent } from './input-event';
