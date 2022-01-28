/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText, useInnerBlocksProps } from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { View } from '@wordpress/primitives';

const allowedBlocks = [ 'core/image' ];

export const Gallery = ( props ) => {
	const {
		attributes,
		isSelected,
		setAttributes,
		mediaPlaceholder,
		insertBlocksAfter,
		blockProps,
	} = props;

	const { align, columns, caption, imageCrop } = attributes;

	const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
		allowedBlocks,
		orientation: 'horizontal',
		renderAppender: false,
		__experimentalLayout: { type: 'default', alignments: [] },
	} );

	const [ captionFocused, setCaptionFocused ] = useState( false );

	function onFocusCaption() {
		if ( ! captionFocused ) {
			setCaptionFocused( true );
		}
	}

	function removeCaptionFocus() {
		if ( captionFocused ) {
			setCaptionFocused( false );
		}
	}

	useEffect( () => {
		if ( ! isSelected ) {
			setCaptionFocused( false );
		}
	}, [ isSelected ] );

	return (
		<figure
			{ ...innerBlocksProps }
			className={ classnames(
				blockProps.className,
				'blocks-gallery-grid',
				{
					[ `align${ align }` ]: align,
					[ `columns-${ columns }` ]: columns !== undefined,
					[ `columns-default` ]: columns === undefined,
					'is-cropped': imageCrop,
				}
			) }
		>
			{ children }

			{ isSelected && ! children && (
				<View
					className="blocks-gallery-media-placeholder-wrapper"
					onClick={ removeCaptionFocus }
				>
					{ mediaPlaceholder }
				</View>
			) }
			<RichTextVisibilityHelper
				isHidden={ ! isSelected && RichText.isEmpty( caption ) }
				captionFocused={ captionFocused }
				onFocusCaption={ onFocusCaption }
				tagName="figcaption"
				className="blocks-gallery-caption"
				aria-label={ __( 'Gallery caption text' ) }
				placeholder={ __( 'Write gallery caption…' ) }
				value={ caption }
				onChange={ ( value ) => setAttributes( { caption: value } ) }
				inlineToolbar
				__unstableOnSplitAtEnd={ () =>
					insertBlocksAfter( createBlock( 'core/paragraph' ) )
				}
			/>
		</figure>
	);
};

function RichTextVisibilityHelper( {
	isHidden,
	captionFocused,
	onFocusCaption,
	className,
	value,
	placeholder,
	tagName,
	captionRef,
	...richTextProps
} ) {
	if ( isHidden ) {
		return <VisuallyHidden as={ RichText } { ...richTextProps } />;
	}

	return (
		<RichText
			ref={ captionRef }
			value={ value }
			placeholder={ placeholder }
			className={ className }
			tagName={ tagName }
			isSelected={ captionFocused }
			onClick={ onFocusCaption }
			{ ...richTextProps }
		/>
	);
}

export default Gallery;
