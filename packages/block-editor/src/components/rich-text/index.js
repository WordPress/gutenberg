/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useCallback,
	forwardRef,
	createContext,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMergeRefs } from '@wordpress/compose';
import {
	__unstableUseRichText as useRichText,
	removeFormat,
} from '@wordpress/rich-text';
import { Popover } from '@wordpress/components';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useBlockEditorAutocompleteProps } from '../autocomplete';
import { useBlockEditContext } from '../block-edit';
import FormatToolbarContainer from './format-toolbar-container';
import { store as blockEditorStore } from '../../store';
import { useUndoAutomaticChange } from './use-undo-automatic-change';
import { useMarkPersistent } from './use-mark-persistent';
import { usePasteHandler } from './use-paste-handler';
import { useBeforeInputRules } from './use-before-input-rules';
import { useInputRules } from './use-input-rules';
import { useDelete } from './use-delete';
import { useEnter } from './use-enter';
import { useFormatTypes } from './use-format-types';
import { useRemoveBrowserShortcuts } from './use-remove-browser-shortcuts';
import { useShortcuts } from './use-shortcuts';
import { useInputEvents } from './use-input-events';
import { useInsertReplacementText } from './use-insert-replacement-text';
import { useFirefoxCompat } from './use-firefox-compat';
import FormatEdit from './format-edit';
import { getAllowedFormats } from './utils';
import { Content } from './content';
import { withDeprecations } from './with-deprecations';
import { unlock } from '../../lock-unlock';

export const keyboardShortcutContext = createContext();
export const inputEventContext = createContext();

/**
 * Removes props used for the native version of RichText so that they are not
 * passed to the DOM element and log warnings.
 *
 * @param {Object} props Props to filter.
 *
 * @return {Object} Filtered props.
 */
function removeNativeProps( props ) {
	const {
		__unstableMobileNoFocusOnMount,
		deleteEnter,
		placeholderTextColor,
		textAlign,
		selectionColor,
		tagsToEliminate,
		disableEditingMenu,
		fontSize,
		fontFamily,
		fontWeight,
		fontStyle,
		minWidth,
		maxWidth,
		setRef,
		disableSuggestions,
		disableAutocorrection,
		...restProps
	} = props;
	return restProps;
}

