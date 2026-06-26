/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Tracks from './tracks';

export default function save( { attributes } ) {
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
		width,
		height,
	} = attributes;
	// Match the editor: an explicit (non-`auto`) aspect ratio keeps the
	// converted GIF video from briefly blowing up to a runaway height while the
	// poster/metadata load, which would otherwise flash on the front end and
	// cause layout shift. The width/height attributes only yield
	// `aspect-ratio: auto W/H`, whose `auto` keyword is unreliable during load.
	const aspectRatio =
		width && height ? `${ width } / ${ height }` : undefined;
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
					width={ width }
					height={ height }
					style={ aspectRatio ? { aspectRatio } : undefined }
				>
					<Tracks tracks={ tracks } />
				</video>
			) }
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content
					className={ __experimentalGetElementClassName( 'caption' ) }
					tagName="figcaption"
					value={ caption }
				/>
			) }
		</figure>
	);
}
