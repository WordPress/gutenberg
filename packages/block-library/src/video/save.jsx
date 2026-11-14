import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetDimensionsClassesAndStyles as getDimensionsClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
} from '@wordpress/block-editor';
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
	const borderProps = getBorderClassesAndStyles( attributes );
	const videoStyle = {
		...( aspectRatio && { aspectRatio } ),
		...getDimensionsClassesAndStyles( attributes ).style,
		...getShadowClassesAndStyles( attributes ).style,
		...borderProps.style,
	};
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
					className={ borderProps.className }
					playsInline={ playsInline }
					width={ width }
					height={ height }
					style={
						Object.keys( videoStyle ).length
							? videoStyle
							: undefined
					}
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
