/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { autoplay, caption, loop, preload, src, muted } = attributes;

	return (
		src && (
			<figure { ...useBlockProps.save() }>
				<audio
					controls="controls"
					src={ src }
					autoPlay={ autoplay }
					loop={ loop }
					preload={ preload }
					muted={ muted }
				/>
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content tagName="figcaption" value={ caption } />
				) }
			</figure>
		)
	);
}
