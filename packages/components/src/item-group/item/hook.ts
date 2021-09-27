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

function useDeprecatedProps( {
	as,
	isAction = false,
	...otherProps
}: WordPressComponentProps< ItemProps, 'div' > ) {
	let computedAs = as;

	if ( isAction ) {
		computedAs ??= 'button';
	}

	return {
		...otherProps,
		as: computedAs,
	};
}

export function useItem( props: WordPressComponentProps< ItemProps, 'div' > ) {
	const {
		as: asProp,
		className,
		onClick,
		role = 'listitem',
		size: sizeProp,
		...otherProps
	} = useContextSystem( useDeprecatedProps( props ), 'Item' );

	const { spacedAround, size: contextSize } = useItemGroupContext();

	const size = sizeProp || contextSize;

	const as =
		asProp ||
		( ( typeof onClick !== 'undefined'
			? 'button'
			: 'div' ) as ElementType );

	const cx = useCx();

	const classes = cx(
		as === 'button' && styles.unstyledButton,
		styles.itemSizes[ size ] || styles.itemSizes.medium,
		styles.item,
		spacedAround && styles.spacedAround,
		className
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
