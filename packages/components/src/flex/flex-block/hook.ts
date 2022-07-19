/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useFlexItem } from '../flex-item';
import type { FlexBlockProps } from '../types';

export function useFlexBlock(
	props: WordPressComponentProps< FlexBlockProps, 'div' >
) {
	const otherProps = useContextSystem( props, 'FlexBlock' );
	const flexItemProps = useFlexItem( { isBlock: true, ...otherProps } );

	return flexItemProps;
}
