/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	RawHTML,
	useRef,
	useCallback,
	forwardRef,
	createContext,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { children as childrenSource } from '@wordpress/blocks';
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import {
	__unstableUseRichText as useRichText,
	__unstableCreateElement,
	isEmpty,
	isCollapsed,
	removeFormat,
} from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import { BACKSPACE, DELETE } from '@wordpress/keycodes';
import { Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useBlockEditorAutocompleteProps } from '../autocomplete';
import { useBlockEditContext } from '../block-edit';
import FormatToolbarContainer from './format-toolbar-container';
import { store as blockEditorStore } from '../../store';
import { useUndoAutomaticChange } from './use-undo-automatic-change';
import { useCaretInFormat } from './use-caret-in-format';
import { useMarkPersistent } from './use-mark-persistent';
import { usePasteHandler } from './use-paste-handler';
import { useInputRules } from './use-input-rules';
import { useEnter } from './use-enter';
import { useFormatTypes } from './use-format-types';
import { useRemoveBrowserShortcuts } from './use-remove-browser-shortcuts';
import { useShortcuts } from './use-shortcuts';
import { useInputEvents } from './use-input-events';
import FormatEdit from './format-edit';
import { getMultilineTag, getAllowedFormats } from './utils';

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
	return omit( props, [
		'__unstableMobileNoFocusOnMount',
		'deleteEnter',
		'placeholderTextColor',
		'textAlign',
		'selectionColor',
		'tagsToEliminate',
		'rootTagsToEliminate',
		'disableEditingMenu',
		'fontSize',
		'fontFamily',
		'fontWeight',
		'fontStyle',
		'minWidth',
		'maxWidth',
		'setRef',
	] );
}

