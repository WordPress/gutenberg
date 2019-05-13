/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { autoplay, caption, controls, loop, muted, poster, preload, playsInline, sources } = attributes;
	return (
		<figure>
			{ !! sources.length &&
				<video
					autoPlay={ autoplay }
					controls={ controls }
					loop={ loop }
					muted={ muted }
					poster={ poster }
					preload={ preload !== 'metadata' ? preload : undefined }
					playsInline={ playsInline }
				>
					{ sources.map( ( source ) => {
						return (
							<source
								key={ source.src }
								src={ source.src }
								type={ source.type }
							/>
						);
					} ) }
				</video>
			}
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
