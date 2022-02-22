/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect, useReducer } from '@wordpress/element';
import { useMergeRefs, useRefEffect } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { create } from '../create';
import { apply } from '../to-dom';
import { toHTMLString } from '../to-html-string';
import { useDefaultStyle } from './use-default-style';
import { useBoundaryStyle } from './use-boundary-style';
import { useCopyHandler } from './use-copy-handler';
import { useFormatBoundaries } from './use-format-boundaries';
import { useSelectObject } from './use-select-object';
import { useIndentListItemOnSpace } from './use-indent-list-item-on-space';
import { useInputAndSelection } from './use-input-and-selection';
import { useDelete } from './use-delete';
import { useSpace } from './use-space';

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

	function setRecordFromProps() {
		_value.current = value;
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
		if ( __unstableAfterParse ) {
			record.current.formats = __unstableAfterParse( record.current );
		}
		record.current.start = selectionStart;
		record.current.end = selectionEnd;
	}

	const hadSelectionUpdate = useRef( false );

	if ( ! record.current ) {
		setRecordFromProps();
		// Sometimes formats are added programmatically and we need to make
		// sure it's persisted to the block store / markup. If these formats
		// are not applied, they could cause inconsistencies between the data
		// in the visual editor and the frontend. Right now, it's only relevant
		// to the `core/text-color` format, which is applied at runtime in
		// certain circunstances. See the `__unstableFilterAttributeValue`
		// function in `packages/format-library/src/text-color/index.js`.
		// @todo find a less-hacky way of solving this.

		const hasRelevantInitFormat =
			record.current?.formats[ 0 ]?.[ 0 ]?.type === 'core/text-color';

		if ( hasRelevantInitFormat ) {
			handleChangesUponInit( record.current );
		}
	} else if (
		selectionStart !== record.current.start ||
		selectionEnd !== record.current.end
	) {
		hadSelectionUpdate.current = isSelected;
		record.current = {
			...record.current,
			start: selectionStart,
			end: selectionEnd,
		};
	}

	/**
	 * Sync the value to global state. The node tree and selection will also be
	 * updated if differences are found.
	 *
	 * @param {Object} newRecord The record to sync and apply.
	 */
	function handleChange( newRecord ) {
		record.current = newRecord;
		applyRecord( newRecord );

		if ( disableFormats ) {
			_value.current = newRecord.text;
		} else {
			_value.current = toHTMLString( {
				value: __unstableBeforeSerialize
					? {
							...newRecord,
							formats: __unstableBeforeSerialize( newRecord ),
					  }
					: newRecord,
				multilineTag,
				preserveWhiteSpace,
			} );
		}

		const { start, end, formats, text } = newRecord;

		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		// We batch both calls to only attempt to rerender once.
		registry.batch( () => {
			onSelectionChange( start, end );
			onChange( _value.current, {
				__unstableFormats: formats,
				__unstableText: text,
			} );
		} );
		forceRender();
	}

	function handleChangesUponInit( newRecord ) {
		record.current = newRecord;

		_value.current = toHTMLString( {
			value: __unstableBeforeSerialize
				? {
						...newRecord,
						formats: __unstableBeforeSerialize( newRecord ),
				  }
				: newRecord,
			multilineTag,
			preserveWhiteSpace,
		} );

		const { formats, text } = newRecord;

		registry.batch( () => {
			onChange( _value.current, {
				__unstableFormats: formats,
				__unstableText: text,
			} );
		} );
		forceRender();
	}

	function applyFromProps() {
		setRecordFromProps();
		applyRecord( record.current );
	}

	const didMount = useRef( false );

	// Value updates must happen synchonously to avoid overwriting newer values.
	useLayoutEffect( () => {
		if ( didMount.current && value !== _value.current ) {
			applyFromProps();
			forceRender();
		}
	}, [ value ] );

	// Value updates must happen synchonously to avoid overwriting newer values.
	useLayoutEffect( () => {
		if ( ! hadSelectionUpdate.current ) {
			return;
		}

		applyFromProps();
		hadSelectionUpdate.current = false;
	}, [ hadSelectionUpdate.current ] );

	const mergedRefs = useMergeRefs( [
		ref,
		useDefaultStyle(),
		useBoundaryStyle( { record } ),
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
		useSpace(),
		useRefEffect( () => {
			applyFromProps();
			didMount.current = true;
		}, [ placeholder, ...__unstableDependencies ] ),
	] );

	return {
		value: record.current,
		onChange: handleChange,
		ref: mergedRefs,
	};
}

export default function __experimentalRichText() {}
