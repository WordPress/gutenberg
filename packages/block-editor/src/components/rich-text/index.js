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
	Platform,
	useRef,
	useCallback,
	forwardRef,
} from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	pasteHandler,
	children as childrenSource,
	getBlockTransforms,
	findTransform,
	isUnmodifiedDefaultBlock,
} from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import {
	__experimentalRichText as RichText,
	__unstableCreateElement,
	isEmpty,
	__unstableIsEmptyLine as isEmptyLine,
	insert,
	__unstableInsertLineSeparator as insertLineSeparator,
	create,
	replace,
	split,
	__UNSTABLE_LINE_SEPARATOR as LINE_SEPARATOR,
	toHTMLString,
	slice,
} from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import { isURL } from '@wordpress/url';
import { regexp } from '@wordpress/shortcode';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import { useBlockEditContext } from '../block-edit';
import { RemoveBrowserShortcuts } from './remove-browser-shortcuts';
import { filePasteHandler } from './file-paste-handler';
import FormatToolbarContainer from './format-toolbar-container';

const wrapperClasses = 'block-editor-rich-text';
const classes = 'block-editor-rich-text__editable';

/**
 * Get the multiline tag based on the multiline prop.
 *
 * @param {?(string|boolean)} multiline The multiline prop.
 *
 * @return {?string} The multiline tag.
 */
function getMultilineTag( multiline ) {
	if ( multiline !== true && multiline !== 'p' && multiline !== 'li' ) {
		return;
	}

	return multiline === true ? 'p' : multiline;
}

function getAllowedFormats( {
	allowedFormats,
	formattingControls,
	disableFormats,
} ) {
	if ( disableFormats ) {
		return getAllowedFormats.EMPTY_ARRAY;
	}

	if ( ! allowedFormats && ! formattingControls ) {
		return;
	}

	if ( allowedFormats ) {
		return allowedFormats;
	}

	deprecated( 'wp.blockEditor.RichText formattingControls prop', {
		alternative: 'allowedFormats',
	} );

	return formattingControls.map( ( name ) => `core/${ name }` );
}

getAllowedFormats.EMPTY_ARRAY = [];

const isShortcode = ( text ) => regexp( '.*' ).test( text );

