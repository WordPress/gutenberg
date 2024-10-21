/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	__experimentalGetElementClassName,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { autoplay, caption, loop, preload, src } = attributes;

	const borderProps = getBorderClassesAndStyles( attributes );

	return (
		src && (
			<figure { ...useBlockProps.save() }>
				<audio
					controls="controls"
					src={ src }
					autoPlay={ autoplay }
					loop={ loop }
					preload={ preload }
					className={ borderProps.className }
					style={ borderProps.style }
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
