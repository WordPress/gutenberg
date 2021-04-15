/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { value, citation } = attributes;
	const shouldShowCitation = ! RichText.isEmpty( citation );

	return (
		<figure { ...useBlockProps.save() }>
			<blockquote>
				<RichText.Content value={ value } multiline />
				{ shouldShowCitation && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		</figure>
	);
}
