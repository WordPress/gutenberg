/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save( {
		className: 'wp-block-tabs-menu-item__template',
		type: 'button',
		role: 'tab',
	} );

	return <button { ...blockProps } />;
}
