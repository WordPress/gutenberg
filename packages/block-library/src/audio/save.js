/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { autoplay, caption, loop, preload, src, transcript } = attributes;

	const displayCaption = ! RichText.isEmpty( caption );

	return (
		<figure { ...useBlockProps.save() }>
			{ src && (
				<audio
					controls="controls"
					src={ src }
					autoPlay={ autoplay }
					loop={ loop }
					preload={ preload }
				/>
			) }
			{ displayCaption && (
				<RichText.Content
					tagName="figcaption"
					value={ caption }
					className={ __experimentalGetElementClassName( 'caption' ) }
				/>
			) }
			{ ! RichText.isEmpty( transcript ) && (
				<RichText.Content
					tagName="p"
					className="wp-block-audio__transcript-text"
					value={ transcript }
				/>
			) }
		</figure>
	);
}
