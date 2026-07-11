/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useReducer } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { create, RichTextData } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { removeFormat } from '../remove-format';
import { getActiveFormats } from '../get-active-formats';
import { useDefaultStyle } from './use-default-style';
import { useBoundaryStyle } from './use-boundary-style';
import { useEventListeners } from './event-listeners';
import { useFormatTypes } from './use-format-types';

function useRichTextBase( {
	value = '',
	selectionStart,
	selectionEnd,
	placeholder,
	onSelectionChange,
	preserveWhiteSpace,
	onChange,
	__unstableDisableFormats: disableFormats,
	__unstableIsSelected: isSelected,
	__unstableDependencies = [],
	__unstableAfterParse,
	__unstableBeforeSerialize,
	__unstableAddInvisibleFormats,
} ) {
	const registry = useRegistry();
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
			__unstableIsEditableTree: true,
		} );
	}

	function applyRecord( newRecord, { domOnly } = {} ) {
		apply( {
			value: newRecord,
			current: ref.current,
			prepareEditableTree: __unstableAddInvisibleFormats,
			__unstableDomOnly: domOnly,
			placeholder,
		} );
	}

	// Internal values are updated synchronously, unlike props and state.
	const _valueRef = useRef( value );
	const recordRef = useRef();

	// Caches the value derived by `getValue`, keyed by the DOM selection and
	// the record it was derived from. Any record change creates a new record
	// object, so the record reference doubles as the cache invalidation for
	// everything but the DOM selection itself.
	const derivedValueCacheRef = useRef( {} );
	// The value as of right before an input: set by a `beforeinput` listener
	// and consumed by input handling, which computes the changed range from
	// the offsets before the input, so they cannot be read after the fact.
	const preInputValueRef = useRef();
	// Owned by the input event listeners; read here so no selection is read
	// while the user is composing text.
	const isComposingRef = useRef( false );

	/**
	 * Returns the current value: the record, with its selection derived from
	 * the DOM selection when the element owns it. The native
	 * `selectionchange` event is asynchronous and coalesced, so the record's
	 * offsets may be behind the DOM selection when read; the fresh offsets
	 * are derived on demand instead. The record itself is not modified:
	 * record and store synchronization stays on the `selectionchange` event
	 * and on value changes, as before.
	 */
	function getValue() {
		const element = ref.current;
		const record = recordRef.current;

		if ( ! element || isComposingRef.current ) {
			return record;
		}

		if (
			element.contentEditable !== 'true' ||
			element.ownerDocument.activeElement !== element
		) {
			return record;
		}

		const { anchorNode, anchorOffset, focusNode, focusOffset } =
			element.ownerDocument.defaultView.getSelection();
		const cache = derivedValueCacheRef.current;

		if (
			cache.record === record &&
			cache.anchorNode === anchorNode &&
			cache.anchorOffset === anchorOffset &&
			cache.focusNode === focusNode &&
			cache.focusOffset === focusOffset
		) {
			return cache.value;
		}

		const { start, end, text } = createRecord();
		let derivedValue = record;

		// A text mismatch is reconciled by input handling; equal offsets
		// need no derivation.
		if (
			text === record.text &&
			( start !== record.start || end !== record.end )
		) {
			derivedValue = {
				...record,
				start,
				end,
				// _newActiveFormats may be set on arrow key navigation to
				// control the right boundary position. If undefined,
				// getActiveFormats will give the active formats according to
				// the browser.
				activeFormats: record._newActiveFormats,
				_newActiveFormats: undefined,
			};
			derivedValue.activeFormats = getActiveFormats( derivedValue, [] );
		}

		derivedValueCacheRef.current = {
			record,
			anchorNode,
			anchorOffset,
			focusNode,
			focusOffset,
			value: derivedValue,
		};

		return derivedValue;
	}

	function setRecordFromProps() {
		const activeFormats = recordRef.current?.activeFormats;
		_valueRef.current = value;
		recordRef.current = value;
		if ( ! ( value instanceof RichTextData ) ) {
			recordRef.current = value
				? RichTextData.fromHTMLString( value, { preserveWhiteSpace } )
				: RichTextData.empty();
		}
		// To do: make rich text internally work with RichTextData.
		recordRef.current = {
			text: recordRef.current.text,
			formats: recordRef.current.formats,
			replacements: recordRef.current.replacements,
			activeFormats,
		};
		if ( disableFormats ) {
			recordRef.current.formats = Array( value.length );
			recordRef.current.replacements = Array( value.length );
		}
		if ( __unstableAfterParse ) {
			recordRef.current.formats = __unstableAfterParse(
				recordRef.current
			);
		}
		recordRef.current.start = selectionStart;
		recordRef.current.end = selectionEnd;
	}

	const hadSelectionUpdateRef = useRef( false );

	if ( ! recordRef.current ) {
		hadSelectionUpdateRef.current = isSelected;
		setRecordFromProps();
	} else if (
		selectionStart !== recordRef.current.start ||
		selectionEnd !== recordRef.current.end
	) {
		hadSelectionUpdateRef.current = isSelected;
		recordRef.current = {
			...recordRef.current,
			start: selectionStart,
			end: selectionEnd,
			activeFormats: undefined,
		};
	}

	/**
	 * Sync the value to global state. The node tree and selection will also be
	 * updated if differences are found.
	 *
	 * @param {Object} newRecord The record to sync and apply.
	 */
	function handleChange( newRecord ) {
		recordRef.current = newRecord;
		applyRecord( newRecord );

		if ( disableFormats ) {
			_valueRef.current = newRecord.text;
		} else {
			const newFormats = __unstableBeforeSerialize
				? __unstableBeforeSerialize( newRecord )
				: newRecord.formats;
			newRecord = { ...newRecord, formats: newFormats };
			if ( typeof value === 'string' ) {
				_valueRef.current = toHTMLString( {
					value: newRecord,
					preserveWhiteSpace,
				} );
			} else {
				_valueRef.current = new RichTextData( newRecord );
			}
		}

		const { start, end, formats, text } = recordRef.current;

		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		// We batch both calls to only attempt to rerender once.
		registry.batch( () => {
			onSelectionChange( start, end );
			onChange( _valueRef.current, {
				__unstableFormats: formats,
				__unstableText: text,
			} );
		} );
		forceRender();
	}

	function applyFromProps() {
		// Get previous value before updating
		const previousValue = _valueRef.current;

		setRecordFromProps();

		// Check if content length changed (text was added/removed, not just formatted)
		const contentLengthChanged =
			previousValue &&
			typeof previousValue === 'string' &&
			typeof value === 'string' &&
			previousValue.length !== value.length;

		// Check if focus is on this element
		const hasFocus = ref.current?.contains(
			ref.current.ownerDocument.activeElement
		);

		// Skip re-applying the selection state when content changed from external source
		// (e.g., typing in sidebar input changes canvas text)
		const skipSelection = contentLengthChanged && ! hasFocus;

		applyRecord( recordRef.current, { domOnly: skipSelection } );
	}

	const didMountRef = useRef( false );

	// Value updates must happen synchronously to avoid overwriting newer values.
	useLayoutEffect( () => {
		if ( didMountRef.current && value !== _valueRef.current ) {
			applyFromProps();
			forceRender();
		}
	}, [ value ] );

	// Value updates must happen synchronously to avoid overwriting newer values.
	useLayoutEffect( () => {
		if ( ! hadSelectionUpdateRef.current ) {
			return;
		}

		if ( ref.current.ownerDocument.activeElement !== ref.current ) {
			ref.current.focus();
		}

		applyRecord( recordRef.current );
		hadSelectionUpdateRef.current = false;
	}, [ hadSelectionUpdateRef.current ] );

	const mergedRefs = useMergeRefs( [
		ref,
		useDefaultStyle(),
		useBoundaryStyle( { record: recordRef } ),
		useEventListeners( {
			record: recordRef,
			handleChange,
			applyRecord,
			createRecord,
			isSelected,
			onSelectionChange,
			forceRender,
			getValue,
			preInputValueRef,
			isComposingRef,
		} ),
		useRefEffect( () => {
			applyFromProps();
			didMountRef.current = true;
		}, [ placeholder, ...__unstableDependencies ] ),
	] );

	return {
		value: recordRef.current,
		// A function to get the current value, so event handlers in
		// useRichText implementations have access to it. The value rendered
		// by React may be behind: internal updates happen synchronously while
		// React re-renders asynchronously, and the record's selection is only
		// as recent as the last (asynchronous) `selectionchange` event, so
		// the selection is derived from the DOM on every call.
		getValue,
		onChange: handleChange,
		ref: mergedRefs,
	};
}

