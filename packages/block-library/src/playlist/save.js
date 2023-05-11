/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		ids,
		order,
		tracklist,
		tracknumbers,
		images,
		artists,
		tagName: TagName = tracknumbers ? 'ol' : 'ul',
	} = attributes;

	if ( ! ids ) {
		return;
	}

	const sortedIds = ids;
	if ( 'ASC' === order ) {
		sortedIds.sort( ( a, b ) => a.id - b.id );
	} else {
		sortedIds.sort( ( a, b ) => b.id - a.id );
	}

	const currentTrack = sortedIds[ 0 ];

	return (
		<>
			<figure { ...useBlockProps.save() }>
				<div className="wp-block-playlist__current-item">
					{ images && (
						<img
							src={ currentTrack?.image.src }
							width="48px"
							height="64px"
							alt=""
						/>
					) }
					<ul>
						<li className="wp-block-playlist__item-title">
							{ '\u201c' + currentTrack?.title + '\u201d' }
						</li>
						<li className="wp-block-playlist__item-album">
							{ currentTrack?.album }
						</li>
						<li className="wp-block-playlist__item-artist">
							{ currentTrack?.artist }
						</li>
					</ul>
					<audio
						controls="controls"
						src={ currentTrack.url }
						autoPlay={ true }
					/>
				</div>
				<TagName
					className="wp-block-playlist__tracks"
					hidden={ ! tracklist ? true : false }
				>
					{ sortedIds.map( ( track ) => (
						<li
							key={ track.id }
							className="wp-block-playlist__item"
						>
							<button
								aria-current={ track.id === currentTrack?.id }
								data-playlist-track-url={ track.url }
								data-playlist-track-title={ track.title }
								data-playlist-track-artist={ track.artist }
								data-playlist-track-album={ track.album }
								data-playlist-track-image-src={
									track.image.src
								}
							>
								<span className="wp-block-playlist__item-title">
									{ /* Only use quotation marks for titles when they are
									 * combined with the artist name,
									 * @see https://core.trac.wordpress.org/changeset/55251
									 */ }
									{ artists
										? '\u201c' + track?.title + '\u201d'
										: track?.title }
								</span>
								{ artists && track.artist && (
									<span className="wp-block-playlist__item-artist">
										{ '\u2014 ' + track.artist }
									</span>
								) }
								<span className="wp-block-playlist__item-length">
									{ track?.length }
								</span>
							</button>
						</li>
					) ) }
				</TagName>
			</figure>
		</>
	);
}
