/**
 * WordPress dependencies
 */
import {
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
	useBlockProps,
	InnerBlocks,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { HEADING_PLACEHOLDER } from './constants';

const TEMPLATE = [ HEADING_PLACEHOLDER ];

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
