/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useRef,
	useState,
	useMemo,
	useLayoutEffect,
} from '@wordpress/element';
import { BACKSPACE, DELETE, ENTER, SPACE } from '@wordpress/keycodes';
import { getFilesFromDataTransfer } from '@wordpress/dom';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import { create } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { remove } from '../remove';
import { removeFormat } from '../remove-format';
import { isCollapsed } from '../is-collapsed';
import { LINE_SEPARATOR } from '../special-characters';
import { indentListItems } from '../indent-list-items';
import { getActiveFormats } from '../get-active-formats';
import { updateFormats } from '../update-formats';
import { removeLineSeparator } from '../remove-line-separator';
import { isEmptyLine } from '../is-empty';
import { useFormatTypes } from './use-format-types';
import { useBoundaryStyle } from './use-boundary-style';
import { useInlineWarning } from './use-inline-warning';
import { insert } from '../insert';
import { useCopyHandler } from './use-copy-handler';
import { useFormatBoundaries } from './use-format-boundaries';
import { useUndoAutomaticChange } from './use-undo-automatic-change';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

/**
 * All inserting input types that would insert HTML into the DOM.
 *
 * @see https://www.w3.org/TR/input-events-2/#interface-InputEvent-Attributes
 *
 * @type {Set}
 */
const INSERTION_INPUT_TYPES_TO_IGNORE = new Set( [
	'insertParagraph',
	'insertOrderedList',
	'insertUnorderedList',
	'insertHorizontalRule',
	'insertLink',
] );

/**
 * In HTML, leading and trailing spaces are not visible, and multiple spaces
 * elsewhere are visually reduced to one space. This rule prevents spaces from
 * collapsing so all space is visible in the editor and can be removed. It also
 * prevents some browsers from inserting non-breaking spaces at the end of a
 * line to prevent the space from visually disappearing. Sometimes these non
 * breaking spaces can linger in the editor causing unwanted non breaking spaces
 * in between words. If also prevent Firefox from inserting a trailing `br` node
 * to visualise any trailing space, causing the element to be saved.
 *
 * > Authors are encouraged to set the 'white-space' property on editing hosts
 * > and on markup that was originally created through these editing mechanisms
 * > to the value 'pre-wrap'. Default HTML whitespace handling is not well
 * > suited to WYSIWYG editing, and line wrapping will not work correctly in
 * > some corner cases if 'white-space' is left at its default value.
 *
 * https://html.spec.whatwg.org/multipage/interaction.html#best-practices-for-in-page-editors
 *
 * @type {string}
 */
const whiteSpace = 'pre-wrap';

/**
 * A minimum width of 1px will prevent the rich text container from collapsing
 * to 0 width and hiding the caret. This is useful for inline containers.
 */
const minWidth = '1px';

/**
 * Default style object for the editable element.
 *
 * @type {Object<string,string>}
 */
const defaultStyle = { whiteSpace, minWidth };

const EMPTY_ACTIVE_FORMATS = [];

function createPrepareEditableTree( fns ) {
	return ( value ) =>
		fns.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
}

/**
 * If the selection is set on the placeholder element, collapse the selection to
 * the start (before the placeholder).
 *
 * @param {Window} defaultView
 */
function fixPlaceholderSelection( defaultView ) {
	const selection = defaultView.getSelection();
	const { anchorNode, anchorOffset } = selection;

	if ( anchorNode.nodeType !== anchorNode.ELEMENT_NODE ) {
		return;
	}

	const targetNode = anchorNode.childNodes[ anchorOffset ];

	if (
		! targetNode ||
		targetNode.nodeType !== targetNode.ELEMENT_NODE ||
		! targetNode.getAttribute( 'data-rich-text-placeholder' )
	) {
		return;
	}

	selection.collapseToStart();
}

