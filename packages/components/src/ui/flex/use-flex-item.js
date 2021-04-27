/**
 * External dependencies
 */
import { css, cx, ui } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import * as styles from './styles';

/**
 * @param {import('../context').ViewOwnProps<import('./types').FlexItemProps, 'div'>} props
 */
export function useFlexItem( props ) {
	const {
		className,
		display: displayProp,
		isBlock = false,
		...otherProps
	} = useContextSystem( props, 'FlexItem' );
	const sx = {};

	sx.Base = css( {
		display: displayProp || ui.get( 'flexItemDisplay' ),
	} );

	const classes = cx(
		styles.Item,
		sx.Base,
		isBlock && styles.block,
		className
	);

	return {
		...otherProps,
		className: classes,
	};
}
