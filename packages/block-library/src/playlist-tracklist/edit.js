/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
} from '@wordpress/block-editor';

const PlaylistTracklistEdit = ( { context } ) => {
	const {
		showTracklist = true,
		showArtists = true,
		showNumbers = true,
		showTrackLength = true,
	} = context;
	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-playlist__tracklist', {
			'wp-block-playlist__tracklist-is-hidden': ! showTracklist,
			'wp-block-playlist__tracklist-artist-is-hidden': ! showArtists,
			'wp-block-playlist__tracklist-length-is-hidden':
				! showTrackLength,
			'wp-block-playlist__tracklist-show-numbers': showNumbers,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ 'core/playlist-track' ],
		__experimentalAppenderTagName: 'li',
		renderAppender: InnerBlocks.ButtonBlockAppender,
	} );

	return <ol { ...innerBlocksProps } />;
};

export default PlaylistTracklistEdit;
