/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { RawHTML, useRef, useCallback, forwardRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { children as childrenSource } from '@wordpress/blocks';
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import {
	__unstableUseRichText as useRichText,
	__unstableCreateElement,
	isEmpty,
	split,
	toHTMLString,
	removeFormat,
} from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { useBlockEditorAutocompleteProps } from '../autocomplete';
import { useBlockEditContext } from '../block-edit';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';
import FormatToolbarContainer from './format-toolbar-container';
import { store as blockEditorStore } from '../../store';
import { useUndoAutomaticChange } from './use-undo-automatic-change';
import { useCaretInFormat } from './use-caret-in-format';
import { useMarkPersistent } from './use-mark-persistent';
import { usePasteHandler } from './use-paste-handler';
import { useInputRules } from './use-input-rules';
import { useEnter } from './use-enter';
import { useDelete } from './use-delete';
import { useFormatTypes } from './use-format-types';
import FormatEdit from './format-edit';
import { getMultilineTag, getAllowedFormats } from './utils';

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

	/**
	 * Signals to the RichText owner that the block can be replaced with two
	 * blocks as a result of splitting the block by pressing enter, or with
	 * blocks as a result of splitting the block by pasting block content in the
	 * instance.
	 *
	 * @param  {Object} record       The rich text value to split.
	 * @param  {Array}  pastedBlocks The pasted blocks to insert, if any.
	 */
	const splitValue = useCallback(
		( record, pastedBlocks = [] ) => {
			if ( ! onReplace || ! onSplit ) {
				return;
			}

			const blocks = [];
			const [ before, after ] = split( record );
			const hasPastedBlocks = pastedBlocks.length > 0;
			let lastPastedBlockIndex = -1;

			// Consider the after value to be the original it is not empty and
			// the before value *is* empty.
			const isAfterOriginal = isEmpty( before ) && ! isEmpty( after );

			// Create a block with the content before the caret if there's no pasted
			// blocks, or if there are pasted blocks and the value is not empty.
			// We do not want a leading empty block on paste, but we do if split
			// with e.g. the enter key.
			if ( ! hasPastedBlocks || ! isEmpty( before ) ) {
				blocks.push(
					onSplit(
						toHTMLString( {
							value: before,
							multilineTag,
						} ),
						! isAfterOriginal
					)
				);
				lastPastedBlockIndex += 1;
			}

			if ( hasPastedBlocks ) {
				blocks.push( ...pastedBlocks );
				lastPastedBlockIndex += pastedBlocks.length;
			} else if ( onSplitMiddle ) {
				blocks.push( onSplitMiddle() );
			}

			// If there's pasted blocks, append a block with non empty content
			/// after the caret. Otherwise, do append an empty block if there
			// is no `onSplitMiddle` prop, but if there is and the content is
			// empty, the middle block is enough to set focus in.
			if (
				hasPastedBlocks
					? ! isEmpty( after )
					: ! onSplitMiddle || ! isEmpty( after )
			) {
				blocks.push(
					onSplit(
						toHTMLString( {
							value: after,
							multilineTag,
						} ),
						isAfterOriginal
					)
				);
			}

			// If there are pasted blocks, set the selection to the last one.
			// Otherwise, set the selection to the second block.
			const indexToSelect = hasPastedBlocks ? lastPastedBlockIndex : 1;

			// If there are pasted blocks, move the caret to the end of the selected block
			// Otherwise, retain the default value.
			const initialPosition = hasPastedBlocks ? -1 : 0;

			onReplace( blocks, indexToSelect, initialPosition );
		},
		[ onReplace, onSplit, multilineTag, onSplitMiddle ]
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

	const { value, onChange, onFocus, ref: richTextRef } = useRichText( {
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
		__unstableDependencies: dependencies,
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

	const TagName = tagName;
	const content = (
		<>
			{ children && children( { value, onChange, onFocus } ) }
			{ isSelected && <RemoveBrowserShortcuts /> }
			{ isSelected && autocompleteProps.children }
			{ isSelected && (
				<FormatEdit
					value={ value }
					onChange={ onChange }
					onFocus={ onFocus }
					formatTypes={ formatTypes }
					forwardedRef={ anchorRef }
				/>
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
				aria-multiline={ true }
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
					useUndoAutomaticChange(),
					useDelete( { value, onMerge, onRemove } ),
					usePasteHandler( {
						isSelected,
						disableFormats,
						onChange,
						value,
						formatTypes,
						tagName,
						onReplace,
						onSplit,
						splitValue,
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
						multiline,
						onChange,
						disableLineBreaks,
						splitValue,
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
			/>
		</>
	);

	if ( ! wrapperClassName ) {
		return content;
	}

	deprecated( 'wp.blockEditor.RichText wrapperClassName prop', {
		since: '5.4',
		alternative: 'className prop or create your own wrapper div',
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