function RichTextWrapper(
	{
		children,
		tagName = 'div',
		value: originalValue = '',
		onChange: originalOnChange,
		isSelected: originalIsSelected,
		multiline,
		inlineToolbar,
		wrapperClassName,
		autocompleters,
		onReplace,
		placeholder,
		allowedFormats,
		formattingControls,
		withoutInteractiveFormatting,
		onRemove,
		onMerge,
		onSplit,
		__unstableOnSplitAtEnd: onSplitAtEnd,
		__unstableOnSplitMiddle: onSplitMiddle,
		identifier,
		preserveWhiteSpace,
		__unstablePastePlainText: pastePlainText,
		__unstableEmbedURLOnPaste,
		__unstableDisableFormats: disableFormats,
		disableLineBreaks,
		unstableOnFocus,
		__unstableAllowPrefixTransformations,
		...props
	},
	forwardedRef
) {
	const instanceId = useInstanceId( RichTextWrapper );

	identifier = identifier || instanceId;
	props = removeNativeProps( props );

	const anchorRef = useRef();
	const { clientId } = useBlockEditContext();
	const selector = ( select ) => {
		const {
			getSelectionStart,
			getSelectionEnd,
			isMultiSelecting,
			hasMultiSelection,
		} = select( blockEditorStore );
		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		let isSelected;

		if ( originalIsSelected === undefined ) {
			isSelected =
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier;
		} else if ( originalIsSelected ) {
			isSelected = selectionStart.clientId === clientId;
		}

		return {
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
			disabled: isMultiSelecting() || hasMultiSelection(),
		};
	};
	// This selector must run on every render so the right selection state is
	// retreived from the store on merge.
	// To do: fix this somehow.
	const { selectionStart, selectionEnd, isSelected, disabled } = useSelect(
		selector
	);
	const { selectionChange } = useDispatch( blockEditorStore );
	const multilineTag = getMultilineTag( multiline );
	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats,
		formattingControls,
		disableFormats,
	} );
	const hasFormats =
		! adjustedAllowedFormats || adjustedAllowedFormats.length > 0;
	let adjustedValue = originalValue;
	let adjustedOnChange = originalOnChange;

	// Handle deprecated format.
	if ( Array.isArray( originalValue ) ) {
		adjustedValue = childrenSource.toHTML( originalValue );
		adjustedOnChange = ( newValue ) =>
			originalOnChange(
				childrenSource.fromDOM(
					__unstableCreateElement( document, newValue ).childNodes
				)
			);
	}

	const onSelectionChange = useCallback(
		( start, end ) => {
			selectionChange( clientId, identifier, start, end );
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

	const { value, onChange, ref: richTextRef } = useRichText( {
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
		__unstableMultilineTag: multilineTag,
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

	useCaretInFormat( { value } );
	useMarkPersistent( { html: adjustedValue, value } );

	const keyboardShortcuts = useRef( new Set() );
	const inputEvents = useRef( new Set() );

	function onKeyDown( event ) {
		const { keyCode } = event;

		if ( event.defaultPrevented ) {
			return;
		}

		if ( keyCode === DELETE || keyCode === BACKSPACE ) {
			const { start, end, text } = value;
			const isReverse = keyCode === BACKSPACE;
			const hasActiveFormats =
				value.activeFormats && !! value.activeFormats.length;

			// Only process delete if the key press occurs at an uncollapsed edge.
			if (
				! isCollapsed( value ) ||
				hasActiveFormats ||
				( isReverse && start !== 0 ) ||
				( ! isReverse && end !== text.length )
			) {
				return;
			}

			if ( onMerge ) {
				onMerge( ! isReverse );
			}

			// Only handle remove on Backspace. This serves dual-purpose of being
			// an intentional user interaction distinguishing between Backspace and
			// Delete to remove the empty field, but also to avoid merge & remove
			// causing destruction of two fields (merge, then removed merged).
			if ( onRemove && isEmpty( value ) && isReverse ) {
				onRemove( ! isReverse );
			}

			event.preventDefault();
		}
	}

	function onFocus() {
		anchorRef.current.focus();
	}

	const TagName = tagName;
	const content = (
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
					anchorRef={ anchorRef.current }
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
					autocompleteProps.ref,
					props.ref,
					richTextRef,
					useInputRules( {
						value,
						onChange,
						__unstableAllowPrefixTransformations,
						formatTypes,
						onReplace,
					} ),
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
						onSplitMiddle,
						__unstableEmbedURLOnPaste,
						multilineTag,
						preserveWhiteSpace,
						pastePlainText,
					} ),
					useEnter( {
						removeEditorOnlyFormats,
						value,
						onReplace,
						onSplit,
						onSplitMiddle,
						multilineTag,
						onChange,
						disableLineBreaks,
						onSplitAtEnd,
					} ),
					anchorRef,
					forwardedRef,
				] ) }
				// Do not set the attribute if disabled.
				contentEditable={ disabled ? undefined : true }
				suppressContentEditableWarning={ ! disabled }
				className={ classnames(
					'block-editor-rich-text__editable',
					props.className,
					'rich-text'
				) }
				onFocus={ unstableOnFocus }
				onKeyDown={ onKeyDown }
			/>
		</>
	);

	if ( ! wrapperClassName ) {
		return content;
	}

	deprecated( 'wp.blockEditor.RichText wrapperClassName prop', {
		since: '5.4',
		alternative: 'className prop or create your own wrapper div',
		version: '6.2',
	} );

	const className = classnames( 'block-editor-rich-text', wrapperClassName );
	return <div className={ className }>{ content }</div>;
}

const ForwardedRichTextContainer = forwardRef( RichTextWrapper );

ForwardedRichTextContainer.Content = ( {
	value,
	tagName: Tag,
	multiline,
	...props
} ) => {
	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		value = childrenSource.toHTML( value );
	}

	const MultilineTag = getMultilineTag( multiline );

	if ( ! value && MultilineTag ) {
		value = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	const content = <RawHTML>{ value }</RawHTML>;

	if ( Tag ) {
		return <Tag { ...omit( props, [ 'format' ] ) }>{ content }</Tag>;
	}

	return content;
};

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
