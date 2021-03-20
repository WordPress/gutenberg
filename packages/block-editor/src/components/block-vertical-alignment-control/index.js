/**
 * Internal dependencies
 */
import BlockVerticalAlignmentUI from './ui';

export function BlockVerticalAlignmentControl( props ) {
	return <BlockVerticalAlignmentUI { ...props } isToolbar={ false } />;
}

export function BlockVerticalAlignmentToolbar( props ) {
	return <BlockVerticalAlignmentUI { ...props } isToolbar />;
}
