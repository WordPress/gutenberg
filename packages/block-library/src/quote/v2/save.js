/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { attribution } = attributes;
	const wrapperProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save();
	const allBlockProps = useInnerBlocksProps.save( wrapperProps );

	const hasAttribution = ! RichText.isEmpty( attribution );
	return hasAttribution ? (
		<figure { ...wrapperProps }>
			<blockquote { ...innerBlocksProps } />
			<figcaption>
				<RichText.Content value={ attribution } />
			</figcaption>
		</figure>
	) : (
		<blockquote { ...allBlockProps } />
	);
}