function RichText(
	{
		tagName: TagName = 'div',
		className,
		value = '',
		selectionStart,
		selectionEnd,
		children,
		allowedFormats,
		withoutInteractiveFormatting,
		placeholder,
		disabled,
		preserveWhiteSpace,
		onPaste,
		format = 'string',
		onDelete,
		onEnter,
		onSelectionChange,
		onChange,
		unstableOnFocus: onFocus,
		clientId,
		identifier,
		__unstableMultilineTag: multilineTag,
		__unstableMultilineRootTag: multilineRootTag,
		__unstableDisableFormats: disableFormats,
		__unstableDidAutomaticChange: didAutomaticChange,
		__unstableInputRule: inputRule,
		__unstableMarkAutomaticChange: markAutomaticChange,
		__unstableAllowPrefixTransformations: allowPrefixTransformations,
		__unstableUndo: undo,
		__unstableIsCaretWithinFormattedText: isCaretWithinFormattedText,
		__unstableOnEnterFormattedText: onEnterFormattedText,
		__unstableOnExitFormattedText: onExitFormattedText,
		__unstableOnCreateUndoLevel: onCreateUndoLevel,
		__unstableIsSelected: isSelected,
	},
	forwardedRef
) {
	const ref = useRef();
	const [ activeFormats = [], setActiveFormats ] = useState();
	const {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	} = useFormatTypes( {
		clientId,
		identifier,
		withoutInteractiveFormatting,
		allowedFormats,
	} );

	// For backward compatibility, fall back to tagName if it's a string.
	// tagName can now be a component for light blocks.
	if ( ! multilineRootTag && typeof TagName === 'string' ) {
		multilineRootTag = TagName;
	}

	function getDoc() {
		return ref.current.ownerDocument;
	}

	function getWin() {
		return getDoc().defaultView;
	}

	/**
	 * Converts the outside data structure to our internal representation.
	 *
	 * @param {*} string The outside value, data type depends on props.
	 *
	 * @return {Object} An internal rich-text value.
	 */
	function formatToValue( string ) {
		if ( disableFormats ) {
			return {
				text: string,
				formats: Array( string.length ),
				replacements: Array( string.length ),
			};
		}

		if ( format !== 'string' ) {
			return string;
		}

		const prepare = createPrepareEditableTree( valueHandlers );

		const result = create( {
			html: string,
			multilineTag,
			multilineWrapperTags:
				multilineTag === 'li' ? [ 'ul', 'ol' ] : undefined,
			preserveWhiteSpace,
		} );

		result.formats = prepare( result );

		return result;
	}

	/**
	 * Removes editor only formats from the value.
	 *
	 * Editor only formats are applied using `prepareEditableTree`, so we need to
	 * remove them before converting the internal state
	 *
	 * @param {Object} val The internal rich-text value.
	 *
	 * @return {Object} A new rich-text value.
	 */
	function removeEditorOnlyFormats( val ) {
		formatTypes.forEach( ( formatType ) => {
			// Remove formats created by prepareEditableTree, because they are editor only.
			if ( formatType.__experimentalCreatePrepareEditableTree ) {
				val = removeFormat( val, formatType.name, 0, val.text.length );
			}
		} );

		return val;
	}

	/**
	 * Converts the internal value to the external data format.
	 *
	 * @param {Object} val The internal rich-text value.
	 *
	 * @return {*} The external data format, data type depends on props.
	 */
	function valueToFormat( val ) {
		if ( disableFormats ) {
			return val.text;
		}

		val = removeEditorOnlyFormats( val );

		if ( format !== 'string' ) {
			return;
		}

		return toHTMLString( { value: val, multilineTag, preserveWhiteSpace } );
	}

	// Internal values are updated synchronously, unlike props and state.
	const _value = useRef( value );
	const record = useRef(
		useMemo( () => {
			const initialRecord = formatToValue( value );
			initialRecord.start = selectionStart;
			initialRecord.end = selectionEnd;
			return initialRecord;
		}, [] )
	);

	function createRecord() {
		const selection = getWin().getSelection();
		const range =
			selection.rangeCount > 0 ? selection.getRangeAt( 0 ) : null;

		return create( {
			element: ref.current,
			range,
			multilineTag,
			multilineWrapperTags:
				multilineTag === 'li' ? [ 'ul', 'ol' ] : undefined,
			__unstableIsEditableTree: true,
			preserveWhiteSpace,
		} );
	}

	function applyRecord( newRecord, { domOnly } = {} ) {
		apply( {
			value: newRecord,
			current: ref.current,
			multilineTag,
			multilineWrapperTags:
				multilineTag === 'li' ? [ 'ul', 'ol' ] : undefined,
			prepareEditableTree: createPrepareEditableTree( prepareHandlers ),
			__unstableDomOnly: domOnly,
			placeholder,
		} );
	}

	/**
	 * Handles a paste event.
	 *
	 * Saves the pasted data as plain text in `pastedPlainText`.
	 *
	 * @param {ClipboardEvent} event The paste event.
	 */
	function handlePaste( event ) {
		if ( ! isSelected ) {
			event.preventDefault();
			return;
		}

		const { clipboardData } = event;

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

		if ( disableFormats ) {
			handleChange( insert( record.current, plainText ) );
			return;
		}

		const transformed = formatTypes.reduce(
			( accumlator, { __unstablePasteRule } ) => {
				// Only allow one transform.
				if ( __unstablePasteRule && accumlator === record.current ) {
					accumlator = __unstablePasteRule( record.current, {
						html,
						plainText,
					} );
				}

				return accumlator;
			},
			record.current
		);

		if ( transformed !== record.current ) {
			handleChange( transformed );
			return;
		}

		if ( onPaste ) {
			const files = getFilesFromDataTransfer( clipboardData );
			const isInternal = clipboardData.getData( 'rich-text' ) === 'true';

			onPaste( {
				value: removeEditorOnlyFormats( record.current ),
				onChange: handleChange,
				html,
				plainText,
				isInternal,
				files: [ ...files ],
				activeFormats,
			} );
		}
	}

	/**
	 * Handles delete on keydown:
	 * - outdent list items,
	 * - delete content if everything is selected,
	 * - trigger the onDelete prop when selection is uncollapsed and at an edge.
	 *
	 * @param {WPSyntheticEvent} event A synthetic keyboard event.
	 */
	function handleDelete( event ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode !== DELETE && keyCode !== BACKSPACE ) {
			return;
		}

		const currentValue = createRecord();
		const { start, end, text } = currentValue;
		const isReverse = keyCode === BACKSPACE;

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end === text.length ) {
			handleChange( remove( currentValue ) );
			event.preventDefault();
			return;
		}

		if ( multilineTag ) {
			let newValue;

			// Check to see if we should remove the first item if empty.
			if (
				isReverse &&
				currentValue.start === 0 &&
				currentValue.end === 0 &&
				isEmptyLine( currentValue )
			) {
				newValue = removeLineSeparator( currentValue, ! isReverse );
			} else {
				newValue = removeLineSeparator( currentValue, isReverse );
			}

			if ( newValue ) {
				handleChange( newValue );
				event.preventDefault();
				return;
			}
		}

		// Only process delete if the key press occurs at an uncollapsed edge.
		if (
			! onDelete ||
			! isCollapsed( currentValue ) ||
			activeFormats.length ||
			( isReverse && start !== 0 ) ||
			( ! isReverse && end !== text.length )
		) {
			return;
		}

		onDelete( { isReverse, value: currentValue } );
		event.preventDefault();
	}

	/**
	 * Triggers the `onEnter` prop on keydown.
	 *
	 * @param {WPSyntheticEvent} event A synthetic keyboard event.
	 */
	function handleEnter( event ) {
		if ( event.keyCode !== ENTER ) {
			return;
		}

		event.preventDefault();

		if ( ! onEnter ) {
			return;
		}

		onEnter( {
			value: removeEditorOnlyFormats( createRecord() ),
			onChange: handleChange,
			shiftKey: event.shiftKey,
		} );
	}

	/**
	 * Indents list items on space keydown.
	 *
	 * @param {WPSyntheticEvent} event A synthetic keyboard event.
	 */
	function handleSpace( event ) {
		const { keyCode, shiftKey, altKey, metaKey, ctrlKey } = event;

		if (
			// Only override when no modifiers are pressed.
			shiftKey ||
			altKey ||
			metaKey ||
			ctrlKey ||
			keyCode !== SPACE ||
			multilineTag !== 'li'
		) {
			return;
		}

		const currentValue = createRecord();

		if ( ! isCollapsed( currentValue ) ) {
			return;
		}

		const { text, start } = currentValue;
		const characterBefore = text[ start - 1 ];

		// The caret must be at the start of a line.
		if ( characterBefore && characterBefore !== LINE_SEPARATOR ) {
			return;
		}

		handleChange(
			indentListItems( currentValue, { type: multilineRootTag } )
		);
		event.preventDefault();
	}

	function handleKeyDown( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		handleDelete( event );
		handleEnter( event );
		handleSpace( event );
	}

	const lastHistoryValue = useRef( value );

	function createUndoLevel() {
		// If the content is the same, no level needs to be created.
		if ( lastHistoryValue.current === _value.current ) {
			return;
		}

		lastHistoryValue.current = _value.current;

		if ( onCreateUndoLevel ) {
			onCreateUndoLevel();
		}
	}

	const isComposing = useRef( false );
	const timeout = useRef();

	/**
	 * Handle input on the next selection change event.
	 *
	 * @param {WPSyntheticEvent} event Synthetic input event.
	 */
	function handleInput( event ) {
		// Do not trigger a change if characters are being composed. Browsers
		// will usually emit a final `input` event when the characters are
		// composed.
		// As of December 2019, Safari doesn't support nativeEvent.isComposing.
		if ( isComposing.current ) {
			return;
		}

		let inputType;

		if ( event ) {
			inputType = event.inputType;
		}

		if ( ! inputType && event && event.nativeEvent ) {
			inputType = event.nativeEvent.inputType;
		}

		// The browser formatted something or tried to insert HTML.
		// Overwrite it. It will be handled later by the format library if
		// needed.
		if (
			inputType &&
			( inputType.indexOf( 'format' ) === 0 ||
				INSERTION_INPUT_TYPES_TO_IGNORE.has( inputType ) )
		) {
			applyRecord( record.current );
			return;
		}

		const currentValue = createRecord();
		const { start, activeFormats: oldActiveFormats = [] } = record.current;

		// Update the formats between the last and new caret position.
		const change = updateFormats( {
			value: currentValue,
			start,
			end: currentValue.start,
			formats: oldActiveFormats,
		} );

		handleChange( change, { withoutHistory: true } );

		// Create an undo level when input stops for over a second.
		getWin().clearTimeout( timeout.current );
		timeout.current = getWin().setTimeout( createUndoLevel, 1000 );

		// Only run input rules when inserting text.
		if ( inputType !== 'insertText' ) {
			return;
		}

		if ( allowPrefixTransformations && inputRule ) {
			inputRule( change, valueToFormat );
		}

		const transformed = formatTypes.reduce(
			( accumlator, { __unstableInputRule } ) => {
				if ( __unstableInputRule ) {
					accumlator = __unstableInputRule( accumlator );
				}

				return accumlator;
			},
			change
		);

		if ( transformed !== change ) {
			createUndoLevel();
			handleChange( { ...transformed, activeFormats: oldActiveFormats } );
			markAutomaticChange();
		}
	}

	function handleCompositionStart() {
		isComposing.current = true;
		// Do not update the selection when characters are being composed as
		// this rerenders the component and might distroy internal browser
		// editing state.
		getDoc().removeEventListener(
			'selectionchange',
			handleSelectionChange
		);
	}

	function handleCompositionEnd() {
		isComposing.current = false;
		// Ensure the value is up-to-date for browsers that don't emit a final
		// input event after composition.
		handleInput( { inputType: 'insertText' } );
		// Tracking selection changes can be resumed.
		getDoc().addEventListener( 'selectionchange', handleSelectionChange );
	}

	const didMount = useRef( false );

	/**
	 * Syncs the selection to local state. A callback for the `selectionchange`
	 * native events, `keyup`, `mouseup` and `touchend` synthetic events, and
	 * animation frames after the `focus` event.
	 *
	 * @param {Event|WPSyntheticEvent|DOMHighResTimeStamp} event
	 */
	function handleSelectionChange( event ) {
		if ( ! ref.current ) {
			return;
		}

		if ( ref.current.ownerDocument.activeElement !== ref.current ) {
			return;
		}

		if ( event.type !== 'selectionchange' && ! isSelected ) {
			return;
		}

		if ( disabled ) {
			return;
		}

		// In case of a keyboard event, ignore selection changes during
		// composition.
		if ( isComposing.current ) {
			return;
		}

		const { start, end, text } = createRecord();
		const oldRecord = record.current;

		// Fallback mechanism for IE11, which doesn't support the input event.
		// Any input results in a selection change.
		if ( text !== oldRecord.text ) {
			handleInput();
			return;
		}

		if ( start === oldRecord.start && end === oldRecord.end ) {
			// Sometimes the browser may set the selection on the placeholder
			// element, in which case the caret is not visible. We need to set
			// the caret before the placeholder if that's the case.
			if ( oldRecord.text.length === 0 && start === 0 ) {
				fixPlaceholderSelection( getWin() );
			}

			return;
		}

		const newValue = {
			...oldRecord,
			start,
			end,
			// _newActiveFormats may be set on arrow key navigation to control
			// the right boundary position. If undefined, getActiveFormats will
			// give the active formats according to the browser.
			activeFormats: oldRecord._newActiveFormats,
			_newActiveFormats: undefined,
		};

		const newActiveFormats = getActiveFormats(
			newValue,
			EMPTY_ACTIVE_FORMATS
		);

		// Update the value with the new active formats.
		newValue.activeFormats = newActiveFormats;

		if ( ! isCaretWithinFormattedText && newActiveFormats.length ) {
			onEnterFormattedText();
		} else if ( isCaretWithinFormattedText && ! newActiveFormats.length ) {
			onExitFormattedText();
		}

		// It is important that the internal value is updated first,
		// otherwise the value will be wrong on render!
		record.current = newValue;
		applyRecord( newValue, { domOnly: true } );
		onSelectionChange( start, end );
		setActiveFormats( newActiveFormats );
	}

	/**
	 * Sync the value to global state. The node tree and selection will also be
	 * updated if differences are found.
	 *
	 * @param {Object}  newRecord         The record to sync and apply.
	 * @param {Object}  $2                Named options.
	 * @param {boolean} $2.withoutHistory If true, no undo level will be
	 *                                    created.
	 */
	function handleChange( newRecord, { withoutHistory } = {} ) {
		if ( disableFormats ) {
			newRecord.formats = Array( newRecord.text.length );
			newRecord.replacements = Array( newRecord.text.length );
		}

		applyRecord( newRecord );

		const { start, end, activeFormats: newActiveFormats = [] } = newRecord;

		Object.values( changeHandlers ).forEach( ( changeHandler ) => {
			changeHandler( newRecord.formats, newRecord.text );
		} );

		_value.current = valueToFormat( newRecord );
		record.current = newRecord;

		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		onSelectionChange( start, end );
		onChange( _value.current );
		setActiveFormats( newActiveFormats );

		if ( ! withoutHistory ) {
			createUndoLevel();
		}
	}

	/**
	 * Select object when they are clicked. The browser will not set any
	 * selection when clicking e.g. an image.
	 *
	 * @param {WPSyntheticEvent} event Synthetic mousedown or touchstart event.
	 */
	function handlePointerDown( event ) {
		const { target } = event;

		// If the child element has no text content, it must be an object.
		if ( target === ref.current || target.textContent ) {
			return;
		}

		const { parentNode } = target;
		const index = Array.from( parentNode.childNodes ).indexOf( target );
		const range = getDoc().createRange();
		const selection = getWin().getSelection();

		range.setStart( target.parentNode, index );
		range.setEnd( target.parentNode, index + 1 );

		selection.removeAllRanges();
		selection.addRange( range );
	}

	const rafId = useRef();

	/**
	 * Handles a focus event on the contenteditable field, calling the
	 * `unstableOnFocus` prop callback if one is defined. The callback does not
	 * receive any arguments.
	 *
	 * This is marked as a private API and the `unstableOnFocus` prop is not
	 * documented, as the current requirements where it is used are subject to
	 * future refactoring following `isSelected` handling.
	 *
	 * @private
	 */
	function handleFocus() {
		if ( onFocus ) {
			onFocus();
		}

		if ( ! isSelected ) {
			// We know for certain that on focus, the old selection is invalid.
			// It will be recalculated on the next mouseup, keyup, or touchend
			// event.
			const index = undefined;

			record.current = {
				...record.current,
				start: index,
				end: index,
				activeFormats: EMPTY_ACTIVE_FORMATS,
			};
			onSelectionChange( index, index );
			setActiveFormats( EMPTY_ACTIVE_FORMATS );
		} else {
			onSelectionChange( record.current.start, record.current.end );
			setActiveFormats(
				getActiveFormats(
					{
						...record.current,
						activeFormats: undefined,
					},
					EMPTY_ACTIVE_FORMATS
				)
			);
		}

		// Update selection as soon as possible, which is at the next animation
		// frame. The event listener for selection changes may be added too late
		// at this point, but this focus event is still too early to calculate
		// the selection.
		rafId.current = getWin().requestAnimationFrame( handleSelectionChange );

		getDoc().addEventListener( 'selectionchange', handleSelectionChange );
	}

	function handleBlur() {
		getDoc().removeEventListener(
			'selectionchange',
			handleSelectionChange
		);
	}

	function applyFromProps() {
		_value.current = value;
		record.current = formatToValue( value );
		record.current.start = selectionStart;
		record.current.end = selectionEnd;
		applyRecord( record.current );
	}

	useEffect( () => {
		if ( didMount.current ) {
			applyFromProps();
		}
	}, [ TagName, placeholder ] );

	useEffect( () => {
		if ( didMount.current && value !== _value.current ) {
			applyFromProps();
		}
	}, [ value ] );

	useEffect( () => {
		if ( ! didMount.current ) {
			return;
		}

		if (
			isSelected &&
			( selectionStart !== record.current.start ||
				selectionEnd !== record.current.end )
		) {
			applyFromProps();
		} else {
			record.current = {
				...record.current,
				start: selectionStart,
				end: selectionEnd,
			};
		}
	}, [ selectionStart, selectionEnd, isSelected ] );

	useEffect( () => {
		if ( didMount.current ) {
			applyFromProps();
		}
	}, dependencies );

	useLayoutEffect( () => {
		applyRecord( record.current, { domOnly: true } );

		didMount.current = true;

		return () => {
			getDoc().removeEventListener(
				'selectionchange',
				handleSelectionChange
			);
			getWin().cancelAnimationFrame( rafId.current );
			getWin().clearTimeout( timeout.current );
		};
	}, [] );

	function focus() {
		ref.current.focus();
		applyRecord( record.current );
	}

	const editableProps = {
		// Overridable props.
		role: 'textbox',
		'aria-multiline': true,
		'aria-label': placeholder,
		ref: useMergeRefs( [
			forwardedRef,
			ref,
			useCopyHandler( { record, multilineTag, preserveWhiteSpace } ),
			useFormatBoundaries( { record, applyRecord, setActiveFormats } ),
			useUndoAutomaticChange( { didAutomaticChange, undo } ),
		] ),
		style: defaultStyle,
		className: classnames( 'rich-text', className ),
		onPaste: handlePaste,
		onInput: handleInput,
		onCompositionStart: handleCompositionStart,
		onCompositionEnd: handleCompositionEnd,
		onKeyDown: handleKeyDown,
		onFocus: handleFocus,
		onBlur: handleBlur,
		onMouseDown: handlePointerDown,
		onTouchStart: handlePointerDown,
		// Selection updates must be done at these events as they
		// happen before the `selectionchange` event. In some cases,
		// the `selectionchange` event may not even fire, for
		// example when the window receives focus again on click.
		onKeyUp: handleSelectionChange,
		onMouseUp: handleSelectionChange,
		onTouchEnd: handleSelectionChange,
		// Do not set the attribute if disabled.
		contentEditable: disabled ? undefined : true,
		suppressContentEditableWarning: ! disabled,
	};

	useBoundaryStyle( { ref, activeFormats } );
	useInlineWarning( { ref } );

	return (
		<>
			{ isSelected && (
				<FormatEdit
					value={ record.current }
					onChange={ handleChange }
					onFocus={ focus }
					formatTypes={ formatTypes }
					forwardedRef={ ref }
				/>
			) }
			{ children &&
				children( {
					isSelected,
					value: record.current,
					onChange: handleChange,
					onFocus: focus,
					editableProps,
					editableTagName: TagName,
				} ) }
			{ ! children && <TagName { ...editableProps } /> }
		</>
	);
}

/**
 * Renders a rich content input, providing users with the option to format the
 * content.
 */
export default forwardRef( RichText );
