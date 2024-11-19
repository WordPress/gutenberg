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
		currentTrack,
		tracks,
		showImages,
		showNumbers,
		tagName: TagName = showNumbers ? 'ol' : 'ul',
	} = attributes;

	/**
	 * Find the track matching the currentTrack ID.
	 * If the currentTrack ID is not set, find the next valid track.
	 */
	const activeTrack =
		tracks?.find( ( track ) => track?.id === currentTrack ) ||
		tracks?.find( ( track ) => track?.id );

	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return (
		<figure { ...innerBlocksProps }>
			<>
				{ !! tracks && !! activeTrack?.id && (
					<>
						<div className="wp-block-playlist__current-item">
							{ showImages && activeTrack?.image && (
								<img
									className="wp-block-playlist__item-image"
									src={ activeTrack.image }
									alt=""
									width="70px"
									height="70px"
								/>
							) }
							<div>
								{ activeTrack?.title && (
									<span className="wp-block-playlist__item-title">
										{ activeTrack?.title }
									</span>
								) }
								<div className="wp-block-playlist__current-item-artist-album">
									{ activeTrack?.artist && (
										<span className="wp-block-playlist__item-artist">
											{ activeTrack?.artist }
										</span>
									) }
									{ activeTrack?.album && (
										<span className="wp-block-playlist__item-album">
											{ activeTrack?.album }
										</span>
									) }
								</div>
							</div>
						</div>
						<audio
							controls="controls"
							src={ activeTrack.url }
							tabIndex={ 0 }
						/>
					</>
				) }
			</>
			<TagName className="wp-block-playlist__tracklist">
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
