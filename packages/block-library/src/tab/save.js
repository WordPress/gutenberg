/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { title } = attributes;

	return (
		<div { ...useBlockProps.save() }>
			<div className="wp-block-tab__title">{ title }</div>
			<div className="wp-block-tab__content">
				<InnerBlocks.Content />
			</div>
		</div>
	);
}
