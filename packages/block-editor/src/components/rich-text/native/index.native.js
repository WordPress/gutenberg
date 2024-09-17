/* eslint no-console: ["error", { allow: ["warn"] }] */

/**
 * External dependencies
 */
import { View, Platform, Dimensions } from 'react-native';
import memize from 'memize';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import RCTAztecView from '@wordpress/react-native-aztec';
import {
	showUserSuggestions,
	showXpostSuggestions,
} from '@wordpress/react-native-bridge';
import { BlockFormatControls } from '@wordpress/block-editor';
import { getPxFromCssUnit } from '@wordpress/components';
import { Component } from '@wordpress/element';
import {
	compose,
	debounce,
	withPreferredColorScheme,
} from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { childrenBlock } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import { isURL } from '@wordpress/url';
import { atSymbol, plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import {
	applyFormat,
	getActiveFormat,
	getActiveFormats,
	insert,
	getTextContent,
	isEmpty,
	create,
	toHTMLString,
	isCollapsed,
	remove,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import { useFormatTypes } from './use-format-types';
import FormatEdit from './format-edit';
import { getFormatColors } from './get-format-colors';
import styles from './style.scss';
import ToolbarButtonWithOptions from './toolbar-button-with-options';

// The flattened color palettes array is memoized to ensure that the same array instance is
// returned for the colors palettes. This value might be used as a prop, so having the same
// instance will prevent unnecessary re-renders of the RichText component.
const flatColorPalettes = memize( ( colorsPalettes ) => [
	...( colorsPalettes?.theme || [] ),
	...( colorsPalettes?.custom || [] ),
	...( colorsPalettes?.default || [] ),
] );

const getSelectionColor = memize(
	(
		currentSelectionColor,
		defaultSelectionColor,
		baseGlobalStyles,
		isBlockBasedTheme
	) => {
		let selectionColor = defaultSelectionColor;
		if ( currentSelectionColor ) {
			selectionColor = currentSelectionColor;
		}

		if ( isBlockBasedTheme ) {
			const colordTextColor = colord( selectionColor );
			const colordBackgroundColor = colord(
				baseGlobalStyles?.color?.background
			);
			const isColordTextReadable = colordTextColor.isReadable(
				colordBackgroundColor
			);
			if ( ! isColordTextReadable ) {
				selectionColor = baseGlobalStyles?.color?.text;
			}
		}

		return selectionColor;
	}
);

const gutenbergFormatNamesToAztec = {
	'core/bold': 'bold',
	'core/italic': 'italic',
	'core/strikethrough': 'strikethrough',
	'core/text-color': 'mark',
};

const EMPTY_PARAGRAPH_TAGS = '<p></p>';
const DEFAULT_FONT_SIZE = 16;
const MIN_LINE_HEIGHT = 1;

export class RichText extends Component {
	constructor( { value, selectionStart, selectionEnd } ) {
		super( ...arguments );

		this.isIOS = Platform.OS === 'ios';
		this.createRecord = this.createRecord.bind( this );
		this.onChangeFromAztec = this.onChangeFromAztec.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
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
		this.debounceCreateUndoLevel = debounce( this.onCreateUndoLevel, 1000 );
		// This prevents a bug in Aztec which triggers onSelectionChange twice on format change.
		this.onSelectionChange = this.onSelectionChange.bind( this );
		this.onSelectionChangeFromAztec =
			this.onSelectionChangeFromAztec.bind( this );
		this.valueToFormat = this.valueToFormat.bind( this );
		this.getHtmlToRender = this.getHtmlToRender.bind( this );
		this.handleSuggestionFunc = this.handleSuggestionFunc.bind( this );
		this.handleUserSuggestion = this.handleSuggestionFunc(
			showUserSuggestions,
			'@'
		).bind( this );
		this.handleXpostSuggestion = this.handleSuggestionFunc(
			showXpostSuggestions,
			'+'
		).bind( this );
		this.suggestionOptions = this.suggestionOptions.bind( this );
		this.insertString = this.insertString.bind( this );
		this.manipulateEventCounterToForceNativeToRefresh =
			this.manipulateEventCounterToForceNativeToRefresh.bind( this );
		this.shouldDropEventFromAztec =
			this.shouldDropEventFromAztec.bind( this );
		this.state = {
			activeFormats: [],
			selectedFormat: null,
			height: 0,
			currentFontSize: this.getFontSize( arguments[ 0 ] ),
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
		const {
			selectionStart: start,
			selectionEnd: end,
			colorPalette,
		} = this.props;
		const { value } = this.props;
		const currentValue = this.formatToValue( value );

		const { formats, replacements, text } = currentValue;
		const { activeFormats } = this.state;
		const newFormats = getFormatColors( formats, colorPalette );

		return {
			formats: newFormats,
			replacements,
			text,
			start,
			end,
			activeFormats,
		};
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
				preserveWhiteSpace,
			} ),
		};
		const start = Math.min( this.selectionStart, value.text.length );
		const end = Math.min( this.selectionEnd, value.text.length );
		return { ...value, start, end };
	}

	valueToFormat( value ) {
		// Remove the outer root tags.
		return this.removeRootTagsProducedByAztec( toHTMLString( { value } ) );
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
		const { start = 0, end = 0, activeFormats = [] } = record;
		const changeHandlers = Object.fromEntries(
			Object.entries( this.props ).filter( ( [ key ] ) =>
				key.startsWith( 'format_on_change_functions_' )
			)
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

	insertString( record, string ) {
		if ( record && string ) {
			this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
			const toInsert = insert( record, string );
			this.onFormatChange( toInsert );
		}
	}

	onCreateUndoLevel() {
		const { __unstableOnCreateUndoLevel: onCreateUndoLevel } = this.props;
		// If the content is the same, no level needs to be created.
		if ( this.lastHistoryValue?.toString() === this.value?.toString() ) {
			return;
		}

		onCreateUndoLevel();
		this.lastHistoryValue = this.value;
	}

	/*
	 * Cleans up any root tags produced by aztec.
	 * TODO: This should be removed on a later version when aztec doesn't return the top tag of the text being edited
	 */
	removeRootTagsProducedByAztec( html ) {
		let result = this.removeRootTag( this.props.tagName, html );

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
	onChangeFromAztec( event ) {
		if ( this.shouldDropEventFromAztec( event, 'onChange' ) ) {
			return;
		}

		const contentWithoutRootTag = this.removeRootTagsProducedByAztec(
			event.nativeEvent.text
		);

		const { __unstableInputRule } = this.props;
		const currentValuePosition = {
			end: this.isIOS ? this.selectionEnd : this.selectionEnd + 1,
			start: this.isIOS ? this.selectionStart : this.selectionStart + 1,
		};

		if (
			__unstableInputRule &&
			__unstableInputRule( {
				...currentValuePosition,
				...this.formatToValue( contentWithoutRootTag ),
			} )
		) {
			return;
		}

		// On iOS, onChange can be triggered after selection changes, even though there are no content changes.
		if ( contentWithoutRootTag === this.value?.toString() ) {
			return;
		}
		this.lastEventCount = event.nativeEvent.eventCount;
		this.comesFromAztec = true;
		this.firedAfterTextChanged = true; // The onChange event always fires after the fact.
		this.onTextUpdate( event );
		this.lastAztecEventType = 'input';
	}

	onTextUpdate( event ) {
		const contentWithoutRootTag = this.removeRootTagsProducedByAztec(
			event.nativeEvent.text
		);

		this.debounceCreateUndoLevel();
		const refresh = this.value?.toString() !== contentWithoutRootTag;
		this.value = contentWithoutRootTag;

		// We don't want to refresh if our goal is just to create a record.
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

	onKeyDown( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		// Add stubs for conformance in downstream autocompleters logic.
		this.customEditableOnKeyDown?.( {
			preventDefault: () => undefined,
			...event,
			key: RCTAztecView.KeyCodes[ event?.keyCode ],
		} );

		this.handleDelete( event );
		this.handleEnter( event );
		this.handleTriggerKeyCodes( event );
	}

	handleEnter( event ) {
		if ( event.keyCode !== ENTER ) {
			return;
		}
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
		if ( this.shouldDropEventFromAztec( event, 'handleDelete' ) ) {
			return;
		}

		const { keyCode } = event;

		if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
			return;
		}
		const isReverse = keyCode === BACKSPACE;

		const { onDelete } = this.props;
		this.lastEventCount = event.nativeEvent.eventCount;
		this.comesFromAztec = true;
		this.firedAfterTextChanged = event.nativeEvent.firedAfterTextChanged;
		const value = this.createRecord();
		const { start, end, text, activeFormats } = value;
		const hasActiveFormats = activeFormats && !! activeFormats.length;
		let newValue;

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end >= text.length ) {
			newValue = remove( value );
			this.onFormatChange( newValue );
			event.preventDefault();
			return;
		}

		// Only process delete if the key press occurs at an uncollapsed edge.
		if (
			! isCollapsed( value ) ||
			hasActiveFormats ||
			( isReverse && start !== 0 ) ||
			( ! isReverse && end !== text.length )
		) {
			return;
		}

		if ( onDelete ) {
			onDelete( { isReverse, value } );
		}

		event.preventDefault();
		this.lastAztecEventType = 'input';
	}

	handleTriggerKeyCodes( event ) {
		const { keyCode } = event;
		const triggeredOption = this.suggestionOptions().find( ( option ) => {
			const triggeredKeyCode = option.triggerChar.charCodeAt( 0 );
			return triggeredKeyCode === keyCode;
		} );

		if ( triggeredOption ) {
			const record = this.getRecord();
			const text = getTextContent( record );
			// Only respond to the trigger if the selection is on the start of text or line
			// or if the character before is a space.
			const useTrigger =
				text.length === 0 ||
				record.start === 0 ||
				text.charAt( record.start - 1 ) === '\n' ||
				text.charAt( record.start - 1 ) === ' ';

			if ( useTrigger && triggeredOption.onClick ) {
				triggeredOption.onClick();
			} else {
				this.insertString( record, triggeredOption.triggerChar );
			}
		}
	}

	suggestionOptions() {
		const { areMentionsSupported, areXPostsSupported } = this.props;
		const allOptions = [
			{
				supported: areMentionsSupported,
				title: __( 'Insert mention' ),
				onClick: this.handleUserSuggestion,
				triggerChar: '@',
				value: 'mention',
				label: __( 'Mention' ),
				icon: atSymbol,
			},
			{
				supported: areXPostsSupported,
				title: __( 'Insert crosspost' ),
				onClick: this.handleXpostSuggestion,
				triggerChar: '+',
				value: 'crosspost',
				label: __( 'Crosspost' ),
				icon: plus,
			},
		];
		return allOptions.filter( ( op ) => op.supported );
	}

	handleSuggestionFunc( suggestionFunction, prefix ) {
		return () => {
			const record = this.getRecord();
			suggestionFunction()
				.then( ( suggestion ) => {
					this.insertString( record, `${ prefix }${ suggestion } ` );
				} )
				.catch( () => {} );
		};
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

			// A URL was pasted, turn the selection into a link.
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

		onSelectionChange( this.selectionStart, this.selectionEnd );

		this.lastAztecEventType = 'focus';
	}

	onBlur( event ) {
		this.isTouched = false;

		// Check if value is up to date with latest state of native AztecView.
		if (
			event.nativeEvent.text &&
			event.nativeEvent.text !== this.props.value?.toString()
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
		// this approach is not perfectly reliable.
		const isManual =
			this.lastAztecEventType !== 'input' &&
			this.props.value?.toString() === this.value?.toString();
		if ( hasChanged && isManual ) {
			const value = this.createRecord();
			const activeFormats = getActiveFormats( value );
			this.setState( { activeFormats } );
		}

		this.props.onSelectionChange( start, end );
	}

	shouldDropEventFromAztec( event, logText ) {
		const shouldDrop =
			! this.isIOS && event.nativeEvent.eventCount <= this.lastEventCount;
		if ( shouldDrop ) {
			window.console.log(
				`Dropping ${ logText } from Aztec as its event counter is older than latest sent to the native side. Got ${ event.nativeEvent.eventCount } but lastEventCount is ${ this.lastEventCount }.`
			);
		}
		return shouldDrop;
	}

	/**
	 * Determines whether the text input should receive focus after an update.
	 * For cases where a RichText with a value is merged with an empty one.
	 *
	 * @param {Object} prevProps - The previous props of the component.
	 * @return {boolean} True if the text input should receive focus, false otherwise.
	 */
	shouldFocusTextInputAfterMerge( prevProps ) {
		const {
			__unstableIsSelected: isSelected,
			blockIsSelected,
			selectionStart,
			selectionEnd,
			__unstableMobileNoFocusOnMount,
		} = this.props;

		const {
			__unstableIsSelected: prevIsSelected,
			blockIsSelected: prevBlockIsSelected,
		} = prevProps;

		const noSelectionValues =
			selectionStart === undefined && selectionEnd === undefined;
		const textInputWasNotFocused = ! prevIsSelected && ! isSelected;

		return (
			! __unstableMobileNoFocusOnMount &&
			noSelectionValues &&
			textInputWasNotFocused &&
			! prevBlockIsSelected &&
			blockIsSelected
		);
	}

	onSelectionChangeFromAztec( start, end, text, event ) {
		if ( this.shouldDropEventFromAztec( event, 'onSelectionChange' ) ) {
			return;
		}

		// `end` can be less than `start` on iOS
		// Let's fix that here so `rich-text/slice` can work properly.
		const realStart = Math.min( start, end );
		const realEnd = Math.max( start, end );

		// Check and dicsard stray event, where the text and selection is equal to the ones already cached.
		const contentWithoutRootTag = this.removeRootTagsProducedByAztec(
			event.nativeEvent.text
		);
		if (
			contentWithoutRootTag === this.value?.toString() &&
			realStart === this.selectionStart &&
			realEnd === this.selectionEnd
		) {
			return;
		}

		this.comesFromAztec = true;
		this.firedAfterTextChanged = true; // Selection change event always fires after the fact.

		// Update text before updating selection
		// Make sure there are changes made to the content before upgrading it upward.
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
		// Update lastEventCount to prevent Aztec from re-rendering the content it just sent.
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
				preserveWhiteSpace,
			} );
		}

		if ( this.props.format === 'string' ) {
			return create( {
				html: value,
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

	manipulateEventCounterToForceNativeToRefresh() {
		if ( this.isIOS ) {
			this.lastEventCount = undefined;
			return;
		}

		if ( typeof this.lastEventCount !== 'undefined' ) {
			this.lastEventCount += 100; // bump by a hundred, hopefully native hasn't bombarded the JS side in the meantime.
		} // no need to bump when 'undefined' as native side won't receive the key when the value is undefined, and that will cause force updating anyway,
		//   see https://github.com/WordPress/gutenberg/blob/82e578dcc75e67891c750a41a04c1e31994192fc/packages/react-native-aztec/android/src/main/java/org/wordpress/mobile/ReactNativeAztec/ReactAztecManager.java#L213-L215
	}

	shouldComponentUpdate( nextProps, nextState ) {
		if (
			nextProps.tagName !== this.props.tagName ||
			nextProps.reversed !== this.props.reversed ||
			nextProps.start !== this.props.start
		) {
			this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
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
			nextProps.value?.toString() !== this.props.value?.toString()
		) {
			// Gutenberg seems to try to mirror the caret state even on events that only change the content so,
			//  let's force caret update if state has selection set.
			if (
				typeof nextProps.selectionStart !== 'undefined' &&
				typeof nextProps.selectionEnd !== 'undefined'
			) {
				this.needsSelectionUpdate = true;
			}

			this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
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
				this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
			}

			// For font size changes from a prop value a force refresh
			// is needed without the selection update.
			if ( nextProps?.fontSize !== this.props?.fontSize ) {
				this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
			}

			if (
				( nextProps?.style?.fontSize !== this.props?.style?.fontSize &&
					nextState.currentFontSize !==
						this.state.currentFontSize ) ||
				nextState.currentFontSize !== this.state.currentFontSize ||
				nextProps?.style?.lineHeight !== this.props?.style?.lineHeight
			) {
				this.needsSelectionUpdate = true;
				this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
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

	componentDidUpdate( prevProps ) {
		const { style, tagName } = this.props;
		const { currentFontSize } = this.state;

		if ( this.props.value?.toString() !== this.value?.toString() ) {
			this.value = this.props.value;
		}
		const { __unstableIsSelected: prevIsSelected } = prevProps;
		const { __unstableIsSelected: isSelected } = this.props;

		if ( isSelected && ! prevIsSelected ) {
			this._editor.focus();
			// Update selection props explicitly when component is selected as Aztec won't call onSelectionChange
			// if its internal value hasn't change. When created, default value is 0, 0.
			this.onSelectionChange(
				this.props.selectionStart || 0,
				this.props.selectionEnd || 0
			);
		} else if ( this.shouldFocusTextInputAfterMerge( prevProps ) ) {
			// Since this is happening when merging blocks, the selection should be at the last character position.
			// As a fallback the internal selectionEnd value is used.
			const lastCharacterPosition =
				this.value?.toString().length ?? this.selectionEnd;
			this._editor.focus();
			this.props.onSelectionChange(
				lastCharacterPosition,
				lastCharacterPosition
			);
		} else if ( ! isSelected && prevIsSelected ) {
			this._editor.blur();
		}

		// For font size values changes from the font size picker
		// we compare previous values to refresh the selected font size,
		// this is also used when the tag name changes
		// e.g Heading block and a level change like h1->h2.
		const currentFontSizeStyle = this.getParsedFontSize( style?.fontSize );
		const prevFontSizeStyle = this.getParsedFontSize(
			prevProps?.style?.fontSize
		);
		const isDifferentTag = prevProps.tagName !== tagName;
		if (
			( currentFontSize &&
				( currentFontSizeStyle || prevFontSizeStyle ) &&
				currentFontSizeStyle !== currentFontSize ) ||
			isDifferentTag
		) {
			this.setState( {
				currentFontSize: this.getFontSize( this.props ),
			} );
		}
	}

	componentWillUnmount() {
		const { clearCurrentSelectionOnUnmount } = this.props;

		// There are cases when the component is unmounted e.g. scrolling in a
		// long post due to virtualization, so the block selection needs to be cleared
		// so it doesn't auto-focus when it's added back.
		if ( this._editor?.isFocused() ) {
			clearCurrentSelectionOnUnmount?.();
		}
	}

	getHtmlToRender( record, tagName ) {
		// Save back to HTML from React tree.
		let value = this.valueToFormat( record );

		if ( value === undefined ) {
			this.manipulateEventCounterToForceNativeToRefresh(); // force a refresh on the native side
			value = '';
		}
		// On android if content is empty we need to send no content or else the placeholder will not show.
		if (
			! this.isIOS &&
			( value?.toString() === '' ||
				value?.toString() === EMPTY_PARAGRAPH_TAGS )
		) {
			return '';
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
			value = `<${ tagName }${ extraAttributes }>${ value }</${ tagName }>`;
		}
		return value;
	}

	getEditableProps() {
		return {
			// Overridable props.
			style: {},
			className: 'rich-text',
			onKeyDown: () => null,
		};
	}

	getParsedFontSize( fontSize ) {
		const { height, width } = Dimensions.get( 'window' );
		const cssUnitOptions = { height, width, fontSize: DEFAULT_FONT_SIZE };

		if ( ! fontSize ) {
			return fontSize;
		}

		const selectedPxValue =
			getPxFromCssUnit( fontSize, cssUnitOptions ) ?? DEFAULT_FONT_SIZE;

		return parseFloat( selectedPxValue );
	}

	getFontSize( props ) {
		const { baseGlobalStyles, tagName, fontSize, style } = props;
		const tagNameFontSize =
			baseGlobalStyles?.elements?.[ tagName ]?.typography?.fontSize;

		let newFontSize = DEFAULT_FONT_SIZE;

		// Disables line-height rendering for pre elements until we fix some issues with AztecAndroid.
		if ( tagName === 'pre' && ! this.isIOS ) {
			return undefined;
		}

		// For block-based themes, get the default editor font size.
		if ( baseGlobalStyles?.typography?.fontSize && tagName === 'p' ) {
			newFontSize = baseGlobalStyles?.typography?.fontSize;
		}

		// For block-based themes, get the default element font size
		// e.g h1, h2.
		if ( tagNameFontSize ) {
			newFontSize = tagNameFontSize;
		}

		// For font size values provided from the styles,
		// usually from values set from the font size picker.
		if ( style?.fontSize ) {
			newFontSize = style.fontSize;
		}

		// Fall-back to a font size provided from its props (if there's any)
		// and there are no other default values to use.
		if ( fontSize && ! tagNameFontSize && ! style?.fontSize ) {
			newFontSize = fontSize;
		}

		// We need to always convert to px units because the selected value
		// could be coming from the web where it could be stored as a different unit.
		const selectedPxValue = this.getParsedFontSize( newFontSize );

		return selectedPxValue;
	}

	getLineHeight() {
		const { baseGlobalStyles, tagName, lineHeight, style } = this.props;
		const tagNameLineHeight =
			baseGlobalStyles?.elements?.[ tagName ]?.typography?.lineHeight;
		let newLineHeight;

		// Disables line-height rendering for pre elements until we fix some issues with AztecAndroid.
		if ( tagName === 'pre' && ! this.isIOS ) {
			return undefined;
		}

		if ( ! this.getIsBlockBasedTheme() ) {
			return;
		}

		// For block-based themes, get the default editor line height.
		if ( baseGlobalStyles?.typography?.lineHeight && tagName === 'p' ) {
			newLineHeight = parseFloat(
				baseGlobalStyles?.typography?.lineHeight
			);
		}

		// For block-based themes, get the default element line height
		// e.g h1, h2.
		if ( tagNameLineHeight ) {
			newLineHeight = parseFloat( tagNameLineHeight );
		}

		// For line height values provided from the styles,
		// usually from values set from the line height picker.
		if ( style?.lineHeight ) {
			newLineHeight = parseFloat( style.lineHeight );
		}

		// Fall-back to a line height provided from its props (if there's any)
		// and there are no other default values to use.
		if ( lineHeight && ! tagNameLineHeight && ! style?.lineHeight ) {
			newLineHeight = lineHeight;
		}

		// Check the final value is not over the minimum supported value.
		if ( newLineHeight && newLineHeight < MIN_LINE_HEIGHT ) {
			newLineHeight = MIN_LINE_HEIGHT;
		}

		// Until we parse CSS values correctly, avoid passing NaN values to Aztec
		if ( isNaN( newLineHeight ) ) {
			return undefined;
		}

		return newLineHeight;
	}

	getIsBlockBasedTheme() {
		const { baseGlobalStyles } = this.props;

		return (
			baseGlobalStyles && Object.entries( baseGlobalStyles ).length !== 0
		);
	}

	getBlockUseDefaultFont() {
		// For block-based themes it enables using the defaultFont
		// in Aztec for iOS so it allows customizing the font size
		// for the Preformatted/Code and Heading blocks.
		if ( ! this.isIOS ) {
			return;
		}

		const { tagName } = this.props;
		const isBlockBasedTheme = this.getIsBlockBasedTheme();
		const tagsToMatch = /pre|h([1-6])$/gm;

		return isBlockBasedTheme && tagsToMatch.test( tagName );
	}

	getLinkTextColor( defaultColor ) {
		const { style } = this.props;
		const customColor = style?.linkColor && colord( style.linkColor );

		return customColor && customColor.isValid()
			? customColor.toHex()
			: defaultColor;
	}

	getPlaceholderTextColor() {
		const {
			baseGlobalStyles,
			getStylesFromColorScheme,
			placeholderTextColor,
			style,
		} = this.props;

		// Default placeholder text color.
		const placeholderStyle = getStylesFromColorScheme(
			styles.richTextPlaceholder,
			styles.richTextPlaceholderDark
		);
		const { color: defaultPlaceholderTextColor } = placeholderStyle;
		// Custom 63% opacity for theme and inherited colors.
		const placeholderOpacity = 'A1';

		// Determine inherited placeholder color if available.
		const inheritPlaceholderColor = style?.placeholderColor
			? `${ style.placeholderColor }${ placeholderOpacity }`
			: undefined;

		// If using block-based themes, derive the placeholder color from global styles.
		const globalStylesPlaceholderColor = baseGlobalStyles?.color?.text
			? `${ baseGlobalStyles.color.text }${ placeholderOpacity }`
			: undefined;

		return (
			inheritPlaceholderColor ??
			placeholderTextColor ??
			globalStylesPlaceholderColor ??
			defaultPlaceholderTextColor
		);
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
			parentBlockStyles,
			accessibilityLabel,
			disableEditingMenu = false,
			baseGlobalStyles,
			selectionStart,
			selectionEnd,
			disableSuggestions,
			containerWidth,
		} = this.props;
		const { currentFontSize } = this.state;

		const record = this.getRecord();
		const html = this.getHtmlToRender( record, tagName );
		const editableProps = this.getEditableProps();
		const blockUseDefaultFont = this.getBlockUseDefaultFont();

		const fontSize = currentFontSize;
		const lineHeight = this.getLineHeight();

		const {
			color: defaultColor,
			textDecorationColor: defaultTextDecorationColor,
			fontFamily: defaultFontFamily,
		} = getStylesFromColorScheme( styles.richText, styles.richTextDark );
		const linkTextColor = this.getLinkTextColor(
			defaultTextDecorationColor
		);

		const currentSelectionStart = selectionStart ?? 0;
		const currentSelectionEnd = selectionEnd ?? 0;
		let selection = null;
		if ( this.needsSelectionUpdate ) {
			this.needsSelectionUpdate = false;
			selection = {
				start: currentSelectionStart,
				end: currentSelectionEnd,
			};

			// On AztecAndroid, setting the caret to an out-of-bounds position will crash the editor so, let's check for some cases.
			if ( ! this.isIOS ) {
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
						let newSelectionStart = currentSelectionStart - count;
						if ( newSelectionStart < 0 ) {
							newSelectionStart = 0;
						}
						let newSelectionEnd = currentSelectionEnd - count;
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

		if ( this.comesFromAztec ) {
			this.comesFromAztec = false;
			this.firedAfterTextChanged = false;
		}

		// Logic below assures that `RichText` width will always have equal value when container is almost fully filled.
		const width =
			maxWidth && this.state.width && maxWidth - this.state.width < 10
				? maxWidth
				: this.state.width;
		const containerStyles = [
			style?.padding &&
				style?.backgroundColor && {
					padding: style.padding,
					backgroundColor: style.backgroundColor,
				},
			containerWidth && {
				width: containerWidth,
			},
		];

		const defaultSelectionColor = getStylesFromColorScheme(
			styles[ 'rich-text-selection' ],
			styles[ 'rich-text-selection--dark' ]
		).color;
		const selectionColor = getSelectionColor(
			this.props.selectionColor,
			defaultSelectionColor,
			baseGlobalStyles,
			this.getIsBlockBasedTheme()
		);

		const EditableView = ( props ) => {
			this.customEditableOnKeyDown = props?.onKeyDown;

			return <></>;
		};

		return (
			<View style={ containerStyles }>
				{ children &&
					children( {
						isSelected,
						value: record,
						onChange: this.onFormatChange,
						onFocus: () => {},
						editableProps,
						editableTagName: EditableView,
					} ) }
				<RCTAztecView
					accessibilityLabel={ accessibilityLabel }
					ref={ ( ref ) => {
						this._editor = ref;

						if ( this.props.nativeEditorRef ) {
							this.props.nativeEditorRef( ref );
						}
					} }
					style={ {
						backgroundColor: styles.richText.backgroundColor,
						...style,
						...( this.isIOS && minWidth && maxWidth
							? { width }
							: { maxWidth } ),
						minHeight: this.state.height,
					} }
					blockUseDefaultFont={ blockUseDefaultFont }
					text={ {
						text: html,
						eventCount: this.lastEventCount,
						selection,
						linkTextColor,
						tag: tagName,
					} }
					placeholder={ this.props.placeholder }
					placeholderTextColor={ this.getPlaceholderTextColor() }
					deleteEnter={ this.props.deleteEnter }
					onChange={ this.onChangeFromAztec }
					onFocus={ this.onFocus }
					onBlur={ this.onBlur }
					onKeyDown={ this.onKeyDown }
					triggerKeyCodes={
						disableEditingMenu
							? []
							: this.suggestionOptions().map(
									( op ) => op.triggerChar
							  )
					}
					onPaste={ this.onPaste }
					activeFormats={ this.getActiveFormatNames( record ) }
					onContentSizeChange={ this.onContentSizeChange }
					onSelectionChange={ this.onSelectionChangeFromAztec }
					blockType={ { tag: tagName } }
					color={
						( style && style.color ) ||
						( parentBlockStyles && parentBlockStyles.color ) ||
						( baseGlobalStyles && baseGlobalStyles?.color?.text ) ||
						defaultColor
					}
					maxImagesWidth={ 200 }
					fontFamily={ this.props.fontFamily || defaultFontFamily }
					fontSize={ fontSize }
					lineHeight={ lineHeight }
					fontWeight={ this.props.fontWeight }
					fontStyle={ this.props.fontStyle }
					disableEditingMenu={ disableEditingMenu }
					isMultiline={ false }
					textAlign={ this.props.textAlign }
					{ ...( this.isIOS ? { maxWidth } : {} ) }
					minWidth={ minWidth }
					id={ this.props.id }
					selectionColor={ selectionColor }
					disableAutocorrection={ this.props.disableAutocorrection }
				/>
				{ isSelected && (
					<>
						<FormatEdit
							forwardedRef={ this._editor }
							formatTypes={ formatTypes }
							value={ record }
							onChange={ this.onFormatChange }
							onFocus={ () => {} }
						/>
						{ ! disableSuggestions && (
							<BlockFormatControls>
								<ToolbarButtonWithOptions
									options={ this.suggestionOptions() }
								/>
							</BlockFormatControls>
						) }
					</>
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

const withFormatTypes = ( WrappedComponent ) => ( props ) => {
	const {
		clientId,
		identifier,
		withoutInteractiveFormatting,
		allowedFormats,
	} = props;
	const { formatTypes } = useFormatTypes( {
		clientId,
		identifier,
		withoutInteractiveFormatting,
		allowedFormats,
	} );

	return <WrappedComponent { ...props } formatTypes={ formatTypes } />;
};

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlockParents, getBlock, getSettings } =
			select( 'core/block-editor' );
		const parents = getBlockParents( clientId, true );
		const parentBlock = parents ? getBlock( parents[ 0 ] ) : undefined;
		const parentBlockStyles = parentBlock?.attributes?.childrenStyles;

		const settings = getSettings();
		const baseGlobalStyles = settings?.__experimentalGlobalStylesBaseStyles;

		const colorPalettes = settings?.__experimentalFeatures?.color?.palette;
		const colorPalette = colorPalettes
			? flatColorPalettes( colorPalettes )
			: settings?.colors;

		return {
			areMentionsSupported: settings?.capabilities?.mentions === true,
			areXPostsSupported: settings?.capabilities?.xposts === true,
			parentBlockStyles,
			baseGlobalStyles,
			colorPalette,
		};
	} ),
	withPreferredColorScheme,
	withFormatTypes,
] )( RichText );
