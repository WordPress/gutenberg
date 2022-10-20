/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Tracks from './tracks';

const { attributes: blockAttributes } = metadata;
const v1 = {
	attributes: blockAttributes,
	save( { attributes } ) {
		const {
			autoplay,
			caption,
			controls,
			loop,
			muted,
			poster,
			preload,
			src,
			playsInline,
			tracks,
		} = attributes;
		return (
			<figure { ...useBlockProps.save() }>
				{ src && (
					<video
						autoPlay={ autoplay }
						controls={ controls }
						loop={ loop }
						muted={ muted }
						poster={ poster }
						preload={ preload !== 'metadata' ? preload : undefined }
						src={ src }
						playsInline={ playsInline }
					>
						<Tracks tracks={ tracks } />
					</video>
				) }
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		);
	},
};

const deprecated = [ v1 ];

export default deprecated;
