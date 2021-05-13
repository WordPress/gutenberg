/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useReducer } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { create } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { useDefaultStyle } from './use-default-style';
import { useBoundaryStyle } from './use-boundary-style';
import { useInlineWarning } from './use-inline-warning';
import { useCopyHandler } from './use-copy-handler';
import { useFormatBoundaries } from './use-format-boundaries';
import { useSelectObject } from './use-select-object';
import { useIndentListItemOnSpace } from './use-indent-list-item-on-space';
import { useInputAndSelection } from './use-input-and-selection';
import { useDelete } from './use-delete';

export function useRichText( {
	value = '',
	selectionStart,
	selectionEnd,
	placeholder,
	preserveWhiteSpace,
	onSelectionChange,
	onChange,
	__unstableMultilineTag: multilineTag,
	__unstableDisableFormats: disableFormats,
	__unstableIsSelected: isSelected,
	__unstableDependencies,
	__unstableAfterParse,
	__unstableBeforeSerialize,
	__unstableAddInvisibleFormats,
} ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );
	const ref = useRef();

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
	const _value = useRef();
	const record = useRef();
	const didMount = !! record.current;
	const hasContentChanged = value !== _value.current;
	const hasSelectionChanged =
		selectionStart !== record.current.start ||
		selectionEnd !== record.current.end;

	if ( hasContentChanged ) {
		record.current = create( {
			html: value,
			multilineTag,
			multilineWrapperTags:
				multilineTag === 'li' ? [ 'ul', 'ol' ] : undefined,
			preserveWhiteSpace,
		} );
		if ( disableFormats ) {
			record.current.formats = Array( value.length );
			record.current.replacements = Array( value.length );
		}
		record.current.formats = __unstableAfterParse( record.current );
	}

	record.current.start = selectionStart;
	record.current.end = selectionEnd;
	_value.current = value;

	/**
	 * Sync the value to global state. The node tree and selection will also be
	 * updated if differences are found.
	 *
	 * @param {Object} newRecord The record to sync and apply.
	 */
	function handleChange( newRecord ) {
		applyRecord( newRecord );

		if ( disableFormats ) {
			_value.current = newRecord.text;
		} else {
			_value.current = toHTMLString( {
				value: {
					...newRecord,
					formats: __unstableBeforeSerialize( newRecord ),
				},
				multilineTag,
				preserveWhiteSpace,
			} );
		}

		record.current = newRecord;

		const { start, end, formats, text } = newRecord;

		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		onSelectionChange( start, end );
		onChange( _value.current, {
			__unstableFormats: formats,
			__unstableText: text,
		} );
		forceRender();
	}

	// Should have no dependecies, because e.g. hasSelectionChanged could remain
	// the same, yet need to be applied.
	useLayoutEffect( () => {
		if (
			didMount &&
			( hasContentChanged || ( hasSelectionChanged && isSelected ) )
		) {
			applyRecord( record.current );
		}
	} );

	function focus() {
		ref.current.focus();
		applyRecord( record.current );
	}

	const mergedRefs = useMergeRefs( [
		ref,
		useDefaultStyle(),
		useBoundaryStyle( { record } ),
		useInlineWarning(),
		useCopyHandler( { record, multilineTag, preserveWhiteSpace } ),
		useSelectObject(),
		useFormatBoundaries( { record, applyRecord } ),
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
		useInputAndSelection( {
			record,
			applyRecord,
			createRecord,
			handleChange,
			isSelected,
			onSelectionChange,
		} ),
		useRefEffect( () => {
			applyRecord( record.current );
			didMount.current = true;
		}, [ placeholder, ...__unstableDependencies ] ),
	] );

	return {
		value: record.current,
		onChange: handleChange,
		onFocus: focus,
		ref: mergedRefs,
	};
}

export default function __experimentalRichText() {}
