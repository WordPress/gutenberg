/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks, RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { caption, captionPosition, textAlign } = attributes;
	const hasCaption = !! caption?.trim();

	const blockProps = useBlockProps.save( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			[ `is-caption-${ captionPosition }` ]: true,
		} ),
	} );

	const figCaptionElement = hasCaption && (
		<RichText.Content
			tagName="figcaption"
			className="wp-element-caption"
			value={ caption }
		/>
	);

	return (
		<figure { ...blockProps }>
			{ captionPosition === 'top' && figCaptionElement }
			<div className="wp-block-figure__content">
				<InnerBlocks.Content />
			</div>
			{ captionPosition === 'bottom' && figCaptionElement }
		</figure>
	);
}
