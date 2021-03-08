/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

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

	const {
		imageCount,
		align,
		columns = defaultColumnsNumber( imageCount ),
		caption,
		imageCrop,
	} = attributes;
	const galleryRef = useRef();
	const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
		allowedBlocks,
		orientation: 'horizontal',
		renderAppender: false,
		__experimentalLayout: { type: 'default', alignments: [] },
	} );

	useEffect( () => {
		if ( galleryRef.current && isSelected ) {
			galleryRef.current.parentElement.focus();
		}
	}, [ isSelected ] );

	return (
		<figure
			ref={ galleryRef }
			{ ...innerBlocksProps }
			className={ classnames(
				blockProps.className,
				'blocks-gallery-grid',
				{
					[ `align${ align }` ]: align,
					[ `columns-${ columns }` ]: columns,
					'is-cropped': imageCrop,
				}
			) }
		>
			{ children }
			<RichTextVisibilityHelper
				isHidden={ ! isSelected && RichText.isEmpty( caption ) }
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
			{ mediaPlaceholder }
		</figure>
	);
};

function RichTextVisibilityHelper( { isHidden, ...richTextProps } ) {
	return isHidden ? (
		<VisuallyHidden as={ RichText } { ...richTextProps } />
	) : (
		<RichText { ...richTextProps } />
	);
}

export default Gallery;
