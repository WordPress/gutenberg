/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { showNumbers, showArtists, showTrackLength } = attributes;
	const blockProps = useBlockProps.save( {
		className: clsx( 'wp-block-playlist__tracklist', {
			'wp-block-playlist__tracklist-artist-is-hidden': ! showArtists,
			'wp-block-playlist__tracklist-length-is-hidden': ! showTrackLength,
			'wp-block-playlist__tracklist-show-numbers': showNumbers,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <ol { ...innerBlocksProps } />;
}
