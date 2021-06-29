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
import { ItemGroupWrapper } from './styles';
import type { ItemGroupProps } from './types';

function ItemGroup(
	props: PolymorphicComponentProps< ItemGroupProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		bordered,
		separated,
		size: sizeProp,
		role = 'list',
		...otherProps
	} = useContextSystem( props, 'ItemGroup' );

	const { size: contextSize } = useItemGroupContext();

	const spacedAround = ! bordered && ! separated;
	const size = sizeProp || contextSize;

	const contextValue = {
		spacedAround,
		size,
	};

	return (
		<ItemGroupContext.Provider value={ contextValue }>
			<ItemGroupWrapper
				role={ role }
				bordered={ bordered }
				separated={ separated }
				{ ...otherProps }
				ref={ forwardedRef }
			/>
		</ItemGroupContext.Provider>
	);
}

export default contextConnect( ItemGroup, 'ItemGroup' );
