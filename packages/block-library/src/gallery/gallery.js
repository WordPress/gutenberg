/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { View } from '@wordpress/primitives';
import { forwardRef } from '@wordpress/element';

export const Gallery = ( props, captionRef ) => {
	const {
		attributes,
		isSelected,
		setAttributes,
		mediaPlaceholder,
		insertBlocksAfter,
		blockProps,
		__unstableLayoutClassNames: layoutClassNames,
		showCaption,
	} = props;

	const { align, columns, caption, imageCrop } = attributes;

	return (
		<figure
			{ ...blockProps }
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
			{ blockProps.children }
			{ isSelected && ! blockProps.children && (
				<View className="blocks-gallery-media-placeholder-wrapper">
					{ mediaPlaceholder }
				</View>
			) }
			{ showCaption &&
				( ! RichText.isEmpty( caption ) || isSelected ) && (
					<RichText
						identifier="caption"
						aria-label={ __( 'Gallery caption text' ) }
						placeholder={ __( 'Write gallery caption…' ) }
						value={ caption }
						className={ classnames(
							'blocks-gallery-caption',
							__experimentalGetElementClassName( 'caption' )
						) }
						ref={ captionRef }
						tagName="figcaption"
						onChange={ ( value ) =>
							setAttributes( { caption: value } )
						}
						inlineToolbar
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter(
								createBlock( getDefaultBlockName() )
							)
						}
					/>
				) }
		</figure>
	);
};

export default forwardRef( Gallery );
