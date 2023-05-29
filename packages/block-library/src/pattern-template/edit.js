/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

// This template is temporary, to make the block easier to test.
const TEMPLATE = [
	[
		'core/pattern-template-content',
		{},
		[
			[ 'core/heading', { content: 'Call to action.' } ],
			[ 'core/paragraph', { content: 'Test paragraph.' } ],
			[
				'core/buttons',
				{},
				[ [ 'core/button', { label: 'Click here!' } ] ],
			],
		],
	],
];

export default function PatternTemplateEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: false,
		template: TEMPLATE,
	} );

	return <div { ...innerBlocksProps } />;
}
