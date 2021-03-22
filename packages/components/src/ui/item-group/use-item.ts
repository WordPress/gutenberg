/**
 * External dependencies
 */
import { cx } from '@wp-g2/styles';
import { useContextSystem } from '@wp-g2/context';
import type { ViewOwnProps } from '@wp-g2/create-styles';

/**
 * Internal dependencies
 */
import * as styles from './styles';
import { useItemGroupContext } from './context';

export interface Props {
	action?: boolean;
	size?: 'small' | 'medium' | 'large';
}

export function useItem( props: ViewOwnProps< Props, 'div' > ) {
	const {
		action = false,
		as: asProp,
		className,
		role = 'listitem',
		size: sizeProp,
		...otherProps
	} = useContextSystem( props, 'Item' );

	const { spacedAround, size: contextSize } = useItemGroupContext();

	const size = sizeProp || contextSize;

	const as = asProp || action ? 'button' : 'div';

	const classes = cx(
		action && styles.unstyledButton,
		styles.itemSizes[ size ] || styles.itemSizes.medium,
		styles.item,
		spacedAround && styles.spacedAround,
		className
	);

	return {
		as,
		className: classes,
		role,
		...otherProps,
	};
}
