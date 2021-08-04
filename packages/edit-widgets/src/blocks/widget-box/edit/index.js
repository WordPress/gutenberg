/**
 * WordPress dependencies
 */
import { __experimentalUseInnerBlocksProps as useInnerBlocksProps } from '@wordpress/block-editor';

const TEMPLATE = [
	[ 'core/heading', { placeholder: 'Add your Widget title' } ],
];

export default function Edit() {
	const innerBlocksProps = useInnerBlocksProps(
		{
			className: 'wp-block-box__inner-blocks',
		},
		{
			template: TEMPLATE,
		}
	);

	return <div { ...innerBlocksProps } />;
}
