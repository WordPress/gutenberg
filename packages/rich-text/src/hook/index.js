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

/**
 * Whether a selection may be set into the element: it (or an editing host
 * around it) has focus. Otherwise the focus handler sets the selection once
 * focus arrives.
 *
 * @param {HTMLElement} element The editable element.
 *
 * @return {boolean} Whether the element has focus.
 */
function hasFocus( element ) {
	const { activeElement } = element.ownerDocument;
	return (
		activeElement === element ||
		( activeElement?.contentEditable === 'true' &&
			activeElement.contains( element ) )
	);
}

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

	// The selection the element last sent out, so it can be told apart from
	// one set from outside. Forgotten once compared: the same positions can
	// come back from outside later, after the selection moved elsewhere.
	const sentSelectionRef = useRef( [] );

	function sendSelection( start, end ) {
		sentSelectionRef.current = [ start, end ];
		onSelectionChange( start, end );
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
			sendSelection( start, end );
			onChange( _valueRef.current, {
				__unstableFormats: formats,
				__unstableText: text,
			} );
		} );
		forceRender();
	}

	// Apply a value set from outside.
	useLayoutEffect( () => {
		if ( value === _valueRef.current ) {
			return;
		}

		setRecordFromProps();
		applyRecord( recordRef.current, {
			domOnly: ! hasFocus( ref.current ),
		} );
		forceRender();
	}, [ value ] );

	// Apply a selection set from outside.
	useLayoutEffect( () => {
		const [ sentStart, sentEnd ] = sentSelectionRef.current;
		sentSelectionRef.current = [];

		if (
			isSelected &&
			( selectionStart !== sentStart || selectionEnd !== sentEnd ) &&
			hasFocus( ref.current )
		) {
			applyRecord( recordRef.current );
		}
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
			onSelectionChange: sendSelection,
			forceRender,
		} ),
		useRefEffect(
			( element ) => {
				setRecordFromProps();

				// Setting a selection into an unfocused editable moves focus in
				// some browsers.
				const focused =
					element.contains( element.ownerDocument.activeElement ) ||
					ownsSelection( element );

				applyRecord( recordRef.current, { domOnly: ! focused } );
			},
			[ placeholder, ...__unstableDependencies ]
		),
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
