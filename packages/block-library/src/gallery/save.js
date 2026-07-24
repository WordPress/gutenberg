/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

export default function saveWithInnerBlocks( { attributes } ) {
	const { caption, columns, imageCrop, dynamicContent } = attributes;

	const captionElement = ! RichText.isEmpty( caption ) && (
		<RichText.Content
			tagName="figcaption"
			className={ clsx(
				'blocks-gallery-caption',
				__experimentalGetElementClassName( 'caption' )
			) }
			value={ caption }
		/>
	);

	// In dynamic mode the images are resolved at render time and the `<figure>`
	// wrapper is built by the server render callback (`block_core_gallery_render()`),
	// so persist only the gallery-level caption. It still sources from
	// `.blocks-gallery-caption`, so it round-trips; the render callback drops it in
	// after the resolved images. Nothing is saved when there's no caption.
	if ( dynamicContent ) {
		return captionElement || null;
	}

	const className = clsx( 'has-nested-images', {
		[ `columns-${ columns }` ]: columns !== undefined,
		[ `columns-default` ]: columns === undefined,
		'is-cropped': imageCrop,
	} );
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return (
		<figure { ...innerBlocksProps }>
			{ innerBlocksProps.children }
			{ captionElement }
		</figure>
	);
}
