/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ElementType } from 'react';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import * as styles from '../styles';
import { useItemGroupContext } from '../context';
import { useCx } from '../../utils/hooks/use-cx';
import type { ItemProps } from '../types';

export function useItem( props: WordPressComponentProps< ItemProps, 'div' > ) {
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

	const wrapperClassName = cx( styles.itemWrapper );

	return {
		as,
		className: classes,
		wrapperClassName,
		role,
		...otherProps,
	};
}
