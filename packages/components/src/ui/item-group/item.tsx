/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, PolymorphicComponentProps } from '../context';
import type { ItemProps } from './types';
import { useItem } from './use-item';
import { ItemView } from './styles';

function Item(
	props: PolymorphicComponentProps< ItemProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const contextProps = useItem( props );

	return <ItemView ref={ forwardedRef } { ...contextProps } />;
}

const ConnectedItem = contextConnect( Item, 'Item' );

export default ConnectedItem;
