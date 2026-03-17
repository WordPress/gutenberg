/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save( {
		type: 'button',
		role: 'tab',
	} );

	return <button { ...blockProps } />;
}
