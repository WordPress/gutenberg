/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { autoplay, caption, loop, preload, src } = attributes;

	return (
		src && (
			<figure { ...useBlockProps.save({
				style:{
					borderRadius: attributes.borderRadius
				}
			}) }>
				<audio
					controls="controls"
					src={ src }
					autoPlay={ autoplay }
					loop={ loop }
					preload={ preload }
				/>
				<RichText.Content
					tagName='p'
					value={attributes.captionContent}
				/>
				{ ! RichText.isEmpty( caption ) && (
					<RichText.Content
						tagName="figcaption"
						value={ caption }
						className={ __experimentalGetElementClassName(
							'caption'
						) }
					/>
				) }
			</figure>
		)
	);
}
