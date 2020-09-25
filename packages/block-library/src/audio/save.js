/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { autoplay, caption, loop, preload, src } = attributes;

	return (
		src && (
			<figure { ...getBlockProps() }>
				<audio
					controls="controls"
					src={ src }
					autoPlay={ autoplay }
					loop={ loop }
					preload={ preload }
				/>
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		)
	);
}
