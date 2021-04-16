/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';

/**
 * Internal dependencies
 */
import { useFlexItem } from './use-flex-item';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexBlockProps, 'div'>} props
 */
export function useFlexBlock( props ) {
	const otherProps = useContextSystem( props, 'FlexBlock' );
	const flexItemProps = useFlexItem( { isBlock: true, ...otherProps } );

	return flexItemProps;
}
