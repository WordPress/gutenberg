/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		textAlign,
		citation,
		value,
		metadata: { bindings = {} } = {},
	} = attributes;
	const displayCitation =
		! RichText.isEmpty( citation ) ||
		!! bindings.citation ||
		bindings.__default?.source === 'core/pattern-overrides';

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
				{ displayCitation && (
					<RichText.Content tagName="cite" value={ citation } />
				) }
			</blockquote>
		</figure>
	);
}
