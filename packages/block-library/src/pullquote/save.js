/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { citation, value } = attributes;
	const shouldShowCitation = ! RichText.isEmpty( citation );

	return (
		<figure { ...useBlockProps.save() }>
			<blockquote>
				<RichText.Content tagName="p" value={ value } />
				{ shouldShowCitation && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		</figure>
	);
}
