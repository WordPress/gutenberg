/**
 * External dependencies
 */
import { cx } from '@emotion/css';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../context';
import * as styles from './styles';
import { useItemGroupContext } from './context';

export interface Props {
	action?: boolean;
	size?: 'small' | 'medium' | 'large';
}

export function useItem( props: PolymorphicComponentProps< Props, 'div' > ) {
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
