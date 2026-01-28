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
	const {
		caption,
		showNumbers,
		showTracklist,
		showArtists,
		tagName: TagName = showNumbers ? 'ol' : 'ul',
	} = attributes;

	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return (
		<figure { ...innerBlocksProps }>
			<TagName
				className={ clsx( 'wp-block-playlist__tracklist', {
					'wp-block-playlist__tracklist-is-hidden': ! showTracklist,
					'wp-block-playlist__tracklist-artist-is-hidden':
						! showArtists,
				} ) }
			>
				{ innerBlocksProps.children }
			</TagName>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					tagName="figcaption"
					className={ __experimentalGetElementClassName( 'caption' ) }
					value={ caption }
				/>
			) }
		</figure>
	);
}