function RichTextWrapper(
	{
		children,
		tagName,
		value: originalValue,
		onChange: originalOnChange,
		isSelected: originalIsSelected,
		multiline,
		inlineToolbar,
		wrapperClassName,
		autocompleters,
		onReplace,
		placeholder,
		keepPlaceholderOnFocus,
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
		__unstableEmbedURLOnPaste,
		__unstableDisableFormats: disableFormats,
		disableLineBreaks,
		unstableOnFocus,
		__unstableAllowPrefixTransformations,
		__unstableMultilineRootTag,
		// Native props.
		__unstableMobileNoFocusOnMount,
		deleteEnter,
		placeholderTextColor,
		textAlign,
		selectionColor,
		tagsToEliminate,
		rootTagsToEliminate,
		disableEditingMenu,
		fontSize,
		fontFamily,
		fontWeight,
		fontStyle,
		minWidth,
		maxWidth,
		onBlur,
		setRef,
		...props
	},
	forwardedRef
) {
	const instanceId = useInstanceId( RichTextWrapper );

	identifier = identifier || instanceId;

	const fallbackRef = useRef();
	const ref = forwardedRef || fallbackRef;
	const {
		clientId,
		onCaretVerticalPositionChange,
		isSelected: blockIsSelected,
	} = useBlockEditContext();
	const selector = ( select ) => {
		const {
			isCaretWithinFormattedText,
			getSelectionStart,
			getSelectionEnd,
			getSettings,
			didAutomaticChange,
			__unstableGetBlockWithoutInnerBlocks,
			isMultiSelecting,
			hasMultiSelection,
		} = select( 'core/block-editor' );

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
			// This apparently assumes functionality the BlockHlder actually
			const block =
				clientId && __unstableGetBlockWithoutInnerBlocks( clientId );
			const shouldBlurOnUnmount =
				block && isSelected && isUnmodifiedDefaultBlock( block );
			extraProps = {
				shouldBlurOnUnmount,
			};
		}

		return {
			isCaretWithinFormattedText: isCaretWithinFormattedText(),
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
			didAutomaticChange: didAutomaticChange(),
			disabled: isMultiSelecting() || hasMultiSelection(),
			undo,
			...extraProps,
		};
	};
	// This selector must run on every render so the right selection state is
	// retreived from the store on merge.
	// To do: fix this somehow.
	const {
		isCaretWithinFormattedText,
		selectionStart,
		selectionEnd,
		isSelected,
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
	} = useDispatch( 'core/block-editor' );
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

	const onDelete = useCallback(
		( { value, isReverse } ) => {
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
		},
		[ onMerge, onRemove ]
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
						} )
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
						} )
					)
				);
			}

			// If there are pasted blocks, set the selection to the last one.
			// Otherwise, set the selection to the second block.
			const indexToSelect = hasPastedBlocks ? lastPastedBlockIndex : 1;

			// If there are pasted blocks, move the caret to the end of the selected block
			// Otherwise, retain the default value.
			const initialPosition = hasPastedBlocks ? -1 : null;

			onReplace( blocks, indexToSelect, initialPosition );
		},
		[ onReplace, onSplit, multilineTag, onSplitMiddle ]
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
				}
			}

			if ( multiline ) {
				if ( shiftKey ) {
					if ( ! disableLineBreaks ) {
						onChange( insert( value, '\n' ) );
					}
				} else if ( canSplit && isEmptyLine( value ) ) {
					splitValue( value );
				} else {
					onChange( insertLineSeparator( value ) );
				}
			} else {
				const { text, start, end } = value;
				const canSplitAtEnd =
					onSplitAtEnd && start === end && end === text.length;

				if ( shiftKey || ( ! canSplit && ! canSplitAtEnd ) ) {
					if ( ! disableLineBreaks ) {
						onChange( insert( value, '\n' ) );
					}
				} else if ( ! canSplit && canSplitAtEnd ) {
					onSplitAtEnd();
				} else if ( canSplit ) {
					splitValue( value );
				}
			}
		},
		[
			onReplace,
			onSplit,
			__unstableMarkAutomaticChange,
			multiline,
			splitValue,
			onSplitAtEnd,
		]
	);

	const onPaste = useCallback(
		( { value, onChange, html, plainText, files, activeFormats } ) => {
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

			// Force the blocks mode when the user is pasting
			// on a new line & the content resembles a shortcode.
			// Otherwise it's going to be detected as inline
			// and the shortcode won't be replaced.
			if (
				mode === 'AUTO' &&
				isEmpty( value ) &&
				isShortcode( plainText )
			) {
				mode = 'BLOCKS';
			}

			if (
				__unstableEmbedURLOnPaste &&
				isEmpty( value ) &&
				isURL( plainText.trim() )
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
				let valueToInsert = create( { html: content } );

				// If there are active formats, merge them with the pasted formats.
				if ( activeFormats.length ) {
					let index = valueToInsert.formats.length;

					while ( index-- ) {
						valueToInsert.formats[ index ] = [
							...activeFormats,
							...( valueToInsert.formats[ index ] || [] ),
						];
					}
				}

				// If the content should be multiline, we should process text
				// separated by a line break as separate lines.
				if ( multiline ) {
					valueToInsert = replace(
						valueToInsert,
						/\n+/g,
						LINE_SEPARATOR
					);
				}

				onChange( insert( value, valueToInsert ) );
			} else if ( content.length > 0 ) {
				if ( onReplace && isEmpty( value ) ) {
					onReplace( content, content.length - 1, -1 );
				} else {
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
			multiline,
			preserveWhiteSpace,
		]
	);

	const inputRule = useCallback(
		( value, valueToFormat ) => {
			if ( ! onReplace ) {
				return;
			}

			const { start, text } = value;
			const characterBefore = text.slice( start - 1, start );

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

			const content = valueToFormat( slice( value, start, text.length ) );
			const block = transformation.transform( content );

			onReplace( [ block ] );
			__unstableMarkAutomaticChange();
		},
		[ onReplace, __unstableMarkAutomaticChange ]
	);

	const content = (
		<RichText
			clientId={ clientId }
			identifier={ identifier }
			ref={ ref }
			value={ adjustedValue }
			onChange={ adjustedOnChange }
			selectionStart={ selectionStart }
			selectionEnd={ selectionEnd }
			onSelectionChange={ onSelectionChange }
			tagName={ tagName }
			placeholder={ placeholder }
			allowedFormats={ adjustedAllowedFormats }
			withoutInteractiveFormatting={ withoutInteractiveFormatting }
			onEnter={ onEnter }
			onDelete={ onDelete }
			onPaste={ onPaste }
			__unstableIsSelected={ isSelected }
			__unstableInputRule={ inputRule }
			__unstableMultilineTag={ multilineTag }
			__unstableIsCaretWithinFormattedText={ isCaretWithinFormattedText }
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
			__unstableMultilineRootTag={ __unstableMultilineRootTag }
			// Native props.
			onCaretVerticalPositionChange={ onCaretVerticalPositionChange }
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
			rootTagsToEliminate={ rootTagsToEliminate }
			disableEditingMenu={ disableEditingMenu }
			fontSize={ fontSize }
			fontFamily={ fontFamily }
			fontWeight={ fontWeight }
			fontStyle={ fontStyle }
			minWidth={ minWidth }
			maxWidth={ maxWidth }
			onBlur={ onBlur }
			setRef={ setRef }
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
							anchorRef={ ref.current }
						/>
					) }
					{ nestedIsSelected && <RemoveBrowserShortcuts /> }
					<Autocomplete
						onReplace={ onReplace }
						completers={ autocompleters }
						record={ value }
						onChange={ onChange }
						isSelected={ nestedIsSelected }
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
								className={ classnames(
									classes,
									props.className,
									editableProps.className,
									{
										'keep-placeholder-on-focus': keepPlaceholderOnFocus,
									}
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
				</>
			) }
		</RichText>
	);

	if ( ! wrapperClassName ) {
		return content;
	}

	deprecated( 'wp.blockEditor.RichText wrapperClassName prop', {
		alternative: 'className prop or create your own wrapper div',
	} );

	return (
		<div className={ classnames( wrapperClasses, wrapperClassName ) }>
			{ content }
		</div>
	);
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

ForwardedRichTextContainer.Content.defaultProps = {
	format: 'string',
	value: '',
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/rich-text/README.md
 */
export default ForwardedRichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { __unstableRichTextInputEvent } from './input-event';
