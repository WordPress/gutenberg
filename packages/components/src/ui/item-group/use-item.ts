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
import { useItemGroupContext } from './context';
import type { ItemProps } from './types';

export function useItem(
	props: PolymorphicComponentProps< ItemProps, 'div' >
) {
	const {
		isAction = false,
		as: asProp,
		role = 'listitem',
		size: sizeProp,
		...otherProps
	} = useContextSystem( props, 'Item' );

	const { spacedAround, size: contextSize } = useItemGroupContext();

	const size = sizeProp || contextSize;

	const as = ( asProp || isAction ? 'button' : 'div' ) as ElementType;

	return {
		as,
		role,
		size,
		spacedAround,
		isAction,
		...otherProps,
	};
}
