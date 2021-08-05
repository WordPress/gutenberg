/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InnerBlocks,
} from '@wordpress/block-editor';

import { __ } from '@wordpress/i18n';

const TEMPLATE = [
	[
		'core/heading',
		{
			placeholder: __( 'Add your Widget title' ),
			className: 'widget-title',
		},
	],
];

export default function Edit() {
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-widget-box__inner-blocks',
		},
		{
			template: TEMPLATE,
			renderAppender: InnerBlocks.ButtonBlockAppender,
		}
	);

	const blockProps = useBlockProps();

	return (
		<div { ...blockProps }>
			<div { ...innerBlocksProps } />
		</div>
	);
}
