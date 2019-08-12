/**
 * External dependencies
 */
import classnames from 'classnames';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { RawHTML } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { pasteHandler, isUnmodifiedDefaultBlock } from '@wordpress/blocks';
import { withInstanceId, compose } from '@wordpress/compose';
import { RichText } from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import Autocomplete from '../autocomplete';
import BlockFormatControls from '../block-format-controls';
import FormatToolbar from './format-toolbar';
import { withBlockEditContext } from '../block-edit/context';
import { ListEdit } from './list-edit';

const wrapperClasses = 'editor-rich-text block-editor-rich-text';
const classes = 'editor-rich-text__editable block-editor-rich-text__editable';

function RichTextWraper( {
	tagName,
	value: originalValue,
	onChange: originalOnChange,
	selectionStart,
	selectionEnd,
	onSelectionChange,
	multiline,
	onTagNameChange,
	inlineToolbar,
	wrapperClassName,
	className,
	autocompleters,
	onReplace,
	onRemove,
	onMerge,
	onSplit,
	isCaretWithinFormattedText,
	onEnterFormattedText,
	onExitFormattedText,
	canUserUseUnfilteredHTML,
	isSelected: originalIsSelected,
	onCreateUndoLevel,
	placeholder,
	// From experimental filter.
	...experimentalProps
} ) {
	const adjustedValue = originalValue;
	const adjustedOnChange = originalOnChange;

	return (
		<RichText
			{ ...experimentalProps }
			value={ adjustedValue }
			onChange={ adjustedOnChange }
			selectionStart={ selectionStart }
			selectionEnd={ selectionEnd }
			onSelectionChange={ onSelectionChange }
			tagName={ tagName }
			wrapperClassName={ classnames( wrapperClasses, wrapperClassName ) }
			className={ classnames( classes, className ) }
			placeholder={ placeholder }
			__unstableIsSelected={ originalIsSelected }
			//__unstablePatterns={ getPatterns() }
			//__unstableEnterPatterns={ getEnterPatterns() }
			__unstablePasteHandler={ pasteHandler }
			__unstableAutocomplete={ Autocomplete }
			__unstableAutocompleters={ autocompleters }
			__unstableOnReplace={ onReplace }
			__unstableOnRemove={ onRemove }
			__unstableOnMerge={ onMerge }
			__unstableOnSplit={ onSplit }
			__unstableMultiline={ multiline }
			__unstableIsCaretWithinFormattedText={ isCaretWithinFormattedText }
			__unstableOnEnterFormattedText={ onEnterFormattedText }
			__unstableOnExitFormattedText={ onExitFormattedText }
			__unstableCanUserUseUnfilteredHTML={ canUserUseUnfilteredHTML }
			__unstableOnCreateUndoLevel={ onCreateUndoLevel }
		>
			{ ( { isSelected, value, onChange } ) =>
				<View>
					{ isSelected && multiline === 'li' && (
						<ListEdit
							onTagNameChange={ onTagNameChange }
							tagName={ tagName }
							value={ value }
							onChange={ onChange }
						/>
					) }
					{ isSelected && ! inlineToolbar && (
						<BlockFormatControls>
							<FormatToolbar />
						</BlockFormatControls>
					) }
				</View>
			}
		</RichText>
	);
}

const RichTextContainer = compose( [
	withInstanceId,
	withBlockEditContext( ( { clientId, onCaretVerticalPositionChange, isSelected }, ownProps ) => {
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
		blockIsSelected,
	} ) => {
		const { getFormatTypes } = select( 'core/rich-text' );
		const {
			getSelectionStart,
			getSelectionEnd,
			__unstableGetBlockWithoutInnerBlocks,
		} = select( 'core/block-editor' );

		const selectionStart = getSelectionStart();
		const selectionEnd = getSelectionEnd();

		if ( isSelected === undefined ) {
			isSelected = (
				selectionStart.clientId === clientId &&
				selectionStart.attributeKey === identifier
			);
		}

		// If the block of this RichText is unmodified then it's a candidate for replacing when adding a new block.
		// In order to fix https://github.com/wordpress-mobile/gutenberg-mobile/issues/1126, let's blur on unmount in that case.
		// This apparently assumes functionality the BlockHlder actually
		const block = clientId && __unstableGetBlockWithoutInnerBlocks( clientId );
		const shouldBlurOnUnmount = block && isSelected && isUnmodifiedDefaultBlock( block );

		return {
			formatTypes: getFormatTypes(),
			selectionStart: isSelected ? selectionStart.offset : undefined,
			selectionEnd: isSelected ? selectionEnd.offset : undefined,
			isSelected,
			blockIsSelected,
			shouldBlurOnUnmount,
		};
	} ),
	withDispatch( ( dispatch, {
		clientId,
		instanceId,
		identifier = instanceId,
	} ) => {
		const {
			__unstableMarkLastChangeAsPersistent,
			selectionChange,
		} = dispatch( 'core/block-editor' );

		return {
			onCreateUndoLevel: __unstableMarkLastChangeAsPersistent,
			onSelectionChange( start, end ) {
				selectionChange( clientId, identifier, start, end );
			},
		};
	} ),
] )( RichTextWraper );

RichTextContainer.Content = ( { value, format, tagName: Tag, multiline, ...props } ) => {
	let content;
	let html = value;
	let MultilineTag;

	if ( multiline === true || multiline === 'p' || multiline === 'li' ) {
		MultilineTag = multiline === true ? 'p' : multiline;
	}

	if ( ! html && MultilineTag ) {
		html = `<${ MultilineTag }></${ MultilineTag }>`;
	}

	switch ( format ) {
		case 'string':
			content = <RawHTML>{ html }</RawHTML>;
			break;
	}

	if ( Tag ) {
		return <Tag { ...props }>{ content }</Tag>;
	}

	return content;
};

RichTextContainer.isEmpty = ( value = '' ) => {
	// Handle deprecated `children` and `node` sources.
	if ( Array.isArray( value ) ) {
		return ! value || value.length === 0;
	}

	return value.length === 0;
};

RichTextContainer.Content.defaultProps = {
	format: 'string',
	value: '',
};

/**
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/rich-text/README.md
 */
export default RichTextContainer;
export { RichTextShortcut } from './shortcut';
export { RichTextToolbarButton } from './toolbar-button';
export { __unstableRichTextInputEvent } from './input-event';
