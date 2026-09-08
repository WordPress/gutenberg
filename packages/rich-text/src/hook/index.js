import { useRef, useLayoutEffect, useReducer } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { create, RichTextData } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { removeFormat } from '../remove-format';
import { ownsSelection } from '../owns-selection';
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

	if ( ! recordRef.current ) {
		setRecordFromProps();
	} else if (
		selectionStart !== recordRef.current.start ||
		selectionEnd !== recordRef.current.end
	) {
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
		setRecordFromProps();

		// Only apply the selection when the element has focus, or owns the
		// selection through a focused editing host. Setting a selection into
		// an unfocused editable moves focus through it in some browsers, and
		// the element that had focus would then dispatch its own selection
		// over the one from props (typing in a sidebar input that changes the
		// text, a field mounting next to the one being edited). The focus
		// handler applies the record once focus arrives.
		const hasFocus =
			ref.current?.contains( ref.current.ownerDocument.activeElement ) ||
			ownsSelection( ref.current );

		applyRecord( recordRef.current, { domOnly: ! hasFocus } );
	}

	const didMountRef = useRef( false );

	// Value updates must happen synchronously to avoid overwriting newer values.
	useLayoutEffect( () => {
		if ( didMountRef.current && value !== _valueRef.current ) {
			applyFromProps();
			forceRender();
		}
	}, [ value ] );

	/**
	 * Whether the live selection is inside the element at the given offsets.
	 * Positions are compared rather than DOM ranges: at a format boundary the
	 * browser and the record place the same offset in different text nodes.
	 *
	 * @param {number} start Start offset.
	 * @param {number} end   End offset.
	 *
	 * @return {boolean} Whether the live selection matches.
	 */
	function hasSelection( start, end ) {
		const element = ref.current;
		const selection = element.ownerDocument.defaultView.getSelection();

		if ( ! selection.rangeCount ) {
			return false;
		}

		const range = selection.getRangeAt( 0 );

		if ( ! element.contains( range.commonAncestorContainer ) ) {
			return false;
		}

		const record = create( {
			element,
			range,
			__unstableIsEditableTree: true,
		} );

		return record.start === start && record.end === end;
	}

	// Apply the selection from props unless the element already holds it. A
	// selection the element made itself is left alone: the live range keeps
	// its direction and the side of a format boundary the caret sits on, which
	// the record does not represent. Focus is not managed here: the selection
	// is applied only while the element, or an editing host around it, has
	// focus, since setting a selection into an unfocused editable moves focus
	// in some browsers. The focus handler applies the record once focus
	// arrives.
	useLayoutEffect( () => {
		if ( ! isSelected ) {
			return;
		}

		const { activeElement } = ref.current.ownerDocument;

		if (
			activeElement !== ref.current &&
			! (
				activeElement?.contentEditable === 'true' &&
				activeElement.contains( ref.current )
			)
		) {
			return;
		}

		if ( hasSelection( selectionStart, selectionEnd ) ) {
			return;
		}

		applyRecord( recordRef.current );
	}, [ selectionStart, selectionEnd, isSelected ] );

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
		} ),
		useRefEffect( () => {
			applyFromProps();
			didMountRef.current = true;
		}, [ placeholder, ...__unstableDependencies ] ),
	] );

	return {
		value: recordRef.current,
		// A function to get the most recent value so event handlers in
		// useRichText implementations have access to it. For example when
		// listening to input events, we internally update the state, but this
		// state is not yet available to the input event handler because React
		// may re-render asynchronously.
		getValue: () => recordRef.current,
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
