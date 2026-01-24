/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal Dependencies
 */

export default function Edit( { context } ) {
	const dialogId = context[ 'dialog/id' ] ?? null;
	const blockProps = useBlockProps( {
		'aria-haspopup': 'dialog',
		'aria-controls': dialogId,
		'aria-expanded': '',
		type: 'button',
	} );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		templateLock: false,
	} );

	return <button { ...innerBlocksProps } />;
}
