/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import type { ItemProps } from '../types';
import { useItem } from './hook';
import { contextConnect, PolymorphicComponentProps } from '../../ui/context';
import { View } from '../../view';

function Item(
	props: PolymorphicComponentProps< ItemProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const { role, wrapperClassName, ...otherProps } = useItem( props );

	return (
		<div role={ role } className={ wrapperClassName }>
			<View { ...otherProps } ref={ forwardedRef } />
		</div>
	);
}

export default contextConnect( Item, 'Item' );
