import { InnerBlocks, RichText } from '@wordpress/block-editor';
import type { BlockDeprecation, BlockSaveProps } from '@wordpress/blocks';
import type { Attributes } from './types';

const v1: BlockDeprecation< Attributes > = {
	attributes: {
		title: {
			type: 'string',
		},
	},
	supports: {
		html: false,
		inserter: true,
		customClassName: true,
		reusable: false,
	},
	save( { attributes }: BlockSaveProps< Attributes > ) {
		return (
			<>
				<RichText.Content
					tagName="h2"
					className="widget-title"
					value={ attributes.title }
				/>
				<InnerBlocks.Content />
			</>
		);
	},
};

export default [ v1 ];
