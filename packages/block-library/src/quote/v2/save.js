/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, citation } = attributes;
	const blockProps = useBlockProps.save( {
		className: classNames( {
			[ `has-text-align-${ align }` ]: align,
		} ),
	} );
	return (
		<blockquote { ...blockProps }>
			<InnerBlocks.Content />
			{ ! RichText.isEmpty( citation ) && (
				<RichText.Content tagName="cite" value={ citation } />
			) }
		</blockquote>
	);
}
