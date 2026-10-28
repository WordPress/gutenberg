import clsx from 'clsx';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import {
	useRef,
	useState,
	useCallback,
	useEffect,
	useLayoutEffect,
	useInsertionEffect,
	useMemo,
	forwardRef,
	useContext,
	flushSync,
} from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import {
	privateApis as composePrivateApis,
	useMergeRefs,
	useInstanceId,
	useRefEffect,
} from '@wordpress/compose';
import {
	privateApis as richTextPrivateApis,
	create,
	RichTextData,
} from '@wordpress/rich-text';
import { Popover } from '@wordpress/components';
import type { DistributiveOmit } from '@wordpress/components';
import { getBlockBindingsSource } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import type {
	ComponentType,
	ForwardedRef,
	ReactElement,
	RefAttributes,
} from 'react';
import type { SelectFunction } from '@wordpress/data';
import { useBlockEditorAutocomplete } from '../autocomplete';
import { useBlockEditContext } from '../block-edit';
import {
	blockBindingsKey,
	blockEditingModeKey,
	isPreviewModeKey,
	isMultiSelectedKey,
} from '../block-edit/context';
import FormatToolbarContainer from './format-toolbar-container';
import { store as blockEditorStore } from '../../store';
import { useMarkPersistent } from './use-mark-persistent';
import { useEventListeners } from './event-listeners';
import FormatEdit from './format-edit';
import {
	setFieldFormatSettings,
	deleteFieldFormatSettings,
} from './field-format-settings';
import { getAllowedFormats, isEmpty } from './utils';
import { Content, valueToHTMLString } from './content';
import { withDeprecations } from './with-deprecations';
import BlockContext from '../block-context';
import { unlock } from '../../lock-unlock';
import { PrivateBlockContext } from '../block-list/private-block-context';
import type { BlockSelection, Selection } from '../../store/types';
import type {
	RichTextBinding,
	RichTextEventListenerProps,
	RichTextFieldValue,
	RichTextInputEventProps,
	RichTextProps,
	RichTextShortcutProps,
} from './types';

// `RichTextShortcut` and `RichTextInputEvent` now live in
// `@wordpress/rich-text` so they share the shortcut and input-event contexts
// with standalone rich text fields. Re-exported below for back-compat (e.g.
// `@wordpress/format-library` imports them from `@wordpress/block-editor`).
const {
	useRichText,
	useInactiveRichText,
	getDomPositionKey,
	KeyboardShortcutContext,
	InputEventContext,
	RichTextShortcut: UntypedRichTextShortcut,
	RichTextInputEvent: UntypedRichTextInputEvent,
} = unlock( richTextPrivateApis );

// The private APIs are untyped, so type the components this re-exports.
const RichTextShortcut =
	UntypedRichTextShortcut as ComponentType< RichTextShortcutProps >;
const RichTextInputEvent =
	UntypedRichTextInputEvent as ComponentType< RichTextInputEventProps >;

const { subscribeDelegatedListener } = unlock( composePrivateApis );

const instanceIdKey = Symbol( 'instanceId' );

type ActiveRichTextProps = Pick<
	RichTextProps,
	| 'children'
	| 'inlineToolbar'
	| 'autocompleters'
	| 'onReplace'
	| 'onRemove'
	| 'onMerge'
	| 'onSplit'
	| 'preserveWhiteSpace'
	| 'disableLineBreaks'
	| 'withoutInteractiveFormatting'
	| '__unstableAllowPrefixTransformations'
	| '__unstableEmbedURLOnPaste'
> & {
	elementRef: { current: HTMLElement | null };
	tagName: NonNullable< RichTextProps[ 'tagName' ] >;
	value: NonNullable< RichTextProps[ 'value' ] >;
	onChange: RichTextProps[ 'onChange' ];
	isSelected?: boolean;
	selectionStart?: number;
	selectionEnd?: number;
	crossBlockStart?: number;
	crossBlockEnd?: number;
	onSelectionChange: ( start?: number, end?: number ) => void;
	placeholder?: string;
	allowedFormats?: readonly string[];
	hasFormats: boolean;
	disableFormats?: boolean;
	formatTypeHandlerContext: object;
	onSplitAtEnd: RichTextProps[ '__unstableOnSplitAtEnd' ];
	onSplitAtDoubleLineEnd: RichTextProps[ '__unstableOnSplitAtDoubleLineEnd' ];
	pastePlainText: RichTextProps[ '__unstablePastePlainText' ];
	supportsSplitting?: boolean;
	flushMarkPersistentRef: { current?: () => void };
	onTextDrag: ( isDragging: boolean ) => void;
};

