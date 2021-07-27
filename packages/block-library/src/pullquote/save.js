/**
 * External dependencies
 */
import classnames from 'classnames';

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
				className: classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ),
			} ) }
		>
			<blockquote>
				<RichText.Content value={ value } multiline />
				{ shouldShowCitation && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		</figure>
	);
}
