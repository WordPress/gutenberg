/**
 * WordPress dependencies
 */
import { InnerBlocks, RichText } from '@wordpress/block-editor';

const v1 = {
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
	save( { attributes } ) {
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