/**
 * Edits a field: the rich text value, the selection, input, keyboard
 * shortcuts, formats and completions. Rendered while the field is being
 * edited, and attached to the field, which `RichTextWrapper` renders.
 */
function ActiveRichText( {
	elementRef,
	children,
	tagName,
	value: adjustedValue,
	onChange: adjustedOnChange,
	isSelected,
	selectionStart,
	selectionEnd,
	crossBlockStart,
	crossBlockEnd,
	onSelectionChange,
	inlineToolbar,
	autocompleters,
	onReplace,
	placeholder,
	allowedFormats,
	hasFormats,
	withoutInteractiveFormatting,
	onRemove,
	onMerge,
	onSplit,
	onSplitAtEnd,
	onSplitAtDoubleLineEnd,
	preserveWhiteSpace,
	pastePlainText,
	__unstableEmbedURLOnPaste,
	disableFormats,
	disableLineBreaks,
	__unstableAllowPrefixTransformations,
	formatTypeHandlerContext,
	supportsSplitting,
	flushMarkPersistentRef,
	onTextDrag,
}: ActiveRichTextProps ) {
	const registry = useRegistry();
	const { selectionChange, __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );
	// The field, once attached, to render with.
	const [ attachedElement, setAttachedElement ] =
		useState< HTMLElement | null >( null );
	const attachRef =
		useRef< ( node: HTMLElement | null ) => void >( undefined );

	// Attach to the field, as a ref on it would, in the commit that renders
	// it (the field renders before), and before `useRichText`'s layout
	// effects, which use it.
	useLayoutEffect( () => {
		const node = elementRef.current;
		attachRef.current!( node );
		setAttachedElement( node );
		return () => {
			attachRef.current!( null );
		};
	}, [ elementRef ] );

	const {
		value,
		getValue,
		onChange,
		ref: richTextRef,
		formatTypes,
		[ getDomPositionKey ]: getDomPosition,
	} = useRichText( {
		value: adjustedValue,
		onChange: adjustedOnChange,
		selectionStart,
		selectionEnd,
		onSelectionChange,
		placeholder,
		__unstableIsSelected: isSelected,
		__unstableDisableFormats: disableFormats,
		preserveWhiteSpace,
		__unstableDependencies: [ tagName ],
		allowedFormats,
		withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext: formatTypeHandlerContext,
	} );

	const [ keyboardShortcuts ] = useState(
		() => new Set< ( event: KeyboardEvent ) => void >()
	);
	const [ inputEvents ] = useState(
		() => new Set< ( event: InputEvent ) => void >()
	);

	const ref = useMergeRefs( [
		// Rich text ref must be first because its focus listener must be set
		// up before any other ref calls .focus() on mount.
		richTextRef,
		useEventListeners( {
			registry,
			getValue,
			onChange,
			__unstableAllowPrefixTransformations,
			formatTypes,
			onReplace,
			// The action also takes no arguments.
			selectionChange:
				selectionChange as RichTextEventListenerProps[ 'selectionChange' ],
			isSelected,
			disableFormats,
			value,
			tagName,
			onSplit,
			__unstableEmbedURLOnPaste,
			pastePlainText,
			onMerge,
			onRemove,
			disableLineBreaks,
			onSplitAtEnd,
			onSplitAtDoubleLineEnd,
			keyboardShortcuts,
			inputEvents,
			supportsSplitting,
			onTextDrag,
		} ),
	] );

	useInsertionEffect( () => {
		attachRef.current = ref;
	} );

	// Focus follows the selection while focus is inside the canvas or was
	// lost to the body. Focus placed elsewhere stays. Runs after
	// `useRichText` applied the content, so the field is current when its
	// focus handler applies the selection.
	useLayoutEffect( () => {
		const element = elementRef.current;
		// A pointer press outside the field makes it non editable until the
		// release (see usePreventFocusCapture). Focusing it then
		// makes the block focus handler drop the text selection.
		if ( ! isSelected || element?.contentEditable !== 'true' ) {
			return;
		}

		const { ownerDocument } = element;
		// Focus lost to the body of the parent document (a removed toolbar
		// button) leaves the frame document without focus.
		const focusedDocument = [
			ownerDocument,
			// The field's document has a window.
			ownerDocument.defaultView!.frameElement?.ownerDocument,
		].find( ( doc ) => doc?.hasFocus() );

		if ( ! focusedDocument ) {
			return;
		}

		const { activeElement, body } = focusedDocument;
		const canvas =
			element.parentElement?.closest< HTMLElement >(
				'[contenteditable]'
			);
		// A field inside an editing host cannot hold focus.
		const target = canvas?.isContentEditable ? canvas : element;

		if ( activeElement === body || canvas?.contains( activeElement ) ) {
			target.focus();
		}
	}, [ selectionStart, selectionEnd, isSelected, elementRef ] );

	// One end of a text selection across blocks is in this field: put that
	// end of the native selection back after rendering, as a field does for
	// a selection within it. The field at the other end does the same.
	useLayoutEffect( () => {
		const element = elementRef.current;
		if (
			( crossBlockStart === undefined && crossBlockEnd === undefined ) ||
			! element
		) {
			return;
		}
		const { ownerDocument } = element;
		if (
			( ownerDocument.activeElement as HTMLElement | null )
				?.contentEditable !== 'true'
		) {
			return;
		}
		// The field's document has a window, which has a selection.
		const selection = ownerDocument.defaultView!.getSelection()!;
		if ( ! selection.rangeCount ) {
			return;
		}
		if ( crossBlockStart !== undefined ) {
			const { node, offset } = getDomPosition( crossBlockStart );
			if (
				selection.anchorNode !== node ||
				selection.anchorOffset !== offset
			) {
				selection.setBaseAndExtent(
					node,
					offset,
					// A selection with a range has a focus node.
					selection.focusNode!,
					selection.focusOffset
				);
			}
		} else {
			const { node, offset } = getDomPosition( crossBlockEnd );
			if (
				selection.focusNode !== node ||
				selection.focusOffset !== offset
			) {
				selection.extend( node, offset );
			}
		}
	}, [ crossBlockStart, crossBlockEnd, value, getDomPosition, elementRef ] );

	const popover = useBlockEditorAutocomplete( {
		element: attachedElement,
		// @ts-expect-error TODO: `onReplace` may be missing, and patterns replace with a block array.
		onReplace,
		completers: autocompleters,
		record: value,
		onChange,
	} );

	const markPersistentDebounced = useMarkPersistent( {
		html: adjustedValue,
		value,
		onMarkPersistent: __unstableMarkLastChangeAsPersistent,
	} );

	// Lets the field mark the last change, still pending after typing, as
	// persistent when it stops being edited.
	useLayoutEffect( () => {
		flushMarkPersistentRef.current = () => markPersistentDebounced.flush();
		return () => {
			flushMarkPersistentRef.current = undefined;
		};
	}, [ flushMarkPersistentRef, markPersistentDebounced ] );

	const formatEditRef = useMemo(
		() => ( { current: attachedElement } ),
		[ attachedElement ]
	);

	function onFocus() {
		attachedElement?.focus();
	}

	return (
		<>
			{ isSelected && (
				<KeyboardShortcutContext.Provider value={ keyboardShortcuts }>
					<InputEventContext.Provider value={ inputEvents }>
						<Popover.__unstableSlotNameProvider value="__unstable-block-tools-after">
							{ children &&
								children( { value, onChange, onFocus } ) }

							<FormatEdit
								value={ value }
								onChange={ onChange }
								onFocus={ onFocus }
								formatTypes={ formatTypes }
								forwardedRef={ formatEditRef }
							/>
						</Popover.__unstableSlotNameProvider>
					</InputEventContext.Provider>
				</KeyboardShortcutContext.Provider>
			) }
			{ isSelected && hasFormats && (
				<FormatToolbarContainer
					inline={ inlineToolbar }
					editableContentElement={ attachedElement }
				/>
			) }
			{ popover }
		</>
	);
}

