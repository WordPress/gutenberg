/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save() {
	// Save a bare button — PHP injects the label and IAPI directives.
	const blockProps = useBlockProps.save( {
		type: 'button',
		role: 'tab',
	} );

	return <button { ...blockProps } />;
}