export function RichTextWrapper(
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
		...props
	},
	forwardedRef
) {
	props = removeNativeProps( props );

	const anchorRef = useRef();
	const {
		clientId,
		isSelected: isBlockSelected,
		name: blockName,
	} = useBlockEditContext();
	const selector = ( select ) => {
		// Avoid subscribing to the block editor store if the block is not
		// selected.
		if ( ! isBlockSelected ) {
			return { isSelected: false };
		}

		const { getSelectionStart, getSelectionEnd, getBlockAttributes } =
			select( blockEditorStore );
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();
		const blockBindings =
			getBlockAttributes( clientId )?.metadata?.bindings;

		let isSelected;

		if ( originalIsSelected === undefined ) {
			isSelected =
				selectionStart.clientId === clientId &&
				selectionEnd.clientId === clientId &&
				selectionStart.attributeKey === identifier;
		} else if ( originalIsSelected ) {
			isSelected = selectionStart.clientId === clientId;
		}

		// Disable Rich Text editing if block bindings specify that.
		let shouldDisableEditing = false;
		if ( blockBindings ) {
			const blockTypeAttributes = getBlockType( blockName ).attributes;
			const { getBlockBindingsSource } = unlock(
				select( blockEditorStore )
			);
			for ( const [ attribute, args ] of Object.entries(
				blockBindings
			) ) {
				// If any of the attributes with source "rich-text" is part of the bindings,
				// has a source with `lockAttributesEditing`, disable it.
				if (
					blockTypeAttributes?.[ attribute ]?.source ===
						'rich-text' &&
					getBlockBindingsSource( args.source )?.lockAttributesEditing
				) {
					shouldDisableEditing = true;
					break;
				}
			}
		}

		return {
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
			shouldDisableEditing,
		};
	};
	const { selectionStart, selectionEnd, isSelected, shouldDisableEditing } =
		useSelect( selector, [
			clientId,
			identifier,
			originalIsSelected,
			isBlockSelected,
		] );
	const { getSelectionStart, getSelectionEnd, getBlockRootClientId } =
		useSelect( blockEditorStore );
	const { selectionChange } = useDispatch( blockEditorStore );
	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats,
		disableFormats,
	} );
	const hasFormats =
		! adjustedAllowedFormats || adjustedAllowedFormats.length > 0;

	const onSelectionChange = useCallback(
		( start, end ) => {
			const selection = {};
			const unset = start === undefined && end === undefined;

			if ( typeof start === 'number' || unset ) {
				// If we are only setting the start (or the end below), which
				// means a partial selection, and we're not updating a selection
				// with the same client ID, abort. This means the selected block
				// is a parent block.
				if (
					end === undefined &&
					getBlockRootClientId( clientId ) !==
						getBlockRootClientId( getSelectionEnd().clientId )
				) {
					return;
				}

				selection.start = {
					clientId,
					attributeKey: identifier,
					offset: start,
				};
			}

			if ( typeof end === 'number' || unset ) {
				if (
					start === undefined &&
					getBlockRootClientId( clientId ) !==
						getBlockRootClientId( getSelectionStart().clientId )
				) {
					return;
				}

				selection.end = {
					clientId,
					attributeKey: identifier,
					offset: end,
				};
			}

			selectionChange( selection );
		},
		[ clientId, identifier ]
	);

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
		allowedFormats: adjustedAllowedFormats,
	} );

	function addEditorOnlyFormats( value ) {
		return valueHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
	}

	function removeEditorOnlyFormats( value ) {
		formatTypes.forEach( ( formatType ) => {
			// Remove formats created by prepareEditableTree, because they are editor only.
			if ( formatType.__experimentalCreatePrepareEditableTree ) {
				value = removeFormat(
					value,
					formatType.name,
					0,
					value.text.length
				);
			}
		} );

		return value.formats;
	}

	function addInvisibleFormats( value ) {
		return prepareHandlers.reduce(
			( accumulator, fn ) => fn( accumulator, value.text ),
			value.formats
		);
	}

	const {
		value,
		getValue,
		onChange,
		ref: richTextRef,
	} = useRichText( {
		value: adjustedValue,
		onChange( html, { __unstableFormats, __unstableText } ) {
			adjustedOnChange( html );
			Object.values( changeHandlers ).forEach( ( changeHandler ) => {
				changeHandler( __unstableFormats, __unstableText );
			} );
		},
		selectionStart,
		selectionEnd,
		onSelectionChange,
		placeholder,
		__unstableIsSelected: isSelected,
		__unstableDisableFormats: disableFormats,
		preserveWhiteSpace,
		__unstableDependencies: [ ...dependencies, tagName ],
		__unstableAfterParse: addEditorOnlyFormats,
		__unstableBeforeSerialize: removeEditorOnlyFormats,
		__unstableAddInvisibleFormats: addInvisibleFormats,
	} );
	const autocompleteProps = useBlockEditorAutocompleteProps( {
		onReplace,
		completers: autocompleters,
		record: value,
		onChange,
	} );

	useMarkPersistent( { html: adjustedValue, value } );

	const keyboardShortcuts = useRef( new Set() );
	const inputEvents = useRef( new Set() );

	function onFocus() {
		anchorRef.current?.focus();
	}

	const TagName = tagName;
	return (
		<>
			{ isSelected && (
				<keyboardShortcutContext.Provider value={ keyboardShortcuts }>
					<inputEventContext.Provider value={ inputEvents }>
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
					</inputEventContext.Provider>
				</keyboardShortcutContext.Provider>
			) }
			{ isSelected && hasFormats && (
				<FormatToolbarContainer
					inline={ inlineToolbar }
					editableContentElement={ anchorRef.current }
					value={ value }
				/>
			) }
			<TagName
				// Overridable props.
				role="textbox"
				aria-multiline={ ! disableLineBreaks }
				aria-label={ placeholder }
				{ ...props }
				{ ...autocompleteProps }
				ref={ useMergeRefs( [
					// Rich text ref must be first because its focus listener
					// must be set up before any other ref calls .focus() on
					// mount.
					richTextRef,
					forwardedRef,
					autocompleteProps.ref,
					props.ref,
					useBeforeInputRules( { value, onChange } ),
					useInputRules( {
						getValue,
						onChange,
						__unstableAllowPrefixTransformations,
						formatTypes,
						onReplace,
						selectionChange,
					} ),
					useInsertReplacementText(),
					useRemoveBrowserShortcuts(),
					useShortcuts( keyboardShortcuts ),
					useInputEvents( inputEvents ),
					useUndoAutomaticChange(),
					usePasteHandler( {
						isSelected,
						disableFormats,
						onChange,
						value,
						formatTypes,
						tagName,
						onReplace,
						onSplit,
						__unstableEmbedURLOnPaste,
						pastePlainText,
					} ),
					useDelete( {
						value,
						onMerge,
						onRemove,
					} ),
					useEnter( {
						removeEditorOnlyFormats,
						value,
						onReplace,
						onSplit,
						onChange,
						disableLineBreaks,
						onSplitAtEnd,
						onSplitAtDoubleLineEnd,
					} ),
					useFirefoxCompat(),
					anchorRef,
				] ) }
				contentEditable={ ! shouldDisableEditing }
				suppressContentEditableWarning={ true }
				className={ classnames(
					'block-editor-rich-text__editable',
					props.className,
					'rich-text'
				) }
				// Setting tabIndex to 0 is unnecessary, the element is already
				// focusable because it's contentEditable. This also fixes a
				// Safari bug where it's not possible to Shift+Click multi
				// select blocks when Shift Clicking into an element with
				// tabIndex because Safari will focus the element. However,
				// Safari will correctly ignore nested contentEditable elements.
				tabIndex={
					props.tabIndex === 0 && ! shouldDisableEditing
						? null
						: props.tabIndex
				}
				data-wp-block-attribute-key={ identifier }
			/>
		</>
	);
}

const ForwardedRichTextContainer = withDeprecations(
	forwardRef( RichTextWrapper )
);

ForwardedRichTextContainer.Content = Content;
ForwardedRichTextContainer.isEmpty = ( value ) => {
	return ! value || value.length === 0;
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md
 */
export default ForwardedRichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { __unstableRichTextInputEvent } from './input-event';
