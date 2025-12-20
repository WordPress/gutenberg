/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { textAlign, citation, value } = attributes;
	const shouldShowCitation = ! RichText.isEmpty( citation );

	return (
		<figure
			{ ...useBlockProps.save( {
				className: clsx( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ),
			} ) }
		>
			<blockquote>
				<RichText.Content tagName="p" value={ value } />
				{ shouldShowCitation && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		</figure>
	);
}
