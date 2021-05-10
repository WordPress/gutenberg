/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useEffect,
	useRef,
	useState,
	useLayoutEffect,
} from '@wordpress/element';
import { BACKSPACE, DELETE, ENTER } from '@wordpress/keycodes';
import { useMergeRefs } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import { create } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { removeFormat } from '../remove-format';
import { isCollapsed } from '../is-collapsed';
import { useFormatTypes } from './use-format-types';
import { useDefaultStyle } from './use-default-style';
import { useBoundaryStyle } from './use-boundary-style';
import { useInlineWarning } from './use-inline-warning';
import { useCopyHandler } from './use-copy-handler';
import { useFormatBoundaries } from './use-format-boundaries';
import { useSelectObject } from './use-select-object';
import { useUndoAutomaticChange } from './use-undo-automatic-change';
import { usePasteHandler } from './use-paste-handler';
import { useIndentListItemOnSpace } from './use-indent-list-item-on-space';
import { useInputAndSelection } from './use-input-and-selection';
import { useDelete } from './use-delete';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

function createPrepareEditableTree( fns ) {
	return ( value ) =>
		fns.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
}

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

	function createRecord() {
		const {
			ownerDocument: { defaultView },
		} = ref.current;
		const selection = defaultView.getSelection();
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

	function handleKeyDown( event ) {
		if ( event.defaultPrevented ) {
			return;
		}

		const { keyCode } = event;

		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			if ( onEnter ) {
				onEnter( {
					value: removeEditorOnlyFormats( record.current ),
					onChange: handleChange,
					shiftKey: event.shiftKey,
				} );
			}
		} else if ( keyCode === DELETE || keyCode === BACKSPACE ) {
			const { start, end, text } = record.current;
			const isReverse = keyCode === BACKSPACE;

			// Only process delete if the key press occurs at an uncollapsed edge.
			if (
				! onDelete ||
				! isCollapsed( record.current ) ||
				activeFormats.length ||
				( isReverse && start !== 0 ) ||
				( ! isReverse && end !== text.length )
			) {
				return;
			}

			onDelete( { isReverse, value: record.current } );
			event.preventDefault();
		}
	}

	// Internal values are updated synchronously, unlike props and state.
	const _value = useRef( value );
	const record = useRef();
	const lastHistoryValue = useRef( value );

	function setRecordFromProps() {
		record.current = formatToValue( value );
		record.current.start = selectionStart;
		record.current.end = selectionEnd;
	}

	if ( ! record.current ) {
		setRecordFromProps();
	}

	function createUndoLevel() {
		// If the content is the same, no level needs to be created.
		if ( lastHistoryValue.current === _value.current ) {
			return;
		}

		onCreateUndoLevel();
		lastHistoryValue.current = _value.current;
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

		_value.current = valueToFormat( newRecord );
		record.current = newRecord;

		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		onSelectionChange( start, end );
		onChange( _value.current );
		setActiveFormats( newActiveFormats );

		Object.values( changeHandlers ).forEach( ( changeHandler ) => {
			changeHandler( newRecord.formats, newRecord.text );
		} );

		if ( ! withoutHistory ) {
			createUndoLevel();
		}
	}

	function applyFromProps( { domOnly } = {} ) {
		_value.current = value;
		setRecordFromProps();
		applyRecord( record.current, { domOnly } );
	}

	const didMount = useRef( false );

	useLayoutEffect( () => {
		if ( didMount.current ) {
			applyFromProps();
		} else {
			applyFromProps( { domOnly: true } );
		}

		didMount.current = true;
	}, [ TagName, placeholder, ...dependencies ] );

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
			useDefaultStyle(),
			useBoundaryStyle( { activeFormats } ),
			useInlineWarning(),
			useCopyHandler( { record, multilineTag, preserveWhiteSpace } ),
			useSelectObject(),
			useFormatBoundaries( { record, applyRecord, setActiveFormats } ),
			useUndoAutomaticChange( { didAutomaticChange, undo } ),
			useDelete( {
				createRecord,
				handleChange,
				multilineTag,
			} ),
			useIndentListItemOnSpace( {
				multilineTag,
				multilineRootTag,
				createRecord,
				handleChange,
			} ),
			usePasteHandler( {
				isSelected,
				disableFormats,
				handleChange,
				record,
				formatTypes,
				onPaste,
				removeEditorOnlyFormats,
				activeFormats,
			} ),
			useInputAndSelection( {
				record,
				applyRecord,
				createRecord,
				handleChange,
				createUndoLevel,
				allowPrefixTransformations,
				inputRule,
				valueToFormat,
				formatTypes,
				markAutomaticChange,
				isSelected,
				disabled,
				isCaretWithinFormattedText,
				onEnterFormattedText,
				onExitFormattedText,
				onSelectionChange,
				setActiveFormats,
			} ),
		] ),
		className: 'rich-text',
		onKeyDown: handleKeyDown,
		onFocus,
		// Do not set the attribute if disabled.
		contentEditable: disabled ? undefined : true,
		suppressContentEditableWarning: ! disabled,
	};

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
