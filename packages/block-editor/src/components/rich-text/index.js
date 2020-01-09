/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { RawHTML, Component, useRef, Platform, forwardRef } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { pasteHandler, children as childrenSource, getBlockTransforms, findTransform, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { withInstanceId, compose } from '@wordpress/compose';
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

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import { withBlockEditContext } from '../block-edit/context';
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

class RichTextWrapper extends Component {
	constructor() {
		super( ...arguments );
		this.onEnter = this.onEnter.bind( this );
		this.onSplit = this.onSplit.bind( this );
		this.onPaste = this.onPaste.bind( this );
		this.onDelete = this.onDelete.bind( this );
		this.inputRule = this.inputRule.bind( this );
	}

	onEnter( { value, onChange, shiftKey } ) {
		const {
			onReplace,
			onSplit,
			multiline,
			markAutomaticChange,
		} = this.props;
		const canSplit = onReplace && onSplit;

		if ( onReplace ) {
			const transforms = getBlockTransforms( 'from' )
				.filter( ( { type } ) => type === 'enter' );
			const transformation = findTransform( transforms, ( item ) => {
				return item.regExp.test( value.text );
			} );

			if ( transformation ) {
				onReplace( [
					transformation.transform( { content: value.text } ),
				] );
				markAutomaticChange();
			}
		}

		if ( multiline ) {
			if ( shiftKey ) {
				onChange( insert( value, '\n' ) );
			} else if ( canSplit && isEmptyLine( value ) ) {
				this.onSplit( value );
			} else {
				onChange( insertLineSeparator( value ) );
			}
		} else if ( shiftKey || ! canSplit ) {
			onChange( insert( value, '\n' ) );
		} else {
			this.onSplit( value );
		}
	}

	onDelete( { value, isReverse } ) {
		const { onMerge, onRemove } = this.props;

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
	}

	onPaste( { value, onChange, html, plainText, files, activeFormats } ) {
		const {
			onReplace,
			onSplit,
			tagName,
			canUserUseUnfilteredHTML,
			multiline,
			__unstableEmbedURLOnPaste,
		} = this.props;

		// Only process file if no HTML is present.
		// Note: a pasted file may have the URL as plain text.
		if ( files && files.length && ! html ) {
			const content = pasteHandler( {
				HTML: filePasteHandler( files ),
				mode: 'BLOCKS',
				tagName,
			} );

			// Allows us to ask for this information when we get a report.
			// eslint-disable-next-line no-console
			window.console.log( 'Received items:\n\n', files );

			if ( onReplace && isEmpty( value ) ) {
				onReplace( content );
			} else {
				this.onSplit( value, content );
			}

			return;
		}

		let mode = onReplace && onSplit ? 'AUTO' : 'INLINE';

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
			canUserUseUnfilteredHTML,
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
				valueToInsert = replace( valueToInsert, /\n+/g, LINE_SEPARATOR );
			}

			onChange( insert( value, valueToInsert ) );
		} else if ( content.length > 0 ) {
			if ( onReplace && isEmpty( value ) ) {
				onReplace( content );
			} else {
				this.onSplit( value, content );
			}
		}
	}

	/**
	 * Signals to the RichText owner that the block can be replaced with two
	 * blocks as a result of splitting the block by pressing enter, or with
	 * blocks as a result of splitting the block by pasting block content in the
	 * instance.
	 *
	 * @param  {Object} record       The rich text value to split.
	 * @param  {Array}  pastedBlocks The pasted blocks to insert, if any.
	 */
	onSplit( record, pastedBlocks = [] ) {
		const {
			onReplace,
			onSplit,
			__unstableOnSplitMiddle: onSplitMiddle,
			multiline,
		} = this.props;

		if ( ! onReplace || ! onSplit ) {
			return;
		}

		const blocks = [];
		const [ before, after ] = split( record );
		const hasPastedBlocks = pastedBlocks.length > 0;
		const multilineTag = getMultilineTag( multiline );

		// Create a block with the content before the caret if there's no pasted
		// blocks, or if there are pasted blocks and the value is not empty.
		// We do not want a leading empty block on paste, but we do if split
		// with e.g. the enter key.
		if ( ! hasPastedBlocks || ! isEmpty( before ) ) {
			blocks.push( onSplit( toHTMLString( {
				value: before,
				multilineTag,
			} ) ) );
		}

		if ( hasPastedBlocks ) {
			blocks.push( ...pastedBlocks );
		} else if ( onSplitMiddle ) {
			blocks.push( onSplitMiddle() );
		}

		// If there's pasted blocks, append a block with the content after the
		// caret. Otherwise, do append and empty block if there is no
		// `onSplitMiddle` prop, but if there is and the content is empty, the
		// middle block is enough to set focus in.
		if ( hasPastedBlocks || ! onSplitMiddle || ! isEmpty( after ) ) {
			blocks.push( onSplit( toHTMLString( {
				value: after,
				multilineTag,
			} ) ) );
		}

		// If there are pasted blocks, set the selection to the last one.
		// Otherwise, set the selection to the second block.
		const indexToSelect = hasPastedBlocks ? blocks.length - 1 : 1;

		onReplace( blocks, indexToSelect );
	}

	inputRule( value, valueToFormat ) {
		const { onReplace, markAutomaticChange } = this.props;

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
		const prefixTransforms = getBlockTransforms( 'from' )
			.filter( ( { type } ) => type === 'prefix' );
		const transformation = findTransform( prefixTransforms, ( { prefix } ) => {
			return trimmedTextBefore === prefix;
		} );

		if ( ! transformation ) {
			return;
		}

		const content = valueToFormat( slice( value, start, text.length ) );
		const block = transformation.transform( content );

		onReplace( [ block ] );
		markAutomaticChange();
	}

	getAllowedFormats() {
		const { allowedFormats, formattingControls } = this.props;

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

	render() {
		const {
			children,
			tagName,
			value: originalValue,
			onChange: originalOnChange,
			selectionStart,
			selectionEnd,
			onSelectionChange,
			multiline,
			inlineToolbar,
			wrapperClassName,
			className,
			autocompleters,
			onReplace,
			isCaretWithinFormattedText,
			onEnterFormattedText,
			onExitFormattedText,
			isSelected: originalIsSelected,
			onCreateUndoLevel,
			markAutomaticChange,
			didAutomaticChange,
			undo,
			placeholder,
			keepPlaceholderOnFocus,
			// eslint-disable-next-line no-unused-vars
			allowedFormats,
			withoutInteractiveFormatting,
			// eslint-disable-next-line no-unused-vars
			onRemove,
			// eslint-disable-next-line no-unused-vars
			onMerge,
			// eslint-disable-next-line no-unused-vars
			onSplit,
			// eslint-disable-next-line no-unused-vars
			canUserUseUnfilteredHTML,
			// eslint-disable-next-line no-unused-vars
			instanceId,
			// To do: find a better way to implicitly inherit props.
			start,
			reversed,
			style,
			preserveWhiteSpace,
			disabled,
			forwardedRef,
			...props
		} = this.props;
		const multilineTag = getMultilineTag( multiline );

		const adjustedAllowedFormats = this.getAllowedFormats();
		const hasFormats = ! adjustedAllowedFormats || adjustedAllowedFormats.length > 0;
		let adjustedValue = originalValue;
		let adjustedOnChange = originalOnChange;

		// Handle deprecated format.
		if ( Array.isArray( originalValue ) ) {
			adjustedValue = childrenSource.toHTML( originalValue );
			adjustedOnChange = ( newValue ) => originalOnChange( childrenSource.fromDOM(
				__unstableCreateElement( document, newValue ).childNodes
			) );
		}

		const content = (
			<RichText
				{ ...props }
				ref={ forwardedRef }
				value={ adjustedValue }
				onChange={ adjustedOnChange }
				selectionStart={ selectionStart }
				selectionEnd={ selectionEnd }
				onSelectionChange={ onSelectionChange }
				tagName={ tagName }
				className={ classnames( classes, className, {
					'is-selected': originalIsSelected,
					'keep-placeholder-on-focus': keepPlaceholderOnFocus,
				} ) }
				placeholder={ placeholder }
				allowedFormats={ adjustedAllowedFormats }
				withoutInteractiveFormatting={ withoutInteractiveFormatting }
				onEnter={ this.onEnter }
				onDelete={ this.onDelete }
				onPaste={ this.onPaste }
				__unstableIsSelected={ originalIsSelected }
				__unstableInputRule={ this.inputRule }
				__unstableMultilineTag={ multilineTag }
				__unstableIsCaretWithinFormattedText={ isCaretWithinFormattedText }
				__unstableOnEnterFormattedText={ onEnterFormattedText }
				__unstableOnExitFormattedText={ onExitFormattedText }
				__unstableOnCreateUndoLevel={ onCreateUndoLevel }
				__unstableMarkAutomaticChange={ markAutomaticChange }
				__unstableDidAutomaticChange={ didAutomaticChange }
				__unstableUndo={ undo }
				style={ style }
				preserveWhiteSpace={ preserveWhiteSpace }
				disabled={ disabled }
				start={ start }
				reversed={ reversed }
			>
				{ ( { isSelected, value, onChange, Editable } ) =>
					<>
						{ children && children( { value, onChange } ) }
						{ isSelected && hasFormats && ( <FormatToolbarContainer inline={ inlineToolbar } anchorRef={ forwardedRef.current } /> ) }
						{ isSelected && <RemoveBrowserShortcuts /> }
						<Autocomplete
							onReplace={ onReplace }
							completers={ autocompleters }
							record={ value }
							onChange={ onChange }
							isSelected={ isSelected }
						>
							{ ( { listBoxId, activeId, onKeyDown } ) =>
								<Editable
									aria-autocomplete={ listBoxId ? 'list' : undefined }
									aria-owns={ listBoxId }
									aria-activedescendant={ activeId }
									start={ start }
									reversed={ reversed }
									onKeyDown={ onKeyDown }
								/>
							}
						</Autocomplete>
					</>
				}
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
}

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( { clientId, onCaretVerticalPositionChange, isSelected }, ownProps ) => {
		if ( Platform.OS === 'web' ) {
			return { clientId };
		}
		return {
			clientId,
			blockIsSelected: ownProps.isSelected !== undefined ? ownProps.isSelected : isSelected,
			onCaretVerticalPositionChange,
		};
	} ),
	withSelect( ( select, {
		clientId,
		instanceId,
		identifier = instanceId,
		isSelected,
	} ) => {
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
		const {
			__experimentalCanUserUseUnfilteredHTML,
			__experimentalUndo: undo,
		} = getSettings();
		if ( isSelected === undefined ) {
			isSelected = (
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier
			);
		} else if ( isSelected ) {
			isSelected = selectionStart.clientId === clientId;
		}

		let extraProps = {};
		if ( Platform.OS === 'native' ) {
			// If the block of this RichText is unmodified then it's a candidate for replacing when adding a new block.
			// In order to fix https://github.com/wordpress-mobile/gutenberg-mobile/issues/1126, let's blur on unmount in that case.
			// This apparently assumes functionality the BlockHlder actually
			const block = clientId && __unstableGetBlockWithoutInnerBlocks( clientId );
			const shouldBlurOnUnmount = block && isSelected && isUnmodifiedDefaultBlock( block );
			extraProps = {
				shouldBlurOnUnmount,
			};
		}

		return {
			canUserUseUnfilteredHTML: __experimentalCanUserUseUnfilteredHTML,
			isCaretWithinFormattedText: isCaretWithinFormattedText(),
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
			didAutomaticChange: didAutomaticChange(),
			disabled: isMultiSelecting() || hasMultiSelection(),
			undo,
			...extraProps,
		};
	} ),
	withDispatch( ( dispatch, {
		clientId,
		instanceId,
		identifier = instanceId,
	} ) => {
		const {
			__unstableMarkLastChangeAsPersistent,
			enterFormattedText,
			exitFormattedText,
			selectionChange,
			__unstableMarkAutomaticChange,
		} = dispatch( 'core/block-editor' );

		return {
			onCreateUndoLevel: __unstableMarkLastChangeAsPersistent,
			onEnterFormattedText: enterFormattedText,
			onExitFormattedText: exitFormattedText,
			onSelectionChange( start, end ) {
				selectionChange( clientId, identifier, start, end );
			},
			markAutomaticChange: __unstableMarkAutomaticChange,
		};
	} ),
] )( RichTextWrapper );

const ForwardedRichTextContainer = forwardRef( ( props, ref ) => {
	const fallbackRef = useRef();
	return <RichTextContainer { ...props } forwardedRef={ ref || fallbackRef } />;
} );

ForwardedRichTextContainer.Content = ( { value, tagName: Tag, multiline, ...props } ) => {
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
