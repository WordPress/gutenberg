/**
 * WordPress dependencies
 */
import { useRef, useState, useLayoutEffect } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import { create } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { useDefaultStyle } from './use-default-style';
import { useBoundaryStyle } from './use-boundary-style';
import { useInlineWarning } from './use-inline-warning';
import { useCopyHandler } from './use-copy-handler';
import { useFormatBoundaries } from './use-format-boundaries';
import { useSelectObject } from './use-select-object';
import { usePasteHandler } from './use-paste-handler';
import { useIndentListItemOnSpace } from './use-indent-list-item-on-space';
import { useInputAndSelection } from './use-input-and-selection';
import { useDelete } from './use-delete';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

export function useRichText( {
	value = '',
	selectionStart,
	selectionEnd,
	placeholder,
	preserveWhiteSpace,
	onPaste,
	format = 'string',
	onSelectionChange,
	onChange,
	__unstableMultilineTag: multilineTag,
	__unstableDisableFormats: disableFormats,
	__unstableInputRule: inputRule,
	__unstableMarkAutomaticChange: markAutomaticChange,
	__unstableAllowPrefixTransformations: allowPrefixTransformations,
	__unstableOnCreateUndoLevel: onCreateUndoLevel,
	__unstableIsSelected: isSelected,
	formatTypes,
	dependencies,
	__unstableAfterParse,
	__unstableBeforeSerialize,
	__unstableAddInvisibleFormats,
} ) {
	const ref = useRef();
	const [ activeFormats = [], setActiveFormats ] = useState();

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

		const result = create( {
			html: string,
			multilineTag,
			multilineWrapperTags:
				multilineTag === 'li' ? [ 'ul', 'ol' ] : undefined,
			preserveWhiteSpace,
		} );

		result.formats = __unstableAfterParse( result );

		return result;
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

		if ( format !== 'string' ) {
			return;
		}

		val.formats = __unstableBeforeSerialize( val );

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
			prepareEditableTree: __unstableAddInvisibleFormats,
			__unstableDomOnly: domOnly,
			placeholder,
		} );
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

		const {
			start,
			end,
			formats,
			text,
			activeFormats: newActiveFormats = [],
		} = newRecord;

		_value.current = valueToFormat( newRecord );
		record.current = newRecord;

		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		onSelectionChange( start, end );
		onChange( _value.current, {
			__unstableFormats: formats,
			__unstableText: text,
		} );
		setActiveFormats( newActiveFormats );

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

	// Value updates must happen synchonously to avoid overwriting newer values.
	useLayoutEffect( () => {
		if ( didMount.current && value !== _value.current ) {
			applyFromProps();
		}
	}, [ value ] );

	// Value updates must happen synchonously to avoid overwriting newer values.
	useLayoutEffect( () => {
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

	const mergedRefs = useMergeRefs( [
		ref,
		useDefaultStyle(),
		useBoundaryStyle( { activeFormats } ),
		useInlineWarning(),
		useCopyHandler( { record, multilineTag, preserveWhiteSpace } ),
		useSelectObject(),
		useFormatBoundaries( { record, applyRecord, setActiveFormats } ),
		useDelete( {
			createRecord,
			handleChange,
			multilineTag,
		} ),
		useIndentListItemOnSpace( {
			multilineTag,
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
			onSelectionChange,
			setActiveFormats,
		} ),
		useRefEffect( () => {
			if ( didMount.current ) {
				applyFromProps();
			} else {
				applyFromProps( { domOnly: true } );
			}

			didMount.current = true;
		}, [ placeholder, ...dependencies ] ),
	] );

	return {
		isSelected,
		value: record.current,
		onChange: handleChange,
		onFocus: focus,
		ref: mergedRefs,
		hasActiveFormats: activeFormats.length,
		children: isSelected && (
			<FormatEdit
				value={ record.current }
				onChange={ handleChange }
				onFocus={ focus }
				formatTypes={ formatTypes }
				forwardedRef={ ref }
			/>
		),
	};
}

export default function __experimentalRichText() {}
