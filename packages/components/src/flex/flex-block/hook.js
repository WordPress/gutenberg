/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { useFlexItem } from '../flex-item';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').FlexBlockProps, 'div'>} props
 */
export function useFlexBlock( props ) {
	const otherProps = useContextSystem( props, 'FlexBlock' );
	const flexItemProps = useFlexItem( { isBlock: true, ...otherProps } );

	return flexItemProps;
}
