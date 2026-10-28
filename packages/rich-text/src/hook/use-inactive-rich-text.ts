import { useLayoutEffect, useRef } from '@wordpress/element';
import {
	privateApis as composePrivateApis,
	useEvent,
	useMergeRefs,
	useRefEffect,
} from '@wordpress/compose';
import { RichTextData } from '../create';
import { apply } from '../to-dom';
import { subscribeOwnedListener } from '../subscribe-owned-listener';
import { unlock } from '../lock-unlock';
import { useFormatTypes } from './use-format-types';
import selectObject from './event-listeners/select-object';
import selectionChangeCompat from './event-listeners/selection-change-compat';
import type { RichTextRecord } from './types';

const { subscribeDelegatedListener } = unlock( composePrivateApis );

/**
 * Events that act on the selection, which `useRichText` synchronizes the
 * selection on before they are handled. See `input-and-selection`.
 */
const SELECTION_EVENT_TYPES = [
	'keydown',
	'beforeinput',
	'copy',
	'cut',
	'paste',
];

export type InactiveRichTextProps = {
	value?: string | RichTextData;
	placeholder?: string;
	allowedFormats?: readonly string[];
	withoutInteractiveFormatting?: boolean;
	__unstableDisableFormats?: boolean;
	__unstableDependencies?: unknown[];
	__unstableFormatTypeHandlerContext?: object;
	/**
	 * Whether `useRichText` edits the element instead, in which case this hook
	 * leaves the element alone.
	 */
	isActive: boolean;
	/**
	 * Called when the element should be edited with `useRichText`: when it
	 * receives focus, when it owns the selection, or when an event acting on
	 * the selection reaches it.
	 */
	onActivate: ( event: Event, element: HTMLElement ) => void;
};

/**
 * Renders a rich text value in an editable element, as `useRichText` does,
 * without the machinery to edit it. Most fields of a document are not being
 * edited, so they can render with this hook, and only the field being edited
 * mounts `useRichText`, on the same element, once `onActivate` is called.
 *
 * @param props                                    Hook props.
 * @param props.value
 * @param props.placeholder
 * @param props.allowedFormats
 * @param props.withoutInteractiveFormatting
 * @param props.__unstableDisableFormats
 * @param props.__unstableDependencies
 * @param props.__unstableFormatTypeHandlerContext
 * @param props.isActive
 * @param props.onActivate
 * @return Ref to attach to the editable element.
 */
export function useInactiveRichText( {
	value = '',
	placeholder,
	allowedFormats,
	withoutInteractiveFormatting,
	__unstableDisableFormats: disableFormats,
	__unstableDependencies = [],
	__unstableFormatTypeHandlerContext,
	isActive,
	onActivate,
}: InactiveRichTextProps ) {
	const { prepareHandlers, valueHandlers, dependencies } = useFormatTypes( {
		allowedFormats,
		withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext,
	} );
	const elementRef = useRef< HTMLElement | null >( null );
	const activate = useEvent( onActivate );

	/**
	 * Applies the value to the element, as `useRichText` does for an element
	 * without focus.
	 *
	 * @param element The element.
	 */
	function applyValue( element: HTMLElement ) {
		let parsed = value;
		if ( ! ( parsed instanceof RichTextData ) ) {
			parsed = parsed
				? RichTextData.fromHTMLString( parsed )
				: RichTextData.empty();
		}
		const record: RichTextRecord = {
			text: parsed.text,
			formats: parsed.formats,
			replacements: parsed.replacements,
		};
		if ( disableFormats ) {
			record.formats = Array( value.length );
			record.replacements = Array( value.length );
		}
		record.formats = valueHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, record.text ),
			record.formats
		);
		apply( {
			value: record,
			current: element,
			prepareEditableTree: ( preparedRecord: RichTextRecord ) =>
				prepareHandlers.reduce(
					( accumulator, fn ) =>
						fn( accumulator, preparedRecord.text ),
					preparedRecord.formats
				),
			__unstableDomOnly: true,
			placeholder,
		} );
	}

	// Apply a value set from outside.
	useLayoutEffect( () => {
		if ( isActive || ! elementRef.current ) {
			return;
		}
		applyValue( elementRef.current );
		// Applied on mount by the ref below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ value ] );

	// Subscribed once, as `useRichText`'s listener is, so it keeps its place
	// before other `focusin` listeners of the element, such as the block's,
	// which would otherwise select the block first. Not on capture: the active
	// field mounts once the event is handled, and must not handle it again.
	const onFocus = useEvent( ( event: Event, element: HTMLElement ) => {
		// Only when focus lands on the element, and it is editable.
		if (
			! isActive &&
			event.target === element &&
			element.contentEditable === 'true'
		) {
			activate( event, element );
		}
	} );
	const focusRef = useRefEffect( ( element: HTMLElement ) => {
		return subscribeDelegatedListener(
			element,
			'focusin',
			( event: Event ) => onFocus( event, element )
		);
	}, [] );

	const ref = useRefEffect(
		( element: HTMLElement ) => {
			elementRef.current = element;
			// As `useDefaultStyle` does.
			element.style.whiteSpace = element.style.whiteSpace || 'pre-wrap';

			if ( isActive ) {
				return () => {
					elementRef.current = null;
				};
			}

			applyValue( element );

			function onSelectionEvent( event: Event ) {
				// The owned listeners only call this when the element owns
				// the selection.
				if ( element.contentEditable === 'true' ) {
					activate( event, element );
				}
			}

			const unsubscribers = [
				// Listeners of `useRichText` that act on fields not being
				// edited.
				selectObject()( element ),
				selectionChangeCompat()( element ),
				// First, as `useRichText`'s selection synchronization: other
				// listeners of the element may read the selection.
				subscribeOwnedListener(
					element,
					'selectionchange',
					onSelectionEvent,
					false,
					true
				),
				...SELECTION_EVENT_TYPES.map( ( eventType ) =>
					subscribeOwnedListener(
						element,
						eventType,
						onSelectionEvent,
						true,
						true
					)
				),
			];

			return () => {
				elementRef.current = null;
				unsubscribers.forEach( ( unsubscribe ) => unsubscribe() );
			};
		},
		[ isActive, placeholder, ...dependencies, ...__unstableDependencies ]
	);

	return useMergeRefs( [ focusRef, ref ] );
}
