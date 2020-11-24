/**
 * WordPress dependencies
 */
import {forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState,} from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import {getFilesFromDataTransfer} from '@wordpress/dom';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import {getActiveFormats} from '../get-active-formats';
import {updateFormats} from '../update-formats';
import {useFormatTypes} from './use-format-types';
import {useBoundaryStyle} from './use-boundary-style';
import {useInlineWarning} from './use-inline-warning';
import {insert} from '../insert';
import {
	applyRecord,
	createRecord,
	getDefaultView,
	getInitialRecord,
	getOwnerDocument,
	getRange,
	removeEditorOnlyFormats,
} from './utils/misc.js';
/**
 * External dependencies
 */
import {identity, thunkify} from 'ramda';
import {handleKeyDown} from './kayHandlers/keyDownHandler';
import {fixPlaceholderSelection} from './utils/fixPlaceholderSelection';
import {valueToFormat} from './utils/valueToFormat';

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
 * Default style object for the editable element.
 *
 * @type {Object<string,string>}
 */
const defaultStyle = { whiteSpace };

const EMPTY_ACTIVE_FORMATS = [];

function RichText(
	{
		tagName: TagName = 'div',
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
		onEnter = identity,
		onSelectionChange,
		onChange,
		unstableOnFocus: onFocus,
		setFocusedElement,
		instanceId,
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
	ref
) {
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
	} );

	// For backward compatibility, fall back to tagName if it's a string.
	// tagName can now be a component for light blocks.
	if ( ! multilineRootTag && typeof TagName === 'string' ) {
		multilineRootTag = TagName;
	}

	const getDoc = thunkify( getOwnerDocument )( ref );
	const getWin = thunkify( getDefaultView )( ref );
	const initialRecordData = {
		selectionStart,
		selectionEnd,
		string: value,
		disableFormats,
		valueHandlers,
		multilineTag,
		preserveWhiteSpace,
		format,
	};

	// Internal values are updated synchronously, unlike props and state.
	const _value = useRef( value );
	const record = useRef(
		useMemo( () => getInitialRecord( initialRecordData ), [] )
	);

	const valueToFormatData = {
		formatTypes,
		disableFormats,
		format,
		multilineTag,
		preserveWhiteSpace
	};

	const lastHistoryValue = useRef( value );

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
			const files = [ ...getFilesFromDataTransfer( clipboardData ) ];

			onPaste( {
				value: removeEditorOnlyFormats( {
					val: record.current,
					formatTypes,
				} ),
				onChange: handleChange,
				html,
				plainText,
				files: [ ...files ],
				activeFormats,
			} );
		}
	}

	function createUndoLevel() {
		// If the content is the same, no level needs to be created.
		if ( lastHistoryValue.current === _value.current ) {
			return;
		}

		onCreateUndoLevel();
		lastHistoryValue.current = _value.current;
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
			applyRecord( {
				value: record.current,
				multilineTag,
				current: ref.current,
				placeholder,
				domOnly: false,
				prepareHandlers,
			} );

			return;
		}

		const currentValue = createRecord( {
			element: ref.current,
			range: getRange( getWin().getSelection() ),
			multilineTag,
			preserveWhiteSpace,
		} );
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
			inputRule(
				change,
				valueToFormat( valueToFormatData)
			);
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

		const { start, end, text } = createRecord( {
			element: ref.current,
			range: getRange( getWin().getSelection() ),
			multilineTag,
			preserveWhiteSpace,
		} );
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
			// Allow `getActiveFormats` to get new `activeFormats`.
			activeFormats: undefined,
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
		applyRecord( {
			value: newValue,
			multilineTag,
			current: ref.current,
			placeholder,
			domOnly: true,
			prepareHandlers,
		} );

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
		applyRecord( {
			value: newRecord,
			multilineTag,
			current: ref.current,
			placeholder,
			domOnly: false,
			prepareHandlers,
		} );

		const { start, end, activeFormats: newActiveFormats = [] } = newRecord;

		Object.values( changeHandlers ).forEach( ( changeHandler ) => {
			changeHandler( newRecord.formats, newRecord.text );
		} );

		_value.current = valueToFormat(
			valueToFormatData,
			newRecord
		);
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
	 * In contrast with `setFocusedElement`, this is only triggered in response
	 * to focus within the contenteditable field, whereas `setFocusedElement`
	 * is triggered on focus within any `RichText` descendent element.
	 *
	 * @see setFocusedElement
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
				// toDo fix input
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

		if ( setFocusedElement ) {
			deprecated( 'wp.blockEditor.RichText setFocusedElement prop', {
				alternative: 'selection state from the block editor store.',
			} );
			setFocusedElement( instanceId );
		}
	}

	function handleBlur() {
		getDoc().removeEventListener(
			'selectionchange',
			handleSelectionChange
		);
	}

	function applyFromProps() {
		_value.current = value;
		record.current = getInitialRecord( {
			initialRecordData,
		} );
		applyRecord( {
			value: record.current,
			multilineTag,
			current: ref.current,
			placeholder,
			domOnly: false,
			prepareHandlers,
		} );
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
		applyRecord( {
			value: record.current,
			multilineTag,
			current: ref.current,
			placeholder,
			domOnly: true,
			prepareHandlers,
		} );

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
		applyRecord( {
			value: record.current,
			multilineTag,
			current: ref.current,
			placeholder,
			domOnly: false,
			prepareHandlers,
		} );
	}

	const onKeyDown = handleKeyDown( {
		ref,
		getWin,
		multilineTag,
		formatTypes,
		didAutomaticChange,
		undo,
		onSelectionChange,
		setActiveFormats,
		record,
		placeholder,
		handleChange,
		onDelete,
		multilineRootTag,
		activeFormats,
		preserveWhiteSpace,
		onEnter,
	} );

	const editableProps = {
		// Overridable props.
		role: 'textbox',
		'aria-multiline': true,
		'aria-label': placeholder,
		ref,
		style: defaultStyle,
		className: 'rich-text',
		onPaste: handlePaste,
		onInput: handleInput,
		onCompositionStart: handleCompositionStart,
		onCompositionEnd: handleCompositionEnd,
		onKeyDown,
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
					allowedFormats={ allowedFormats }
					withoutInteractiveFormatting={
						withoutInteractiveFormatting
					}
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