function RichTextWrapper(
	{
		children,
		tagName = 'div',
		value: adjustedValue = '',
		onChange: adjustedOnChange,
		isSelected: originalIsSelected,
		multiline,
		inlineToolbar,
		wrapperClassName,
		autocompleters,
		onReplace,
		placeholder,
		allowedFormats,
		withoutInteractiveFormatting,
		onRemove,
		onMerge,
		onSplit,
		__unstableOnSplitAtEnd: onSplitAtEnd,
		__unstableOnSplitAtDoubleLineEnd: onSplitAtDoubleLineEnd,
		identifier,
		preserveWhiteSpace,
		__unstablePastePlainText: pastePlainText,
		__unstableEmbedURLOnPaste,
		__unstableDisableFormats: disableFormats,
		disableLineBreaks,
		__unstableAllowPrefixTransformations,
		readOnly,
		...props
	}: RichTextProps,
	forwardedRef: ForwardedRef< HTMLElement >
) {
	const { supportsSplitting } = useContext( PrivateBlockContext );
	const instanceId = useInstanceId( RichTextWrapper );
	const elementRef = useRef< HTMLElement | null >( null );
	// Whether something is dragged over the field, which may be dropped in it.
	const [ isDraggedOver, setIsDraggedOver ] = useState( false );
	// Whether text dragged from the field may still be dropped, which removes
	// it from the field.
	const [ isTextDragSource, setIsTextDragSource ] = useState( false );
	const flushMarkPersistentRef = useRef< () => void >( undefined );
	const context = useBlockEditContext();
	const { isSelected: isBlockSelected, name: blockName } = context;
	// Outside a block, the store matches the undefined client ID to nothing.
	const clientId = context.clientId as string;
	const isBlockMultiSelected = context[ isMultiSelectedKey ];
	// Bindings map attribute keys to their source and arguments.
	const blockBindings = context[ blockBindingsKey ] as
		Record< string, RichTextBinding > | null | undefined;
	const hasDefaultEditingMode = context[ blockEditingModeKey ] === 'default';
	const blockContext = useContext( BlockContext );
	const hasValue = adjustedValue.length > 0;
	const isInsidePatternOverrides = !! blockContext?.[ 'pattern/overrides' ];
	const hasOverrideEnabled =
		blockBindings?.__default?.source === 'core/pattern-overrides';

	const shouldDisableForPattern =
		isInsidePatternOverrides && ! hasOverrideEnabled;

	const selectField = ( select: SelectFunction ) => {
		const selectSelection = () => {
			// Avoid subscribing to the block editor store if the block is not
			// selected, alone or with others.
			if ( ! isBlockSelected && ! isBlockMultiSelected ) {
				return { isSelected: false };
			}

			const { getSelectionStart, getSelectionEnd } =
				select( blockEditorStore );
			const selectionStart = getSelectionStart();
			const selectionEnd = getSelectionEnd();
			const isInField = ( end: BlockSelection ) =>
				end.clientId === clientId &&
				( identifier
					? end.attributeKey === identifier
					: // The field's own selection carries its instance ID.
						( end as Record< symbol, unknown > )[
							instanceIdKey
						] === instanceId );

			let isSelected: boolean | undefined;

			if ( originalIsSelected === undefined ) {
				isSelected =
					isInField( selectionStart ) &&
					selectionEnd.clientId === clientId;
			} else if ( originalIsSelected ) {
				isSelected = selectionStart.clientId === clientId;
			}

			// The selection spans blocks, so the field may hold one end of it.
			const isCrossBlockEnd =
				! isSelected &&
				selectionStart.clientId !== selectionEnd.clientId;

			return {
				selectionStart: isSelected ? selectionStart.offset : undefined,
				selectionEnd: isSelected ? selectionEnd.offset : undefined,
				isSelected,
				crossBlockStart:
					isCrossBlockEnd && isInField( selectionStart )
						? selectionStart.offset
						: undefined,
				crossBlockEnd:
					isCrossBlockEnd && isInField( selectionEnd )
						? selectionEnd.offset
						: undefined,
			};
		};
		const selectBindings = () => {
			// A field without an identifier matches no binding.
			if ( ! blockBindings?.[ identifier as string ] ) {
				return {};
			}

			const { __experimentalBlockBindingsSupportedAttributes } =
				select( blockEditorStore ).getSettings();

			// The setting maps block names to their bindable attributes.
			const bindableAttributes = (
				__experimentalBlockBindingsSupportedAttributes as
					Record< string, string[] > | undefined
			 )?.[ blockName ];

			if ( ! bindableAttributes ) {
				return {};
			}

			// Matched a binding above.
			const relatedBinding = blockBindings[ identifier! ];
			const blockBindingsSource = getBlockBindingsSource(
				relatedBinding.source
			);
			const blockBindingsContext: Record< string, unknown > = {};
			if ( blockBindingsSource?.usesContext?.length ) {
				for ( const key of blockBindingsSource.usesContext ) {
					blockBindingsContext[ key ] = blockContext[ key ];
				}
			}

			const _disableBoundBlock =
				! blockBindingsSource?.canUserEditValue?.( {
					select,
					context: blockBindingsContext,
					args: relatedBinding.args,
				} );

			// Don't modify placeholders if value is not empty.
			if ( hasValue ) {
				return {
					disableBoundBlock: _disableBoundBlock,
					// Null values will make them fall back to the default behavior.
					bindingsPlaceholder: null,
					bindingsLabel: null,
				};
			}

			const { getBlockAttributes } = select( blockEditorStore );
			const blockAttributes = getBlockAttributes( clientId );
			let clientSideFieldLabel: string | null | undefined = null;
			if ( blockBindingsSource?.getFieldsList ) {
				// Sources return a list of fields.
				const fieldsItems = blockBindingsSource.getFieldsList( {
					select,
					context: blockBindingsContext,
				} ) as Array< { args?: unknown; label?: string } > | undefined;
				clientSideFieldLabel = fieldsItems?.find( ( item ) =>
					fastDeepEqual( item.args, relatedBinding?.args )
				)?.label;
			}

			const bindingKey =
				clientSideFieldLabel ?? blockBindingsSource?.label;

			const _bindingsPlaceholder = _disableBoundBlock
				? bindingKey
				: sprintf(
						/* translators: %s: connected field label or source label */
						__( 'Add %s' ),
						// Registered sources have a label.
						bindingKey as string
					);
			const _bindingsLabel = _disableBoundBlock
				? relatedBinding?.args?.key || blockBindingsSource?.label
				: sprintf(
						/* translators: %s: source label or key */
						__( 'Empty %s; start writing to edit its value' ),
						// Registered sources have a label.
						( relatedBinding?.args?.key ||
							blockBindingsSource?.label ) as string
					);

			return {
				disableBoundBlock: _disableBoundBlock,
				bindingsPlaceholder:
					blockAttributes?.placeholder || _bindingsPlaceholder,
				bindingsLabel: _bindingsLabel,
			};
		};
		// Whether the wrapper is the editing host, which depends on the selected
		// block, not necessarily this one. Only the selected, default-mode block
		// can be it, so others don't read the store.
		const selectIsEditingHost = (
			disableBoundBlock: boolean | undefined
		) => {
			if (
				readOnly ||
				disableBoundBlock ||
				shouldDisableForPattern ||
				! hasDefaultEditingMode ||
				! isBlockSelected
			) {
				return false;
			}

			const { getSelectedBlockClientId, canHostEditableRoot } = unlock(
				select( blockEditorStore )
			);
			return canHostEditableRoot( getSelectedBlockClientId() );
		};

		const bindings = selectBindings();
		return {
			...selectSelection(),
			...bindings,
			isEditingHost: selectIsEditingHost( bindings.disableBoundBlock ),
		};
	};
	// One subscription for the selection, the bindings and the editing host:
	// each mounted subscription costs every field, and most fields need none
	// of them until their block is selected.
	const {
		selectionStart,
		selectionEnd,
		isSelected,
		crossBlockStart,
		crossBlockEnd,
		disableBoundBlock,
		bindingsPlaceholder,
		bindingsLabel,
		isEditingHost,
	} = useSelect( selectField, [
		clientId,
		identifier,
		instanceId,
		originalIsSelected,
		isBlockSelected,
		isBlockMultiSelected,
		blockBindings,
		blockName,
		hasValue,
		blockContext,
		readOnly,
		shouldDisableForPattern,
		hasDefaultEditingMode,
	] );

	const shouldDisableEditing =
		readOnly || disableBoundBlock || shouldDisableForPattern;

	const { getSelectionStart, getSelectionEnd, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { selectionChange, __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );
	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats,
		disableFormats,
	} );
	const hasFormats =
		! adjustedAllowedFormats || adjustedAllowedFormats.length > 0;

	// For formatting a selection across blocks, which happens outside the
	// fields.
	useEffect( () => {
		if ( ! identifier ) {
			return;
		}
		setFieldFormatSettings( clientId, identifier, {
			allowedFormats: adjustedAllowedFormats,
			withoutInteractiveFormatting,
			disabled: shouldDisableEditing,
		} );
		return () => {
			deleteFieldFormatSettings( clientId, identifier );
		};
	}, [
		clientId,
		identifier,
		adjustedAllowedFormats,
		withoutInteractiveFormatting,
		shouldDisableEditing,
	] );

	const onSelectionChange = useCallback(
		( start?: number, end?: number ) => {
			const selection: { start?: BlockSelection; end?: BlockSelection } =
				{};
			const unset = start === undefined && end === undefined;

			const baseSelection = {
				clientId,
				[ identifier ? 'attributeKey' : instanceIdKey ]: identifier
					? identifier
					: instanceId,
			};

			if ( typeof start === 'number' || unset ) {
				// If we are only setting the start (or the end below), which
				// means a partial selection, and we're not updating a selection
				// with the same client ID, abort. This means the selected block
				// is a parent block.
				if (
					end === undefined &&
					getBlockRootClientId( clientId ) !==
						// An unset end has no root.
						getBlockRootClientId(
							getSelectionEnd().clientId as string
						)
				) {
					return;
				}

				selection.start = {
					...baseSelection,
					offset: start,
				};
			}

			if ( typeof end === 'number' || unset ) {
				if (
					start === undefined &&
					getBlockRootClientId( clientId ) !==
						// An unset start has no root.
						getBlockRootClientId(
							getSelectionStart().clientId as string
						)
				) {
					return;
				}

				selection.end = {
					...baseSelection,
					offset: end,
				};
			}

			// The store keeps the end that is not given.
			selectionChange( selection as Selection );
		},
		[
			clientId,
			getBlockRootClientId,
			getSelectionEnd,
			getSelectionStart,
			identifier,
			instanceId,
			selectionChange,
		]
	);

	// The field is edited with `useRichText` while it holds the selection or
	// one end of it, or while something dragged over it may be dropped in it,
	// or text dragged from it. Other fields only render their value.
	const isActive = !! (
		isSelected ||
		crossBlockStart !== undefined ||
		crossBlockEnd !== undefined ||
		isDraggedOver ||
		isTextDragSource
	);

	const formatTypeHandlerContext = useMemo(
		() => ( {
			richTextIdentifier: identifier,
			blockClientId: clientId,
		} ),
		[ identifier, clientId ]
	);

	const inactiveRef = useInactiveRichText( {
		value: adjustedValue,
		placeholder: bindingsPlaceholder || placeholder,
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting,
		__unstableDisableFormats: disableFormats,
		__unstableDependencies: [ tagName ],
		__unstableFormatTypeHandlerContext: formatTypeHandlerContext,
		isActive,
		// Select the field, as `useRichText` does, which renders it active.
		onActivate( event: Event, editableElement: HTMLElement ) {
			// Focus is handled here, as `useRichText` would, before the
			// render: rendering selects the block, which may make the editor
			// an editing host before the caret is placed. The active field
			// synchronizes the selection once mounted, after the event.
			if ( event.type === 'focusin' ) {
				activate( event, editableElement );
				return;
			}
			// Synchronously, so that the active field's listeners, which
			// listen first, also handle the event.
			flushSync( () => activate( event, editableElement ) );
		},
	} );

	function activate( event: Event, editableElement: HTMLElement ) {
		if ( event.type === 'focusin' ) {
			// When the whole editor is editable, writing flow handles
			// selection. A nested editable element does not receive a
			// caret from being focused, unlike an editing host, so place
			// it at the start, which selects the field through the
			// selection change.
			if (
				editableElement.parentElement!.closest(
					'[contenteditable="true"]'
				)
			) {
				const selection =
					editableElement.ownerDocument.defaultView!.getSelection()!;
				if (
					! selection.anchorNode ||
					! editableElement.contains( selection.anchorNode )
				) {
					selection.collapse( editableElement, 0 );
				}
				return;
			}

			onSelectionChange( undefined, undefined );
			return;
		}

		// The field owns the selection.
		const selection =
			editableElement.ownerDocument.defaultView!.getSelection()!;
		const { start, end } = create( {
			element: editableElement,
			range: selection.rangeCount ? selection.getRangeAt( 0 ) : null,
			__unstableIsEditableTree: true,
		} );
		onSelectionChange( start, end );
	}

	// Something dragged over the field may be dropped in it, which the active
	// field handles. Activate it on capture, before the event reaches the
	// field, so that the active field handles the event too.
	const dragRef = useRefEffect(
		( node: HTMLElement ) => {
			if ( isActive ) {
				return;
			}

			function onDragEvent() {
				flushSync( () => setIsDraggedOver( true ) );
			}

			const unsubscribers = [ 'dragenter', 'dragover', 'drop' ].map(
				( eventType ) =>
					subscribeDelegatedListener(
						node,
						eventType,
						onDragEvent,
						true
					)
			);
			return () => {
				unsubscribers.forEach( ( unsubscribe ) => unsubscribe() );
			};
		},
		[ isActive ]
	);

	// Stop editing the field once the drag ends. Subscribed as the field is
	// activated, in case it ends with that event.
	useLayoutEffect( () => {
		const element = elementRef.current;
		if ( ! isDraggedOver || ! element ) {
			return;
		}
		const { defaultView } = element.ownerDocument;
		function onDragEnd( event: Event ) {
			if (
				event.type === 'dragleave' &&
				element!.contains(
					( event as DragEvent ).relatedTarget as Node | null
				)
			) {
				return;
			}
			setIsDraggedOver( false );
		}
		element.addEventListener( 'dragleave', onDragEnd );
		defaultView!.addEventListener( 'drop', onDragEnd );
		defaultView!.addEventListener( 'dragend', onDragEnd );
		return () => {
			element.removeEventListener( 'dragleave', onDragEnd );
			defaultView!.removeEventListener( 'drop', onDragEnd );
			defaultView!.removeEventListener( 'dragend', onDragEnd );
		};
	}, [ isDraggedOver ] );

	// Changes made while the field is not edited, for example by undo, are
	// marked as the active field marks them. While it is active, its own
	// instance does, and this one keeps track of the value.
	useMarkPersistent( {
		html: adjustedValue,
		value: useMemo(
			() => ( {
				text:
					adjustedValue instanceof RichTextData
						? adjustedValue.text
						: create( { html: String( adjustedValue ) } ).text,
			} ),
			[ adjustedValue ]
		),
		onMarkPersistent: __unstableMarkLastChangeAsPersistent,
		isDisabled: isActive,
	} );

	// Mark the last change, still pending after typing, as persistent when
	// the field stops being edited.
	useLayoutEffect( () => {
		if ( ! isActive ) {
			flushMarkPersistentRef.current?.();
		}
	}, [ isActive ] );

	// Setting tabIndex to 0 is unnecessary, the element is already focusable
	// because it's contentEditable. This also fixes a Safari bug where it's
	// not possible to Shift+Click multi select blocks when Shift Clicking
	// into an element with tabIndex because Safari will focus the element.
	// However, Safari will correctly ignore nested contentEditable elements.
	// While the writing flow wrapper is contentEditable (the selected block
	// supports `editableRoot`), nested editable elements are no longer
	// focusable areas on their own, so an explicit tabIndex restores their
	// focusability.
	let tabIndex: number | undefined | null = props.tabIndex;
	if ( isEditingHost ) {
		tabIndex = props.tabIndex ?? 0;
	} else if ( ! shouldDisableEditing && props.tabIndex === 0 ) {
		tabIndex = null;
	}

	const TagName = tagName;
	return (
		<>
			<TagName
				// Overridable props.
				role="textbox"
				aria-multiline={ ! disableLineBreaks }
				aria-readonly={ shouldDisableEditing }
				{ ...props }
				// Unset draggable (coming from block props) for contentEditable
				// elements because it will interfere with multi block selection
				// when the contentEditable and draggable elements are the same
				// element.
				draggable={ undefined }
				aria-label={
					bindingsLabel || props[ 'aria-label' ] || placeholder
				}
				ref={ useMergeRefs( [
					inactiveRef,
					forwardedRef,
					props.ref,
					dragRef,
					elementRef,
				] ) }
				contentEditable={ ! shouldDisableEditing }
				suppressContentEditableWarning
				className={ clsx(
					'block-editor-rich-text__editable',
					props.className,
					'rich-text'
				) }
				tabIndex={ tabIndex }
				data-wp-block-attribute-key={ identifier }
			/>
			{ isActive && (
				<ActiveRichText
					// The field is a new element when its tag changes.
					key={ typeof tagName === 'string' ? tagName : undefined }
					elementRef={ elementRef }
					tagName={ tagName }
					value={ adjustedValue }
					onChange={ adjustedOnChange }
					isSelected={ isSelected }
					selectionStart={ selectionStart }
					selectionEnd={ selectionEnd }
					crossBlockStart={ crossBlockStart }
					crossBlockEnd={ crossBlockEnd }
					onSelectionChange={ onSelectionChange }
					inlineToolbar={ inlineToolbar }
					autocompleters={ autocompleters }
					onReplace={ onReplace }
					placeholder={
						// Bindings sources have string labels.
						( bindingsPlaceholder || placeholder ) as
							string | undefined
					}
					allowedFormats={ adjustedAllowedFormats }
					hasFormats={ hasFormats }
					withoutInteractiveFormatting={
						withoutInteractiveFormatting
					}
					onRemove={ onRemove }
					onMerge={ onMerge }
					onSplit={ onSplit }
					onSplitAtEnd={ onSplitAtEnd }
					onSplitAtDoubleLineEnd={ onSplitAtDoubleLineEnd }
					preserveWhiteSpace={ preserveWhiteSpace }
					pastePlainText={ pastePlainText }
					__unstableEmbedURLOnPaste={ __unstableEmbedURLOnPaste }
					disableFormats={ disableFormats }
					disableLineBreaks={ disableLineBreaks }
					__unstableAllowPrefixTransformations={
						__unstableAllowPrefixTransformations
					}
					formatTypeHandlerContext={ formatTypeHandlerContext }
					supportsSplitting={ supportsSplitting }
					flushMarkPersistentRef={ flushMarkPersistentRef }
					onTextDrag={ setIsTextDragSource }
				>
					{ children }
				</ActiveRichText>
			) }
		</>
	);
}

