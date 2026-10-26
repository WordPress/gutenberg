import clsx from 'clsx';
import fastDeepEqual from 'fast-deep-equal/es6/index.js';
import {
	useRef,
	useState,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	forwardRef,
	useContext,
} from '@wordpress/element';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { useMergeRefs, useInstanceId } from '@wordpress/compose';
import { privateApis as richTextPrivateApis } from '@wordpress/rich-text';
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
import { useBlockEditorAutocompleteProps } from '../autocomplete';
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

const instanceIdKey = Symbol( 'instanceId' );

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
		__unstableDisableFormatInputRules,
		readOnly,
		...props
	}: RichTextProps,
	forwardedRef: ForwardedRef< HTMLElement >
) {
	const { supportsSplitting } = useContext( PrivateBlockContext );
	const instanceId = useInstanceId( RichTextWrapper );
	const anchorRef = useRef< HTMLElement >( null );
	const [ anchorElement, setAnchorElement ] = useState< HTMLElement | null >(
		null
	);
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
	const registry = useRegistry();
	const selector = ( select: SelectFunction ) => {
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
					( end as Record< symbol, unknown > )[ instanceIdKey ] ===
					instanceId );

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
			! isSelected && selectionStart.clientId !== selectionEnd.clientId;

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
	const {
		selectionStart,
		selectionEnd,
		isSelected,
		crossBlockStart,
		crossBlockEnd,
	} = useSelect( selector, [
		clientId,
		identifier,
		instanceId,
		originalIsSelected,
		isBlockSelected,
		isBlockMultiSelected,
	] );

	const { disableBoundBlock, bindingsPlaceholder, bindingsLabel } = useSelect(
		( select ) => {
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
			if ( adjustedValue.length > 0 ) {
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
		},
		[
			blockBindings,
			identifier,
			blockName,
			adjustedValue,
			clientId,
			blockContext,
		]
	);
	const isInsidePatternOverrides = !! blockContext?.[ 'pattern/overrides' ];
	const hasOverrideEnabled =
		blockBindings?.__default?.source === 'core/pattern-overrides';

	const shouldDisableForPattern =
		isInsidePatternOverrides && ! hasOverrideEnabled;

	const shouldDisableEditing =
		readOnly || disableBoundBlock || shouldDisableForPattern;

	// Whether the wrapper is the editing host, which depends on the selected
	// block, not necessarily this one. Only the selected, default-mode block
	// can be it, so others skip the subscription entirely.
	const isEditingHost = useSelect(
		( select ) => {
			if (
				shouldDisableEditing ||
				! hasDefaultEditingMode ||
				! isBlockSelected
			) {
				return false;
			}

			const { getSelectedBlockClientId, canHostEditableRoot } = unlock(
				select( blockEditorStore )
			);
			return canHostEditableRoot( getSelectedBlockClientId() );
		},
		[ shouldDisableEditing, hasDefaultEditingMode, isBlockSelected ]
	);

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
		placeholder: bindingsPlaceholder || placeholder,
		__unstableIsSelected: isSelected,
		__unstableDisableFormats: disableFormats,
		preserveWhiteSpace,
		__unstableDependencies: [ tagName ],
		allowedFormats: adjustedAllowedFormats,
		withoutInteractiveFormatting,
		__unstableFormatTypeHandlerContext: useMemo(
			() => ( {
				richTextIdentifier: identifier,
				blockClientId: clientId,
			} ),
			[ identifier, clientId ]
		),
	} );
	// Focus follows the selection while focus is inside the canvas or was
	// lost to the body. Focus placed elsewhere stays. Runs after
	// `useRichText` applied the content, so the field is current when its
	// focus handler applies the selection.
	useLayoutEffect( () => {
		const element = anchorRef.current;

		// A pointer press outside the field makes it non editable until the
		// release (see rich text's preventFocusCapture). Focusing it then
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
	}, [ selectionStart, selectionEnd, isSelected ] );

	// One end of a text selection across blocks is in this field: put that
	// end of the native selection back after rendering, as a field does for
	// a selection within it. The field at the other end does the same.
	useLayoutEffect( () => {
		if ( crossBlockStart === undefined && crossBlockEnd === undefined ) {
			return;
		}
		const element = anchorRef.current;
		if ( ! element ) {
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
	}, [ crossBlockStart, crossBlockEnd, value, getDomPosition ] );

	const autocompleteProps = useBlockEditorAutocompleteProps( {
		// @ts-expect-error TODO: `onReplace` may be missing, and patterns replace with a block array.
		onReplace,
		completers: autocompleters,
		record: value,
		onChange,
	} );

	// While a focused editing host owns the selection (the block supports
	// `editableRoot`), ARIA attributes describing the autocomplete state must
	// be mirrored onto the host: assistive technology resolves them relative
	// to the focused element.
	const {
		'aria-autocomplete': ariaAutocomplete,
		'aria-haspopup': ariaHasPopup,
		'aria-controls': ariaControls,
		'aria-owns': ariaOwns,
		'aria-activedescendant': ariaActiveDescendant,
	} = autocompleteProps;
	useEffect( () => {
		if ( ! isSelected ) {
			return;
		}

		const host = anchorRef.current?.parentElement?.closest(
			'[contenteditable="true"]'
		);

		if ( ! host ) {
			return;
		}

		const attributes = {
			'aria-autocomplete': ariaAutocomplete,
			'aria-haspopup': ariaHasPopup,
			'aria-controls': ariaControls,
			'aria-owns': ariaOwns,
			'aria-activedescendant': ariaActiveDescendant,
		};

		for ( const [ key, value_ ] of Object.entries( attributes ) ) {
			if ( value_ === undefined ) {
				host.removeAttribute( key );
			} else {
				host.setAttribute( key, value_ );
			}
		}

		return () => {
			for ( const key of Object.keys( attributes ) ) {
				host.removeAttribute( key );
			}
		};
	}, [
		isSelected,
		ariaAutocomplete,
		ariaHasPopup,
		ariaControls,
		ariaOwns,
		ariaActiveDescendant,
	] );

	useMarkPersistent( {
		html: adjustedValue,
		value,
		onMarkPersistent: __unstableMarkLastChangeAsPersistent,
	} );

	const [ keyboardShortcuts ] = useState(
		() => new Set< ( event: KeyboardEvent ) => void >()
	);
	const [ inputEvents ] = useState(
		() => new Set< ( event: InputEvent ) => void >()
	);

	function onFocus() {
		anchorRef.current?.focus();
	}

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
								forwardedRef={ anchorRef }
							/>
						</Popover.__unstableSlotNameProvider>
					</InputEventContext.Provider>
				</KeyboardShortcutContext.Provider>
			) }
			{ isSelected && hasFormats && (
				<FormatToolbarContainer
					inline={ inlineToolbar }
					editableContentElement={ anchorElement }
				/>
			) }
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
				{ ...autocompleteProps }
				ref={ useMergeRefs( [
					// Rich text ref must be first because its focus listener
					// must be set up before any other ref calls .focus() on
					// mount.
					richTextRef,
					forwardedRef,
					autocompleteProps.ref,
					props.ref,
					useEventListeners( {
						registry,
						getValue,
						onChange,
						__unstableAllowPrefixTransformations,
						__unstableDisableFormatInputRules,
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
					} ),
					anchorRef,
					setAnchorElement,
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
			__unstableDisableFormatInputRules,
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
