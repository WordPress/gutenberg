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
import { useRef, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { defaultColumnsNumber } from './shared';

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
	const { children, ...innerBlocksProps } = useInnerBlocksProps(
		{
			className: 'blocks-gallery-grid',
		},
		{
			allowedBlocks: [ 'core/image' ],
			orientation: 'horizontal',
			renderAppender: false,
			__experimentalLayout: { type: 'default', alignments: [] },
		}
	);

	useEffect( () => {
		if ( galleryRef.current && isSelected ) {
			galleryRef.current.parentElement.focus();
		}
	}, [ isSelected ] );

	return (
		<div
			ref={ galleryRef }
			{ ...blockProps }
			className={ classnames( blockProps.className, {
				[ `align${ align }` ]: align,
				[ `columns-${ columns }` ]: columns,
				'is-cropped': imageCrop,
			} ) }
		>
			<figure { ...innerBlocksProps }>
				{ children }
				{ mediaPlaceholder }
				<RichTextVisibilityHelper
					isHidden={ ! isSelected && RichText.isEmpty( caption ) }
					tagName="figcaption"
					className="blocks-gallery-caption"
					aria-label={ __( 'Gallery caption text' ) }
					placeholder={ __( 'Write gallery caption…' ) }
					value={ caption }
					onChange={ ( value ) =>
						setAttributes( { caption: value } )
					}
					inlineToolbar
					__unstableOnSplitAtEnd={ () =>
						insertBlocksAfter( createBlock( 'core/paragraph' ) )
					}
				/>
			</figure>
		</div>
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