const ForwardedRichTextWrapper = forwardRef( RichTextWrapper );

export { ForwardedRichTextWrapper as RichTextWrapper };

const RichTextWithDeprecations = withDeprecations( ForwardedRichTextWrapper );

/*
 * `forwardRef` types no statics, which are assigned below, and drops the
 * value generic that ties `onChange` to `value`.
 */
type RichTextComponent = ( <
	V extends RichTextFieldValue = RichTextFieldValue,
>(
	// Distributive, to keep the plain text variant of `onChange` apart.
	props: DistributiveOmit< RichTextProps< V >, 'ref' > &
		RefAttributes< HTMLElement >
) => ReactElement | null ) & {
	Content: typeof Content;
	isEmpty: typeof isEmpty;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md
 */
const PublicForwardedRichTextContainer = forwardRef<
	HTMLElement,
	RichTextProps
>( ( props, ref ) => {
	const context = useBlockEditContext();
	const isPreviewMode = context[ isPreviewModeKey ];

	if ( isPreviewMode ) {
		// Remove all non-content props.
		const {
			children,
			tagName: Tag = 'div',
			value,
			onChange,
			isSelected,
			multiline,
			inlineToolbar,
			wrapperClassName,
			autocompleters,
			onReplace,
			placeholder,
			allowedFormats,
			withoutInteractiveFormatting,
			onRemove,
			onMerge,
			onSplit,
			__unstableOnSplitAtEnd,
			__unstableOnSplitAtDoubleLineEnd,
			identifier,
			preserveWhiteSpace,
			__unstablePastePlainText,
			__unstableEmbedURLOnPaste,
			__unstableDisableFormats,
			disableLineBreaks,
			__unstableAllowPrefixTransformations,
			readOnly,
			...contentProps
		} = props;
		return (
			<Tag
				ref={ ref }
				{ ...contentProps }
				dangerouslySetInnerHTML={ {
					__html: valueToHTMLString( value, multiline ) || '<br>',
				} }
			/>
		);
	}

	// `readOnly` is internal-only.
	return (
		<RichTextWithDeprecations ref={ ref } { ...props } readOnly={ false } />
	);
} ) as unknown as RichTextComponent;

PublicForwardedRichTextContainer.Content = Content;
PublicForwardedRichTextContainer.isEmpty = isEmpty;

export default PublicForwardedRichTextContainer;
export { RichTextShortcut };
export { RichTextToolbarButton } from './toolbar-button';
export { RichTextInputEvent as __unstableRichTextInputEvent };
