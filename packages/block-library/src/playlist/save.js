/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function saveWithInnerBlocks( { attributes } ) {
	const { showNumbers, showTracklist, showArtists, showTrackLength } =
		attributes;

	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return (
		<figure { ...innerBlocksProps }>
			<ol
				className={ clsx( 'wp-block-playlist__tracklist', {
					'wp-block-playlist__tracklist-is-hidden': ! showTracklist,
					'wp-block-playlist__tracklist-artist-is-hidden':
						! showArtists,
					'wp-block-playlist__tracklist-length-is-hidden':
						! showTrackLength,
					'wp-block-playlist__tracklist-show-numbers': showNumbers,
				} ) }
			>
				{ innerBlocksProps.children }
			</ol>
		</figure>
	);
}
