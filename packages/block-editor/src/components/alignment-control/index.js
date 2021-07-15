/**
 * Internal dependencies
 */
import AlignmentUI from './ui';

export function AlignmentControl( props ) {
	return <AlignmentUI { ...props } isToolbar={ false } />;
}

export function AlignmentToolbar( props ) {
	return <AlignmentUI { ...props } isToolbar />;
}
