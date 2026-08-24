import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function TableRowEdit() {
	return <tr { ...useInnerBlocksProps() } />;
}
