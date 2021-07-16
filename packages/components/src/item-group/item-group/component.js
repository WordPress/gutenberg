/**
 * Internal dependencies
 */
import { contextConnect } from '../../ui/context';
import { ItemGroupContext, useItemGroupContext } from '../context';
import { useItemGroup } from './hook';
import { View } from '../../view';

function ItemGroup( props, ref ) {
	const { bordered, separated, size: sizeProp, ...otherProps } = useItemGroup(
		props
	);

	const { size: contextSize } = useItemGroupContext();

	const spacedAround = ! bordered && ! separated;
	const size = sizeProp || contextSize;

	const contextValue = {
		spacedAround,
		size,
	};

	return (
		<ItemGroupContext.Provider value={ contextValue }>
			<View { ...otherProps } ref={ ref } />
		</ItemGroupContext.Provider>
	);
}

export default contextConnect( ItemGroup, 'ItemGroup' );
