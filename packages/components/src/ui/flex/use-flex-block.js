/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import { useFlexItem } from './use-flex-item';

/**
 * @param {import('../context').ViewOwnProps<import('./types').FlexBlockProps, 'div'>} props
 */
export function useFlexBlock( props ) {
	const otherProps = useContextSystem( props, 'FlexBlock' );
	const flexItemProps = useFlexItem( { isBlock: true, ...otherProps } );

	return flexItemProps;
}
