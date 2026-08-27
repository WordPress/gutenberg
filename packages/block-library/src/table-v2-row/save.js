import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function TableRowSave() {
	return <tr { ...useInnerBlocksProps.save() } />;
}
