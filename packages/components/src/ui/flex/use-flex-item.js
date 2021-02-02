/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { css, cx, ui } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import * as styles from './flex-styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').FlexItemProps, 'div'>} props
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
		display: displayProp || ui.get( 'FlexItemDisplay' ),
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
