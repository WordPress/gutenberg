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
		tracks,
		images,
		showNumbers,
		tagName: TagName = showNumbers ? 'ol' : 'ul',
	} = attributes;

	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return (
		<figure { ...innerBlocksProps }>
			<>
				{ !! tracks && !! tracks[ 0 ]?.id && (
					<>
						<div className="wp-block-playlist__current-item">
							{ images && tracks[ 0 ]?.image && (
								<img
									src={ tracks[ 0 ].image }
									alt=""
									width="70px"
									height="70px"
								/>
							) }
							<div>
								{ tracks[ 0 ]?.album && (
									<span className="wp-block-playlist__item-album">
										{ tracks[ 0 ]?.album }
									</span>
								) }
								{ tracks[ 0 ]?.artist && (
									<span className="wp-block-playlist__item-artist">
										{ tracks[ 0 ]?.artist }
									</span>
								) }
							</div>
						</div>
						<audio
							controls="controls"
							src={ tracks[ 0 ].url }
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
