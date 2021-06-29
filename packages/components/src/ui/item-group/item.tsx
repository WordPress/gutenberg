/**
 * Internal dependencies
 */
import { contextConnect, PolymorphicComponentProps } from '../context';
import type { ItemProps } from './types';
import { useItem } from './use-item';
import { ItemWrapper } from './styles';

function Item( props: PolymorphicComponentProps< ItemProps, 'div' > ) {
	const contextProps = useItem( props );

	return <ItemWrapper { ...contextProps } />;
}

const ConnectedItem = contextConnect( Item, 'Item' );

export default ConnectedItem;
