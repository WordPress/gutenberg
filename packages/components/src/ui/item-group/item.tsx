/**
 * Internal dependencies
 */
import { contextConnect, PolymorphicComponentProps } from '../context';
import type { ItemProps } from './types';
import { useItem } from './use-item';
import { ItemView } from './styles';

function Item( props: PolymorphicComponentProps< ItemProps, 'div' > ) {
	const contextProps = useItem( props );

	return <ItemView { ...contextProps } />;
}

const ConnectedItem = contextConnect( Item, 'Item' );

export default ConnectedItem;
