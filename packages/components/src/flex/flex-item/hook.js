/**
 * External dependencies
 */
import { css } from '@emotion/react';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../../ui/context';
import { useFlexContext } from '../context';
import * as styles from '../styles';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../../ui/context').PolymorphicComponentProps<import('../types').FlexItemProps, 'div'>} props
 */
export function useFlexItem( props ) {
	const {
		className,
		display: displayProp,
		isBlock = false,
		...otherProps
	} = useContextSystem( props, 'FlexItem' );
	const sx = {};

	const contextDisplay = useFlexContext().flexItemDisplay;

	sx.Base = css( {
		display: displayProp || contextDisplay,
	} );

	const cx = useCx();

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
