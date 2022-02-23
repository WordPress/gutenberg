/**
 * External dependencies
 */
import type { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

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
		as: asProp,
		className,
		onClick,
		role = 'listitem',
		size: sizeProp,
		...otherProps
	} = useContextSystem( props, 'Item' );

	const { spacedAround, size: contextSize } = useItemGroupContext();

	const size = sizeProp || contextSize;

	const as =
		asProp ||
		( ( typeof onClick !== 'undefined'
			? 'button'
			: 'div' ) as ElementType );

	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				as === 'button' && styles.unstyledButton,
				styles.itemSizes[ size ] || styles.itemSizes.medium,
				styles.item,
				spacedAround && styles.spacedAround,
				className
			),
		[ as, className, cx, size, spacedAround ]
	);

	const wrapperClassName = cx( styles.itemWrapper );

	return {
		as,
		className: classes,
		onClick,
		wrapperClassName,
		role,
		...otherProps,
	};
}
