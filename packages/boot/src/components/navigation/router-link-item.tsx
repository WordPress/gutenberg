/**
 * External dependencies
 */
import { createLink } from '@tanstack/react-router';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { __experimentalItem as Item } from '@wordpress/components';
import type { ItemProps } from '@wordpress/components/build-types/item-group/types';
import type { WordPressComponentProps } from '@wordpress/components/build-types/context';

function AnchorOnlyItem(
	props: WordPressComponentProps< ItemProps, 'a' >,
	forwardedRef: ForwardedRef< HTMLAnchorElement >
) {
	return <Item as="a" ref={ forwardedRef } { ...props } />;
}

const RouterLinkItem = createLink( forwardRef( AnchorOnlyItem ) );

export default RouterLinkItem;
