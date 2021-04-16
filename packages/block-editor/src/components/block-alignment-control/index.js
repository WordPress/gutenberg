/**
 * Internal dependencies
 */
import BlockAlignmentUI from './ui';

export function BlockAlignmentControl( props ) {
	return <BlockAlignmentUI { ...props } isToolbar={ false } />;
}

export function BlockAlignmentToolbar( props ) {
	return <BlockAlignmentUI { ...props } isToolbar />;
}
