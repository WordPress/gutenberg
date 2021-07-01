/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	PolymorphicComponentProps,
} from '../context';
import { ItemGroupContext, useItemGroupContext } from './context';
import { ItemGroupView } from './styles';
import type { ItemGroupProps } from './types';

const DEFAULT_PROPS = {
	size: 'medium' as const,
	isRounded: false,
};

function ItemGroup(
	props: PolymorphicComponentProps< ItemGroupProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		isBordered = false,
		isSeparated = false,
		size: sizeProp,
		role = 'list',
		...otherProps
	} = useContextSystem( props, 'ItemGroup' );

	const { size: contextSize } = useItemGroupContext();

	const spacedAround = ! isBordered && ! isSeparated;
	const size = sizeProp || contextSize;

	const contextValue = {
		spacedAround,
		size,
	};

	return (
		<ItemGroupContext.Provider value={ contextValue }>
			<ItemGroupView
				{ ...DEFAULT_PROPS }
				role={ role }
				isBordered={ isBordered }
				isSeparated={ isSeparated }
				{ ...otherProps }
				ref={ forwardedRef }
			/>
		</ItemGroupContext.Provider>
	);
}

export default contextConnect( ItemGroup, 'ItemGroup' );
