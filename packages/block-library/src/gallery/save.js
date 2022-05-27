/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import saveWithoutInnerBlocks from './v1/save';
import { isGalleryV2Enabled } from './shared';

export default function saveWithInnerBlocks( { attributes } ) {
	if ( ! isGalleryV2Enabled() ) {
		return saveWithoutInnerBlocks( { attributes } );
	}

	const { caption, columns, imageCrop } = attributes;

	const className = classnames( 'has-nested-images', {
		[ `columns-${ columns }` ]: columns !== undefined,
		[ `columns-default` ]: columns === undefined,
		'is-cropped': imageCrop,
	} );
	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return (
		<figure { ...innerBlocksProps }>
			{ innerBlocksProps.children }
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					tagName="figcaption"
					className="blocks-gallery-caption"
					value={ caption }
				/>
			) }
		</figure>
	);
}
