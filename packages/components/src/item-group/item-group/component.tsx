/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useItemGroup } from './hook';
import { ItemGroupContext, useItemGroupContext } from '../context';
import { View } from '../../view';
import type { ItemGroupProps } from '../types';

function ItemGroup(
	props: WordPressComponentProps< ItemGroupProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		isBordered,
		isSeparated,
		size: sizeProp,
		...otherProps
	} = useItemGroup( props );

	const { size: contextSize } = useItemGroupContext();

	const spacedAround = ! isBordered && ! isSeparated;
	const size = sizeProp || contextSize;

	const contextValue = {
		spacedAround,
		size,
	};

	return (
		<ItemGroupContext.Provider value={ contextValue }>
			<View { ...otherProps } ref={ forwardedRef } />
		</ItemGroupContext.Provider>
	);
}

export default contextConnect( ItemGroup, 'ItemGroup' );
