/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import type { ItemProps } from '../types';
import { useItem } from './hook';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { View } from '../../view';

function Item(
	props: WordPressComponentProps< ItemProps, 'div' >,
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
