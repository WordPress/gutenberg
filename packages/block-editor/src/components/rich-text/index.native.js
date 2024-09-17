/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Platform, useRef, useCallback, forwardRef } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	pasteHandler,
	children as childrenSource,
	getBlockTransforms,
	findTransform,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import {
	__unstableCreateElement,
	isEmpty,
	insert,
	remove,
	create,
	split,
	toHTMLString,
} from '@wordpress/rich-text';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import { useBlockEditContext } from '../block-edit';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';
import { filePasteHandler } from './file-paste-handler';
import FormatToolbarContainer from './format-toolbar-container';
import { store as blockEditorStore } from '../../store';
import {
	addActiveFormats,
	getAllowedFormats,
	createLinkInParagraph,
} from './utils';
import EmbedHandlerPicker from './embed-handler-picker';
import { Content } from './content';
import RichText from './native';
import { withDeprecations } from './with-deprecations';
import { findSelection } from './event-listeners/input-rules';
import { START_OF_SELECTED_AREA } from '../../utils/selection';

const classes = 'block-editor-rich-text__editable';

export function RichTextWrapper(
	{
		children,
		tagName,
		start,
		reversed,
		value: originalValue,
		onChange: originalOnChange,
		isSelected: originalIsSelected,
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
		__unstableOnSplitMiddle: onSplitMiddle,
		__unstableOnSplitAtDoubleLineEnd: onSplitAtDoubleLineEnd,
		identifier,
		preserveWhiteSpace,
		__unstablePastePlainText: pastePlainText,
		__unstableEmbedURLOnPaste,
		__unstableDisableFormats: disableFormats,
		disableLineBreaks,
		unstableOnFocus,
		__unstableAllowPrefixTransformations,
		// Native props.
		__unstableUseSplitSelection,
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
		onBlur,
		disableSuggestions,
		disableAutocorrection,
		containerWidth,
		onEnter: onCustomEnter,
		...props
	},
	providedRef
) {
	const instanceId = useInstanceId( RichTextWrapper );

	identifier = identifier || instanceId;

	const fallbackRef = useRef();
	const { clientId, isSelected: blockIsSelected } = useBlockEditContext();
	const embedHandlerPickerRef = useRef();
	const selector = ( select ) => {
		const {
			getSelectionStart,
			getSelectionEnd,
			getSettings,
			didAutomaticChange,
			getBlock,
			isMultiSelecting,
			hasMultiSelection,
			getSelectedBlockClientId,
		} = select( blockEditorStore );

		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();
		const { __experimentalUndo: undo } = getSettings();

		let isSelected;

		if ( originalIsSelected === undefined ) {
			isSelected =
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier;
		} else if ( originalIsSelected ) {
			isSelected = selectionStart.clientId === clientId;
		}

		let extraProps = {};
		if ( Platform.OS === 'native' ) {
			// If the block of this RichText is unmodified then it's a candidate for replacing when adding a new block.
			// In order to fix https://github.com/wordpress-mobile/gutenberg-mobile/issues/1126, let's blur on unmount in that case.
			// This apparently assumes functionality the BlockHlder actually.
			const block = clientId && getBlock( clientId );
			const shouldBlurOnUnmount =
				block && isSelected && isUnmodifiedDefaultBlock( block );
			extraProps = {
				shouldBlurOnUnmount,
			};
		}

		return {
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
			didAutomaticChange: didAutomaticChange(),
			disabled: isMultiSelecting() || hasMultiSelection(),
			undo,
			getSelectedBlockClientId,
			...extraProps,
		};
	};
	// This selector must run on every render so the right selection state is
	// retrieved from the store on merge.
	// To do: fix this somehow.
	const {
		selectionStart,
		selectionEnd,
		isSelected,
		getSelectedBlockClientId,
		didAutomaticChange,
		disabled,
		undo,
		shouldBlurOnUnmount,
	} = useSelect( selector );
	const {
		__unstableMarkLastChangeAsPersistent,
		enterFormattedText,
		exitFormattedText,
		selectionChange,
		__unstableMarkAutomaticChange,
		__unstableSplitSelection,
		clearSelectedBlock,
	} = useDispatch( blockEditorStore );
	const adjustedAllowedFormats = getAllowedFormats( {
		allowedFormats,
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
		( selectionChangeStart, selectionChangeEnd ) => {
			selectionChange(
				clientId,
				identifier,
				selectionChangeStart,
				selectionChangeEnd
			);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[ clientId, identifier ]
	);

	const clearCurrentSelectionOnUnmount = useCallback( () => {
		if ( getSelectedBlockClientId() === clientId ) {
			clearSelectedBlock();
		}
	}, [ clearSelectedBlock, clientId, getSelectedBlockClientId ] );

	const onDelete = useCallback(
		( { value, isReverse } ) => {
			if ( onMerge ) {
				onMerge( ! isReverse );
			}

			// Only handle remove on Backspace. This serves dual-purpose of being
			// an intentional user interaction distinguishing between Backspace and
			// Delete to remove the empty field, but also to avoid merge & remove
			// causing destruction of two fields (merge, then removed merged).
			else if ( onRemove && isEmpty( value ) && isReverse ) {
				onRemove( ! isReverse );
			}
		},
		[ onMerge, onRemove ]
	);

	/**
	 * Signals to the RichText owner that the block can be replaced with two
	 * blocks as a result of splitting the block by pressing enter, or with
	 * blocks as a result of splitting the block by pasting block content in the
	 * instance.
	 *
	 * @param {Object} record       The rich text value to split.
	 * @param {Array}  pastedBlocks The pasted blocks to insert, if any.
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
						toHTMLString( { value: before } ),
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
			// after the caret. Otherwise, do append an empty block if there
			// is no `onSplitMiddle` prop, but if there is and the content is
			// empty, the middle block is enough to set focus in.
			if (
				hasPastedBlocks
					? ! isEmpty( after )
					: ! onSplitMiddle || ! isEmpty( after )
			) {
				blocks.push(
					onSplit( toHTMLString( { value: after } ), isAfterOriginal )
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
		[ onReplace, onSplit, onSplitMiddle ]
	);

	const onEnter = useCallback(
		( { value, onChange, shiftKey } ) => {
			const canSplit = onReplace && onSplit;

			if ( onReplace ) {
				const transforms = getBlockTransforms( 'from' ).filter(
					( { type } ) => type === 'enter'
				);
				const transformation = findTransform( transforms, ( item ) => {
					return item.regExp.test( value.text );
				} );

				if ( transformation ) {
					onReplace( [
						transformation.transform( { content: value.text } ),
					] );
					__unstableMarkAutomaticChange();
					return;
				}
			}

			if ( onCustomEnter ) {
				onCustomEnter();
			}

			const { text, start: splitStart, end: splitEnd } = value;
			const canSplitAtEnd =
				onSplitAtEnd &&
				splitStart === splitEnd &&
				splitEnd === text.length;

			if ( shiftKey ) {
				if ( ! disableLineBreaks ) {
					onChange( insert( value, '\n' ) );
				}
			} else if ( canSplit ) {
				splitValue( value );
			} else if ( __unstableUseSplitSelection ) {
				__unstableSplitSelection();
			} else if ( canSplitAtEnd ) {
				onSplitAtEnd();
			} else if (
				// For some blocks it's desirable to split at the end of the
				// block when there are two line breaks at the end of the
				// block, so triple Enter exits the block.
				onSplitAtDoubleLineEnd &&
				splitStart === splitEnd &&
				splitEnd === text.length &&
				text.slice( -2 ) === '\n\n'
			) {
				value.start = value.end - 2;
				onChange( remove( value ) );
				onSplitAtDoubleLineEnd();
			} else if ( ! disableLineBreaks ) {
				onChange( insert( value, '\n' ) );
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[
			onReplace,
			onSplit,
			__unstableMarkAutomaticChange,
			splitValue,
			onSplitAtEnd,
		]
	);

	const onPaste = useCallback(
		( {
			value,
			onChange,
			html,
			plainText,
			isInternal,
			files,
			activeFormats,
		} ) => {
			// If the data comes from a rich text instance, we can directly use it
			// without filtering the data. The filters are only meant for externally
			// pasted content and remove inline styles.
			if ( isInternal ) {
				const pastedValue = create( {
					html,
					preserveWhiteSpace,
				} );
				addActiveFormats( pastedValue, activeFormats );
				onChange( insert( value, pastedValue ) );
				return;
			}

			if ( pastePlainText ) {
				onChange( insert( value, create( { text: plainText } ) ) );
				return;
			}

			// Only process file if no HTML is present.
			// Note: a pasted file may have the URL as plain text.
			if ( files && files.length && ! html ) {
				const content = pasteHandler( {
					HTML: filePasteHandler( files ),
					mode: 'BLOCKS',
					tagName,
					preserveWhiteSpace,
				} );

				// Allows us to ask for this information when we get a report.
				// eslint-disable-next-line no-console
				window.console.log( 'Received items:\n\n', files );

				if ( onReplace && isEmpty( value ) ) {
					onReplace( content );
				} else {
					splitValue( value, content );
				}

				return;
			}

			let mode = onReplace && onSplit ? 'AUTO' : 'INLINE';

			const isPastedURL = isURL( plainText.trim() );
			const presentEmbedHandlerPicker = () =>
				embedHandlerPickerRef.current?.presentPicker( {
					createEmbed: () =>
						onReplace( content, content.length - 1, -1 ),
					createLink: () =>
						createLinkInParagraph( plainText.trim(), onReplace ),
				} );

			if (
				__unstableEmbedURLOnPaste &&
				isEmpty( value ) &&
				isPastedURL
			) {
				mode = 'BLOCKS';
			}

			const content = pasteHandler( {
				HTML: html,
				plainText,
				mode,
				tagName,
				preserveWhiteSpace,
			} );

			if ( typeof content === 'string' ) {
				const valueToInsert = create( { html: content } );
				addActiveFormats( valueToInsert, activeFormats );
				onChange( insert( value, valueToInsert ) );
			} else if ( content.length > 0 ) {
				// When an URL is pasted in an empty paragraph then the EmbedHandlerPicker should showcase options allowing the transformation of that URL
				// into either an Embed block or a link within the target paragraph. If the paragraph is non-empty, the URL is pasted as text.
				const canPasteEmbed =
					isPastedURL &&
					content.length === 1 &&
					content[ 0 ].name === 'core/embed';
				if ( onReplace && isEmpty( value ) ) {
					if ( canPasteEmbed ) {
						onChange(
							insert( value, create( { text: plainText } ) )
						);
						if ( __unstableEmbedURLOnPaste ) {
							presentEmbedHandlerPicker();
						}
						return;
					}
					onReplace( content, content.length - 1, -1, {
						source: 'clipboard',
					} );
				} else {
					if ( canPasteEmbed ) {
						onChange(
							insert( value, create( { text: plainText } ) )
						);
						return;
					}
					splitValue( value, content );
				}
			}
		},
		[
			tagName,
			onReplace,
			onSplit,
			splitValue,
			__unstableEmbedURLOnPaste,
			preserveWhiteSpace,
			pastePlainText,
		]
	);

	const inputRule = useCallback(
		( value ) => {
			if ( ! onReplace ) {
				return;
			}

			const { start: startPosition, text } = value;
			const characterBefore = text.slice(
				startPosition - 1,
				startPosition
			);

			// The character right before the caret must be a plain space.
			if ( characterBefore !== ' ' ) {
				return;
			}

			const trimmedTextBefore = text.slice( 0, start ).trim();
			const prefixTransforms = getBlockTransforms( 'from' ).filter(
				( { type } ) => type === 'prefix'
			);
			const transformation = findTransform(
				prefixTransforms,
				( { prefix } ) => {
					return trimmedTextBefore === prefix;
				}
			);

			if ( ! transformation ) {
				return;
			}

			const content = toHTMLString( {
				value: insert( value, START_OF_SELECTED_AREA, 0, start ),
			} );
			const block = transformation.transform( content );
			const currentSelection = findSelection( [ block ] );
			onReplace( [ block ] );
			selectionChange( ...currentSelection );
			__unstableMarkAutomaticChange();
		},
		[ onReplace, start, selectionChange, __unstableMarkAutomaticChange ]
	);

	const mergedRef = useMergeRefs( [ providedRef, fallbackRef ] );

	return (
		<RichText
			clientId={ clientId }
			identifier={ identifier }
			nativeEditorRef={ mergedRef }
			value={ adjustedValue }
			onChange={ adjustedOnChange }
			selectionStart={ selectionStart }
			selectionEnd={ selectionEnd }
			onSelectionChange={ onSelectionChange }
			tagName={ tagName }
			start={ start }
			reversed={ reversed }
			placeholder={ placeholder }
			allowedFormats={ adjustedAllowedFormats }
			withoutInteractiveFormatting={ withoutInteractiveFormatting }
			onEnter={ onEnter }
			onDelete={ onDelete }
			onPaste={ onPaste }
			__unstableIsSelected={ isSelected }
			__unstableInputRule={ inputRule }
			__unstableOnEnterFormattedText={ enterFormattedText }
			__unstableOnExitFormattedText={ exitFormattedText }
			__unstableOnCreateUndoLevel={ __unstableMarkLastChangeAsPersistent }
			__unstableMarkAutomaticChange={ __unstableMarkAutomaticChange }
			__unstableDidAutomaticChange={ didAutomaticChange }
			__unstableUndo={ undo }
			__unstableDisableFormats={ disableFormats }
			preserveWhiteSpace={ preserveWhiteSpace }
			disabled={ disabled }
			unstableOnFocus={ unstableOnFocus }
			__unstableAllowPrefixTransformations={
				__unstableAllowPrefixTransformations
			}
			// Native props.
			blockIsSelected={
				originalIsSelected !== undefined
					? originalIsSelected
					: blockIsSelected
			}
			shouldBlurOnUnmount={ shouldBlurOnUnmount }
			__unstableMobileNoFocusOnMount={ __unstableMobileNoFocusOnMount }
			deleteEnter={ deleteEnter }
			placeholderTextColor={ placeholderTextColor }
			textAlign={ textAlign }
			selectionColor={ selectionColor }
			tagsToEliminate={ tagsToEliminate }
			disableEditingMenu={ disableEditingMenu }
			fontSize={ fontSize }
			fontFamily={ fontFamily }
			fontWeight={ fontWeight }
			fontStyle={ fontStyle }
			minWidth={ minWidth }
			maxWidth={ maxWidth }
			onBlur={ onBlur }
			disableSuggestions={ disableSuggestions }
			disableAutocorrection={ disableAutocorrection }
			containerWidth={ containerWidth }
			clearCurrentSelectionOnUnmount={ clearCurrentSelectionOnUnmount }
			// Props to be set on the editable container are destructured on the
			// element itself for web (see below), but passed through rich text
			// for native.
			id={ props.id }
			style={ props.style }
		>
			{ ( {
				isSelected: nestedIsSelected,
				value,
				onChange,
				onFocus,
				editableProps,
				editableTagName: TagName,
			} ) => (
				<>
					{ children && children( { value, onChange, onFocus } ) }
					{ nestedIsSelected && hasFormats && (
						<FormatToolbarContainer
							inline={ inlineToolbar }
							anchorRef={ fallbackRef.current }
						/>
					) }
					{ nestedIsSelected && <RemoveBrowserShortcuts /> }
					<Autocomplete
						onReplace={ onReplace }
						completers={ autocompleters }
						record={ value }
						onChange={ onChange }
						isSelected={ nestedIsSelected }
						contentRef={ fallbackRef }
					>
						{ ( { listBoxId, activeId, onKeyDown } ) => (
							<TagName
								{ ...editableProps }
								{ ...props }
								style={
									props.style
										? {
												...props.style,
												...editableProps.style,
										  }
										: editableProps.style
								}
								className={ clsx(
									classes,
									props.className,
									editableProps.className
								) }
								aria-autocomplete={
									listBoxId ? 'list' : undefined
								}
								aria-owns={ listBoxId }
								aria-activedescendant={ activeId }
								onKeyDown={ ( event ) => {
									onKeyDown( event );
									editableProps.onKeyDown( event );
								} }
							/>
						) }
					</Autocomplete>
					<EmbedHandlerPicker ref={ embedHandlerPickerRef } />
				</>
			) }
		</RichText>
	);
}

// This export does not actually implement a private API, but was exported
// under this name for interoperability with the web version of the RichText
// component.
export const PrivateRichText = withDeprecations(
	forwardRef( RichTextWrapper )
);

PrivateRichText.Content = Content;

PrivateRichText.isEmpty = ( value ) => {
	return ! value || value.length === 0;
};

PrivateRichText.Content.defaultProps = {
	format: 'string',
	value: '',
};

PrivateRichText.Raw = forwardRef( ( props, ref ) => (
	<RichText { ...props } nativeEditorRef={ ref } />
) );

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md
 */
export default PrivateRichText;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { __unstableRichTextInputEvent } from './input-event';
