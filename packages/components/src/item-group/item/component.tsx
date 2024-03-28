/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { ItemProps as ItemBaseProps } from '../types';
import { useItem } from './hook';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { View } from '../../view';

export type ItemProps = WordPressComponentProps< ItemBaseProps, 'div' >;

function UnconnectedItem(
	props: ItemProps,
	forwardedRef: ForwardedRef< any >
) {
	const { role, wrapperClassName, ...otherProps } = useItem( props );

	return (
		<div role={ role } className={ wrapperClassName }>
			<View { ...otherProps } ref={ forwardedRef } />
		</div>
	);
}

/**
 * `Item` is used in combination with `ItemGroup` to display a list of items
 * grouped and styled together.
 *
 * ```jsx
 * import {
 *   __experimentalItemGroup as ItemGroup,
 *   __experimentalItem as Item,
 * } from '@wordpress/components';
 *
 * function Example() {
 *   return (
 *     <ItemGroup>
 *       <Item>Code</Item>
 *       <Item>is</Item>
 *       <Item>Poetry</Item>
 *     </ItemGroup>
 *   );
 * }
 * ```
 */
export const Item = contextConnect( UnconnectedItem, 'Item' );

export default Item;
