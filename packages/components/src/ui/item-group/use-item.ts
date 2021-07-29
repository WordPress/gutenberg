/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ElementType } from 'react';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
// eslint-disable-next-line no-duplicate-imports
import type { PolymorphicComponentProps } from '../context';
import * as styles from './styles';
import { useItemGroupContext } from './context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ItemProps } from './types';

export function useItem(
	props: PolymorphicComponentProps< ItemProps, 'div' >
) {
	const {
		isAction = false,
		as: asProp,
		className,
		role = 'listitem',
		size: sizeProp,
		...otherProps
	} = useContextSystem( props, 'Item' );

	const { spacedAround, size: contextSize } = useItemGroupContext();

	const size = sizeProp || contextSize;

	const as = ( asProp || isAction ? 'button' : 'div' ) as ElementType;

	const cx = useCx();

	const classes = cx(
		isAction && styles.unstyledButton,
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
