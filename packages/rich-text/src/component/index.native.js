/*eslint no-console: ["error", { allow: ["warn"] }] */

/**
 * External dependencies
 */
import RCTAztecView from 'react-native-aztec';
import { View, Platform } from 'react-native';
import { pickBy } from 'lodash';
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { childrenBlock } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { BACKSPACE } from '@wordpress/keycodes';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import { applyFormat } from '../apply-format';
import { getActiveFormat } from '../get-active-format';
import { getActiveFormats } from '../get-active-formats';
import { isEmpty, isEmptyLine } from '../is-empty';
import { create } from '../create';
import { toHTMLString } from '../to-html-string';
import { removeLineSeparator } from '../remove-line-separator';
import { isCollapsed } from '../is-collapsed';
import { remove } from '../remove';
import styles from './style.scss';

const unescapeSpaces = ( text ) => {
	return text.replace( /&nbsp;|&#160;/gi, ' ' );
};

const gutenbergFormatNamesToAztec = {
	'core/bold': 'bold',
	'core/italic': 'italic',
	'core/strikethrough': 'strikethrough',
};

export class RichText extends Component {
	constructor( {
		value,
		selectionStart,
		selectionEnd,
		__unstableMultilineTag: multiline,
	} ) {
		super( ...arguments );

		this.isMultiline = false;
		if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
			this.multilineTag = multiline === true ? 'p' : multiline;
			this.isMultiline = true;
		}

		if ( this.multilineTag === 'li' ) {
			this.multilineWrapperTags = [ 'ul', 'ol' ];
		}

		this.isIOS = Platform.OS === 'ios';
		this.createRecord = this.createRecord.bind( this );
		this.onChange = this.onChange.bind( this );
		this.handleEnter = this.handleEnter.bind( this );
		this.handleDelete = this.handleDelete.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onFocus = this.onFocus.bind( this );
		this.onBlur = this.onBlur.bind( this );
		this.onTextUpdate = this.onTextUpdate.bind( this );
		this.onContentSizeChange = this.onContentSizeChange.bind( this );
		this.onFormatChange = this.onFormatChange.bind( this );
		this.formatToValue = memize( this.formatToValue.bind( this ), {
			maxSize: 1,
		} );

		// This prevents a bug in Aztec which triggers onSelectionChange twice on format change
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionChangeFromAztec = this.onSelectionChangeFromAztec.bind(
			this
		);
		this.valueToFormat = this.valueToFormat.bind( this );
		this.willTrimSpaces = this.willTrimSpaces.bind( this );
		this.getHtmlToRender = this.getHtmlToRender.bind( this );
		this.state = {
			activeFormats: [],
			selectedFormat: null,
			height: 0,
		};
		this.needsSelectionUpdate = false;
		this.savedContent = '';
		this.isTouched = false;
		this.lastAztecEventType = null;

		this.lastHistoryValue = value;

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
	 * Creates a RichText value "record" from the current content and selection
	 * information
	 *
	 *
	 * @return {Object} A RichText value with formats and selection.
	 */
	createRecord() {
		const { preserveWhiteSpace } = this.props;
		const value = {
			start: this.selectionStart,
			end: this.selectionEnd,
			...create( {
				html: this.value,
				range: null,
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
				preserveWhiteSpace,
			} ),
		};
		const start = Math.min( this.selectionStart, value.text.length );
		const end = Math.min( this.selectionEnd, value.text.length );
		return { ...value, start, end };
	}

	valueToFormat( value ) {
		// remove the outer root tags
		return this.removeRootTagsProduceByAztec(
			toHTMLString( {
				value,
				multilineTag: this.multilineTag,
			} )
		);
	}

	getActiveFormatNames( record ) {
		const { formatTypes } = this.props;

		return formatTypes
			.map( ( { name } ) => name )
			.filter( ( name ) => {
				return getActiveFormat( record, name ) !== undefined;
			} )
			.map( ( name ) => gutenbergFormatNamesToAztec[ name ] )
			.filter( Boolean );
	}

	onFormatChange( record ) {
		this.getRecord( record );
		const { start, end, activeFormats = [] } = record;
		const changeHandlers = pickBy( this.props, ( v, key ) =>
			key.startsWith( 'format_on_change_functions_' )
		);

		Object.values( changeHandlers ).forEach( ( changeHandler ) => {
			changeHandler( record.formats, record.text );
		} );

		this.value = this.valueToFormat( record );
		this.props.onChange( this.value );
		this.setState( { activeFormats } );
		this.props.onSelectionChange( start, end );
		this.selectionStart = start;
		this.selectionEnd = end;

		this.onCreateUndoLevel();

		this.lastAztecEventType = 'format change';
	}

	onCreateUndoLevel() {
		const { __unstableOnCreateUndoLevel: onCreateUndoLevel } = this.props;
		// If the content is the same, no level needs to be created.
		if ( this.lastHistoryValue === this.value ) {
			return;
		}

		onCreateUndoLevel();
		this.lastHistoryValue = this.value;
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

		if ( this.props.tagsToEliminate ) {
			this.props.tagsToEliminate.forEach( ( element ) => {
				result = this.removeTag( element, result );
			} );
		}
		return result;
	}

	removeRootTag( tag, html ) {
		const openingTagRegexp = RegExp( '^<' + tag + '[^>]*>', 'gim' );
		const closingTagRegexp = RegExp( '</' + tag + '>$', 'gim' );
		return html
			.replace( openingTagRegexp, '' )
			.replace( closingTagRegexp, '' );
	}
	removeTag( tag, html ) {
		const openingTagRegexp = RegExp( '<' + tag + '>', 'gim' );
		const closingTagRegexp = RegExp( '</' + tag + '>', 'gim' );
		return html
			.replace( openingTagRegexp, '' )
			.replace( closingTagRegexp, '' );
	}

	/*
	 * Handles any case where the content of the AztecRN instance has changed
	 */
	onChange( event ) {
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec(
			unescapeSpaces( event.nativeEvent.text )
		);
		// On iOS, onChange can be triggered after selection changes, even though there are no content changes.
		if ( contentWithoutRootTag === this.value ) {
			return;
		}
		this.lastEventCount = event.nativeEvent.eventCount;
		this.comesFromAztec = true;
		this.firedAfterTextChanged = true; // the onChange event always fires after the fact
		this.onTextUpdate( event );
		this.lastAztecEventType = 'input';
	}

	onTextUpdate( event ) {
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec(
			unescapeSpaces( event.nativeEvent.text )
		);

		const refresh = this.value !== contentWithoutRootTag;
		this.value = contentWithoutRootTag;

		// we don't want to refresh if our goal is just to create a record
		if ( refresh ) {
			this.props.onChange( contentWithoutRootTag );
		}
	}

	/*
	 * Handles any case where the content of the AztecRN instance has changed in size
	 */
	onContentSizeChange( contentSize ) {
		this.setState( contentSize );
		this.lastAztecEventType = 'content size change';
	}

	handleEnter( event ) {
		const { onEnter } = this.props;

		if ( ! onEnter ) {
			return;
		}

		onEnter( {
			value: this.createRecord(),
			onChange: this.onFormatChange,
			shiftKey: event.shiftKey,
		} );
		this.lastAztecEventType = 'input';
	}

	handleDelete( event ) {
		const keyCode = BACKSPACE; // TODO : should we differentiate BACKSPACE and DELETE?
		const isReverse = keyCode === BACKSPACE;

		const { onDelete, __unstableMultilineTag: multilineTag } = this.props;
		const { activeFormats = [] } = this.state;
		this.lastEventCount = event.nativeEvent.eventCount;
		this.comesFromAztec = true;
		this.firedAfterTextChanged = event.nativeEvent.firedAfterTextChanged;
		const value = this.createRecord();
		const { start, end, text } = value;
		let newValue;

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end >= text.length ) {
			newValue = remove( value );
			this.onFormatChange( newValue );
			event.preventDefault();
			return;
		}

		if ( multilineTag ) {
			if (
				isReverse &&
				value.start === 0 &&
				value.end === 0 &&
				isEmptyLine( value )
			) {
				newValue = removeLineSeparator( value, ! isReverse );
			} else {
				newValue = removeLineSeparator( value, isReverse );
			}
			if ( newValue ) {
				this.onFormatChange( newValue );
				event.preventDefault();
				return;
			}
		}

		// Only process delete if the key press occurs at an uncollapsed edge.
		if (
			! onDelete ||
			! isCollapsed( value ) ||
			activeFormats.length ||
			( isReverse && start !== 0 ) ||
			( ! isReverse && end !== text.length )
		) {
			return;
		}

		onDelete( { isReverse, value } );

		event.preventDefault();
		this.lastAztecEventType = 'input';
	}

	/**
	 * Handles a paste event from the native Aztec Wrapper.
	 *
	 * @param {Object} event The paste event which wraps `nativeEvent`.
	 */
	onPaste( event ) {
		const { onPaste, onChange } = this.props;
		const { activeFormats = [] } = this.state;

		const { pastedText, pastedHtml, files } = event.nativeEvent;
		const currentRecord = this.createRecord();

		event.preventDefault();

		// There is a selection, check if a URL is pasted.
		if ( ! isCollapsed( currentRecord ) ) {
			const trimmedText = ( pastedHtml || pastedText )
				.replace( /<[^>]+>/g, '' )
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
				onChange( this.value );

				// Allows us to ask for this information when we get a report.
				window.console.log( 'Created link:\n\n', trimmedText );

				return;
			}
		}

		if ( onPaste ) {
			onPaste( {
				value: currentRecord,
				onChange: this.onFormatChange,
				html: pastedHtml,
				plainText: pastedText,
				files,
				activeFormats,
			} );
		}
	}

	onFocus() {
		this.isTouched = true;

		const { unstableOnFocus, onSelectionChange } = this.props;

		if ( unstableOnFocus ) {
			unstableOnFocus();
		}

		// We know for certain that on focus, the old selection is invalid. It
		// will be recalculated on `selectionchange`.
		const index = undefined;

		onSelectionChange( index, index );

		this.lastAztecEventType = 'focus';
	}

	onBlur( event ) {
		this.isTouched = false;

		// Check if value is up to date with latest state of native AztecView
		if (
			event.nativeEvent.text &&
			event.nativeEvent.text !== this.props.value
		) {
			this.onTextUpdate( event );
		}

		if ( this.props.onBlur ) {
			this.props.onBlur( event );
		}

		this.lastAztecEventType = 'blur';
	}

	onSelectionChange( start, end ) {
		const hasChanged =
			this.selectionStart !== start || this.selectionEnd !== end;

		this.selectionStart = start;
		this.selectionEnd = end;

		// This is a manual selection change event if onChange was not triggered just before
		// and we did not just trigger a text update
		// `onChange` could be the last event and could have been triggered a long time ago so
		// this approach is not perfectly reliable
		const isManual =
			this.lastAztecEventType !== 'input' &&
			this.props.value === this.value;
		if ( hasChanged && isManual ) {
			const value = this.createRecord();
			const activeFormats = getActiveFormats( value );
			this.setState( { activeFormats } );
		}

		this.props.onSelectionChange( start, end );
	}

	onSelectionChangeFromAztec( start, end, text, event ) {
		// `end` can be less than `start` on iOS
		// Let's fix that here so `rich-text/slice` can work properly
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );

		// check and dicsard stray event, where the text and selection is equal to the ones already cached
		const contentWithoutRootTag = this.removeRootTagsProduceByAztec(
			unescapeSpaces( event.nativeEvent.text )
		);
		if (
			contentWithoutRootTag === this.value &&
			realStart === this.selectionStart &&
			realEnd === this.selectionEnd
		) {
			return;
		}

		this.comesFromAztec = true;
		this.firedAfterTextChanged = true; // Selection change event always fires after the fact

		// update text before updating selection
		// Make sure there are changes made to the content before upgrading it upward
		this.onTextUpdate( event );

		// Aztec can send us selection change events after it has lost focus.
		// For instance the autocorrect feature will complete a partially written
		// word when resigning focus, causing a selection change event.
		// Forwarding this selection change could cause this RichText to regain
		// focus and start a focus loop.
		//
		// See https://github.com/wordpress-mobile/gutenberg-mobile/issues/1696
		if ( this.props.__unstableIsSelected ) {
			this.onSelectionChange( realStart, realEnd );
		}
		// Update lastEventCount to prevent Aztec from re-rendering the content it just sent
		this.lastEventCount = event.nativeEvent.eventCount;

		this.lastAztecEventType = 'selection change';
	}

	isEmpty() {
		return isEmpty( this.formatToValue( this.props.value ) );
	}

	formatToValue( value ) {
		const { preserveWhiteSpace } = this.props;
		// Handle deprecated `children` and `node` sources.
		if ( Array.isArray( value ) ) {
			return create( {
				html: childrenBlock.toHTML( value ),
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
				preserveWhiteSpace,
			} );
		}

		if ( this.props.format === 'string' ) {
			return create( {
				html: value,
				multilineTag: this.multilineTag,
				multilineWrapperTags: this.multilineWrapperTags,
				preserveWhiteSpace,
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
		if (
			nextProps.tagName !== this.props.tagName ||
			nextProps.reversed !== this.props.reversed ||
			nextProps.start !== this.props.start
		) {
			this.lastEventCount = undefined;
			this.value = undefined;
			return true;
		}

		// TODO: Please re-introduce the check to avoid updating the content right after an `onChange` call.
		// It was removed in https://github.com/WordPress/gutenberg/pull/12417 to fix undo/redo problem.

		// If the component is changed React side (undo/redo/merging/splitting/custom text actions)
		// we need to make sure the native is updated as well.

		// Also, don't trust the "this.lastContent" as on Android, incomplete text events arrive
		//  with only some of the text, while the virtual keyboard's suggestion system does its magic.
		// ** compare with this.lastContent for optimizing performance by not forcing Aztec with text it already has
		// , but compare with props.value to not lose "half word" text because of Android virtual keyb autosuggestion behavior
		if (
			typeof nextProps.value !== 'undefined' &&
			typeof this.props.value !== 'undefined' &&
			( ! this.comesFromAztec || ! this.firedAfterTextChanged ) &&
			nextProps.value !== this.props.value
		) {
			// Gutenberg seems to try to mirror the caret state even on events that only change the content so,
			//  let's force caret update if state has selection set.
			if (
				typeof nextProps.selectionStart !== 'undefined' &&
				typeof nextProps.selectionEnd !== 'undefined'
			) {
				this.needsSelectionUpdate = true;
			}

			this.lastEventCount = undefined; // force a refresh on the native side
		}

		if ( ! this.comesFromAztec ) {
			if (
				typeof nextProps.selectionStart !== 'undefined' &&
				typeof nextProps.selectionEnd !== 'undefined' &&
				nextProps.selectionStart !== this.props.selectionStart &&
				nextProps.selectionStart !== this.selectionStart &&
				nextProps.__unstableIsSelected
			) {
				this.needsSelectionUpdate = true;
				this.lastEventCount = undefined; // force a refresh on the native side
			}
		}

		return true;
	}

	componentDidMount() {
		// Request focus if wrapping block is selected and parent hasn't inhibited the focus request. This method of focusing
		//  is trying to implement the web-side counterpart of BlockList's `focusTabbable` where the BlockList is focusing an
		//  inputbox by searching the DOM. We don't have the DOM in RN so, using the combination of blockIsSelected and __unstableMobileNoFocusOnMount
		//  to determine if we should focus the RichText.
		if (
			this.props.blockIsSelected &&
			! this.props.__unstableMobileNoFocusOnMount
		) {
			this._editor.focus();
			this.onSelectionChange(
				this.props.selectionStart || 0,
				this.props.selectionEnd || 0
			);
		}
	}

	componentWillUnmount() {
		if ( this._editor.isFocused() && this.props.shouldBlurOnUnmount ) {
			this._editor.blur();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.value !== this.value ) {
			this.value = this.props.value;
			this.lastEventCount = undefined;
		}
		const { __unstableIsSelected: isSelected } = this.props;

		const { __unstableIsSelected: prevIsSelected } = prevProps;

		if ( isSelected && ! prevIsSelected ) {
			this._editor.focus();
			// Update selection props explicitly when component is selected as Aztec won't call onSelectionChange
			// if its internal value hasn't change. When created, default value is 0, 0
			this.onSelectionChange(
				this.props.selectionStart || 0,
				this.props.selectionEnd || 0
			);
		} else if ( ! isSelected && prevIsSelected ) {
			this._editor.blur();
		}
	}

	willTrimSpaces( html ) {
		const { tagName } = this.props;

		// aztec won't trim spaces in a case of <pre> block, so we are excluding it
		if ( tagName === 'pre' ) {
			return false;
		}

		// regex for detecting spaces around block element html tags
		const blockHtmlElements =
			'(div|br|blockquote|ul|ol|li|p|pre|h1|h2|h3|h4|h5|h6|iframe|hr)';
		const leadingOrTrailingSpaces = new RegExp(
			`(\\s+)<\/?${ blockHtmlElements }>|<\/?${ blockHtmlElements }>(\\s+)`,
			'g'
		);
		const matches = html.match( leadingOrTrailingSpaces );
		if ( matches && matches.length > 0 ) {
			return true;
		}

		return false;
	}

	getHtmlToRender( record, tagName ) {
		// Save back to HTML from React tree
		let value = this.valueToFormat( record );

		if ( value === undefined ) {
			this.lastEventCount = undefined; // force a refresh on the native side
			value = '';
		}
		// On android if content is empty we need to send no content or else the placeholder will not show.
		if ( ! this.isIOS && value === '' ) {
			return value;
		}

		if ( tagName ) {
			let extraAttributes = ``;
			if ( tagName === `ol` ) {
				if ( this.props.reversed ) {
					extraAttributes += ` reversed`;
				}
				if ( this.props.start ) {
					extraAttributes += ` start=${ this.props.start }`;
				}
			}
			value = `<${ tagName } ${ extraAttributes }>${ value }</${ tagName }>`;
		}
		return value;
	}

	render() {
		const {
			tagName,
			style,
			__unstableIsSelected: isSelected,
			children,
			getStylesFromColorScheme,
			minWidth,
			maxWidth,
			formatTypes,
			withoutInteractiveFormatting,
		} = this.props;

		const record = this.getRecord();
		const html = this.getHtmlToRender( record, tagName );

		const placeholderStyle = getStylesFromColorScheme(
			styles.richTextPlaceholder,
			styles.richTextPlaceholderDark
		);

		const { color: defaultPlaceholderTextColor } = placeholderStyle;

		const {
			color: defaultColor,
			textDecorationColor: defaultTextDecorationColor,
			fontFamily: defaultFontFamily,
		} = getStylesFromColorScheme( styles.richText, styles.richTextDark );

		let selection = null;
		if ( this.needsSelectionUpdate ) {
			this.needsSelectionUpdate = false;
			selection = {
				start: this.props.selectionStart,
				end: this.props.selectionEnd,
			};

			// On AztecAndroid, setting the caret to an out-of-bounds position will crash the editor so, let's check for some cases.
			if ( ! this.isIOS ) {
				// Aztec performs some html text cleanup while parsing it so, its internal representation gets out-of-sync with the
				// representation of the format-lib on the RN side. We need to avoid trying to set the caret position because it may
				// be outside the text bounds and crash Aztec, at least on Android.
				if ( this.willTrimSpaces( html ) ) {
					// the html will get trimmed by the cleaning up functions in Aztec and caret position will get out-of-sync.
					// So, skip forcing it, let Aztec just do its best and just log the fact.
					console.warn(
						'RichText value will be trimmed for spaces! Avoiding setting the caret position manually.'
					);
					selection = null;
				} else if (
					this.props.selectionStart > record.text.length ||
					this.props.selectionEnd > record.text.length
				) {
					console.warn(
						'Oops, selection will land outside the text, skipping setting it...'
					);
					selection = null;
				} else {
					// The following regular expression is used in Aztec here:
					// https://github.com/wordpress-mobile/AztecEditor-Android/blob/b1fad439d56fa6d4aa0b78526fef355c59d00dd3/aztec/src/main/kotlin/org/wordpress/aztec/AztecParser.kt#L656
					const brBeforeParaMatches = html.match( /(<br>)+<\/p>$/g );
					if ( brBeforeParaMatches ) {
						console.warn(
							'Oops, BR tag(s) at the end of content. Aztec will remove them, adapting the selection...'
						);
						const count = (
							brBeforeParaMatches[ 0 ].match( /br/g ) || []
						).length;
						if ( count > 0 ) {
							let newSelectionStart =
								this.props.selectionStart - count;
							if ( newSelectionStart < 0 ) {
								newSelectionStart = 0;
							}
							let newSelectionEnd =
								this.props.selectionEnd - count;
							if ( newSelectionEnd < 0 ) {
								newSelectionEnd = 0;
							}
							selection = {
								start: newSelectionStart,
								end: newSelectionEnd,
							};
						}
					}
				}
			}
		}

		if ( this.comesFromAztec ) {
			this.comesFromAztec = false;
			this.firedAfterTextChanged = false;
		}

		// Logic below assures that `RichText` width will always have equal value when container is almost fully filled.
		const width =
			maxWidth && this.state.width && maxWidth - this.state.width < 10
				? maxWidth
				: this.state.width;

		return (
			<View>
				{ children &&
					children( {
						isSelected,
						value: record,
						onChange: this.onFormatChange,
						onFocus: () => {},
					} ) }
				<RCTAztecView
					ref={ ( ref ) => {
						this._editor = ref;

						if ( this.props.setRef ) {
							this.props.setRef( ref );
						}
					} }
					style={ {
						...style,
						...( this.isIOS && minWidth && maxWidth
							? { width }
							: {} ),
						minHeight: this.state.height,
					} }
					text={ {
						text: html,
						eventCount: this.lastEventCount,
						selection,
					} }
					placeholder={ this.props.placeholder }
					placeholderTextColor={
						this.props.placeholderTextColor ||
						defaultPlaceholderTextColor
					}
					deleteEnter={ this.props.deleteEnter }
					onChange={ this.onChange }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
					onEnter={ this.handleEnter }
					onBackspace={ this.handleDelete }
					onPaste={ this.onPaste }
					activeFormats={ this.getActiveFormatNames( record ) }
					onContentSizeChange={ this.onContentSizeChange }
					onCaretVerticalPositionChange={
						this.props.onCaretVerticalPositionChange
					}
					onSelectionChange={ this.onSelectionChangeFromAztec }
					blockType={ { tag: tagName } }
					color={ ( style && style.color ) || defaultColor }
					linkTextColor={ defaultTextDecorationColor }
					maxImagesWidth={ 200 }
					fontFamily={ this.props.fontFamily || defaultFontFamily }
					fontSize={
						this.props.fontSize || ( style && style.fontSize )
					}
					fontWeight={ this.props.fontWeight }
					fontStyle={ this.props.fontStyle }
					disableEditingMenu={ this.props.disableEditingMenu }
					isMultiline={ this.isMultiline }
					textAlign={ this.props.textAlign }
					{ ...( this.isIOS ? { maxWidth } : {} ) }
					minWidth={ minWidth }
					id={ this.props.id }
					selectionColor={ this.props.selectionColor }
				/>
				{ isSelected && (
					<FormatEdit
						formatTypes={ formatTypes }
						value={ record }
						withoutInteractiveFormatting={
							withoutInteractiveFormatting
						}
						onChange={ this.onFormatChange }
						onFocus={ () => {} }
					/>
				) }
			</View>
		);
	}
}

RichText.defaultProps = {
	format: 'string',
	value: '',
	tagName: 'div',
};

export default compose( [
	withSelect( ( select ) => ( {
		formatTypes: select( 'core/rich-text' ).getFormatTypes(),
	} ) ),
	withPreferredColorScheme,
] )( RichText );