export function useRichText( {
	allowedFormats,
	withoutInteractiveFormatting,
	onChange,
	__unstableDependencies = [],
	__unstableFormatTypeHandlerContext,
	...props
} ) {
	const {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	} = useFormatTypes( {
		allowedFormats,
		withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext,
	} );

	function addEditorOnlyFormats( record ) {
		return valueHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, record.text ),
			record.formats
		);
	}

	function removeEditorOnlyFormats( record ) {
		formatTypes.forEach( ( formatType ) => {
			if ( formatType.__experimentalCreatePrepareEditableTree ) {
				record = removeFormat(
					record,
					formatType.name,
					0,
					record.text.length
				);
			}
		} );
		return record.formats;
	}

	function addInvisibleFormats( record ) {
		return prepareHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, record.text ),
			record.formats
		);
	}

	const result = useRichTextBase( {
		...props,
		onChange( value, { __unstableFormats, __unstableText } ) {
			onChange( value, { __unstableFormats, __unstableText } );
			Object.values( changeHandlers ).forEach( ( changeHandler ) => {
				changeHandler( __unstableFormats, __unstableText );
			} );
		},
		__unstableDependencies: [ ...dependencies, ...__unstableDependencies ],
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );

	return { ...result, formatTypes };
}

export function useDeprecatedRichText( props ) {
	deprecated( '`__unstableUseRichText` hook', {
		since: '7.0',
	} );
	return useRichTextBase( props );
}
