import { InnerBlocks, RichText } from '@wordpress/block-editor';
import type { BlockSaveProps } from '@wordpress/blocks';
import type { Attributes } from './types';

export default function save( { attributes }: BlockSaveProps< Attributes > ) {
	return (
		<>
			<RichText.Content
				tagName="h2"
				className="widget-title"
				value={ attributes.title }
			/>
			<div className="wp-widget-group__inner-blocks">
				<InnerBlocks.Content />
			</div>
		</>
	);
}
