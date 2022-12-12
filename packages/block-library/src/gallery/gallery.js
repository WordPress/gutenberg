/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useInnerBlocksProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
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
		__unstableLayoutClassNames: layoutClassNames,
	} = props;

	const { align, columns, caption, imageCrop } = attributes;

	const { children, ...innerBlocksProps } = useInnerBlocksProps( blockProps, {
		allowedBlocks,
		orientation: 'horizontal',
		renderAppender: false,
		__experimentalLayout: { type: 'default', alignments: [] },
	} );

	return (
		<figure
			{ ...innerBlocksProps }
			className={ classnames(
				blockProps.className,
				layoutClassNames,
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
				<View className="blocks-gallery-media-placeholder-wrapper">
					{ mediaPlaceholder }
				</View>
			) }
			<RichTextVisibilityHelper
				isHidden={ ! isSelected && RichText.isEmpty( caption ) }
				tagName="figcaption"
				className={ classnames(
					'blocks-gallery-caption',
					__experimentalGetElementClassName( 'caption' )
				) }
				aria-label={ __( 'Gallery caption text' ) }
				placeholder={ __( 'Write gallery caption…' ) }
				value={ caption }
				onChange={ ( value ) => setAttributes( { caption: value } ) }
				inlineToolbar
				__unstableOnSplitAtEnd={ () =>
					insertBlocksAfter( createBlock( getDefaultBlockName() ) )
				}
			/>
		</figure>
	);
};

function RichTextVisibilityHelper( {
	isHidden,
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
			{ ...richTextProps }
		/>
	);
}

export default Gallery;
