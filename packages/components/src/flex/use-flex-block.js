/**
 * External dependencies
 */
import { cx } from '@wp-g2/styles';
import { useContextSystem } from '@wp-g2/context';

/**
 * Internal dependencies
 */
import { useFlexItem } from './use-flex-item';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexBlockProps, 'div'>} props
 */
export function useFlexBlock( props ) {
	const { className, ...otherProps } = useContextSystem( props, 'FlexBlock' );
	const classes = cx( 'components-flex__block', className );
	const flexItemProps = useFlexItem( {
		isBlock: true,
		className: classes,
		...otherProps,
	} );

	return flexItemProps;
}
