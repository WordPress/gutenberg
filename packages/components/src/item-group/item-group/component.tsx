import type { ForwardedRef } from 'react';
import { useRef } from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useItemGroup } from './hook';
import { ItemGroupContext, useItemGroupContext } from '../context';
import { View } from '../../view';
import type { ItemGroupProps } from '../types';

function UnconnectedItemGroup(
	props: WordPressComponentProps< ItemGroupProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		isBordered,
		isSeparated,
		size: sizeProp,
		...otherProps
	} = useItemGroup( props );
	const itemGroupRef = useRef< HTMLElement >( null );
	const refs = useMergeRefs( [ itemGroupRef, forwardedRef ] );

	const { size: contextSize } = useItemGroupContext();

	const spacedAround = ! isBordered && ! isSeparated;
	const size = sizeProp || contextSize;

	const contextValue = {
		itemGroupRef,
		isList: otherProps.role === 'list',
		spacedAround,
		size,
	};

	return (
		<ItemGroupContext.Provider value={ contextValue }>
			<View { ...otherProps } ref={ refs } />
		</ItemGroupContext.Provider>
	);
}

/**
 * `ItemGroup` displays a list of `Item`s grouped and styled together.
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
export const ItemGroup = contextConnect( UnconnectedItemGroup, 'ItemGroup' );

export default ItemGroup;
